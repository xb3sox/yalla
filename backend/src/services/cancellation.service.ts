import pool from '../config/database';
import logger from '../utils/logger';
import paymentModel, { stripe } from '../models/payment.model';
import rewardModel from '../models/reward.model';
import notificationModel from '../models/notification.model';
import waitlistService from './waitlist.service';
import { stateMachine } from '../models/reservation.model';

export interface RefundCalculation {
  refundAmount: number;
  percentage: number;
  tier: 'full' | 'partial' | 'none' | 'operational';
  hoursUntilStart: number;
}

export interface ExecuteCancellationInput {
  reservationId: string;
  canceledBy: 'participant' | 'yalla' | 'host';
  reason?: string;
  actorId: string;
  actorRole: string;
  ipAddress?: string;
  now?: Date;
}

export class CancellationService {
  /**
   * Calculates eligible refund amount and policy tier based on notice period or cancellation type.
   */
  calculateRefundAmount(
    reservation: any,
    eventStartTime: Date | string,
    canceledBy: 'participant' | 'yalla' | 'host' = 'participant',
    priceOverride?: number,
    now: Date = new Date()
  ): RefundCalculation {
    const basePrice = priceOverride ?? reservation?.price ?? reservation?.amount ?? 0;

    // Operational cancellation by Yalla or Host
    if (canceledBy === 'yalla' || canceledBy === 'host') {
      return {
        refundAmount: basePrice,
        percentage: 100,
        tier: 'operational',
        hoursUntilStart: 0,
      };
    }

    const startTimestamp = new Date(eventStartTime).getTime();
    const currentTimestamp = now.getTime();
    const hoursUntilStart = (startTimestamp - currentTimestamp) / (1000 * 60 * 60);

    if (hoursUntilStart > 48) {
      return {
        refundAmount: basePrice,
        percentage: 100,
        tier: 'full',
        hoursUntilStart,
      };
    } else if (hoursUntilStart >= 24) {
      return {
        refundAmount: Math.round(basePrice * 0.5),
        percentage: 50,
        tier: 'partial',
        hoursUntilStart,
      };
    } else {
      return {
        refundAmount: 0,
        percentage: 0,
        tier: 'none',
        hoursUntilStart,
      };
    }
  }

  /**
   * Executes atomic cancellation state transitions, Stripe refunds, waitlist backfilling,
   * immutable audit logging in audit_events, and notification dispatch.
   */
  async executeCancellation(input: ExecuteCancellationInput): Promise<any> {
    const client = await pool.connect();
    const now = input.now || new Date();

    try {
      await client.query('BEGIN');

      // 1. Lock reservation and joined experience
      const resQuery = `
        SELECT r.*, e.id AS exp_id, e.date AS exp_date, e.time AS exp_time, e.price AS exp_price, e.title AS exp_title, e.title_ar AS exp_title_ar
        FROM reservations r
        JOIN experiences e ON r.experience_id = e.id
        WHERE r.id = $1
        FOR UPDATE OF r
      `;
      const resResult = await client.query(resQuery, [input.reservationId]);

      if (resResult.rows.length === 0) {
        throw new Error('RESERVATION_NOT_FOUND');
      }

      const reservation = resResult.rows[0];

      // Validate authorization
      if (
        input.actorRole !== 'staff' &&
        input.actorRole !== 'admin' &&
        input.actorRole !== 'operations' &&
        input.actorRole !== 'support' &&
        reservation.participant_id !== input.actorId
      ) {
        throw new Error('FORBIDDEN');
      }

      // Check current state machine transitions
      const targetCancelledState =
        input.canceledBy === 'participant' ? 'cancelled_by_participant' : 'cancelled_by_yalla';

      if (!stateMachine.canTransition(reservation.state, targetCancelledState)) {
        throw new Error(`INVALID_STATE_TRANSITION: Cannot cancel reservation in state ${reservation.state}`);
      }

      // Fetch payment record if exists
      const paymentRes = await client.query(
        'SELECT * FROM payments WHERE reservation_id = $1 AND status = \'completed\' LIMIT 1',
        [input.reservationId]
      );
      const payment = paymentRes.rows[0] || null;

      // 2. Compute refund calculation using strict UTC ISO timestamp parsing
      const dateStr = typeof reservation.exp_date === 'string'
        ? reservation.exp_date.split('T')[0]
        : reservation.exp_date.toISOString().split('T')[0];
      const timeStr = reservation.exp_time;
      const fullIso = `${dateStr}T${timeStr}${timeStr.endsWith('Z') || timeStr.includes('+') ? '' : 'Z'}`;
      const eventStartTime = new Date(fullIso);

      const basePrice = payment ? payment.amount : (reservation.exp_price || 0);
      const calculation = this.calculateRefundAmount(
        reservation,
        eventStartTime,
        input.canceledBy,
        basePrice,
        now
      );

      // 3. Update reservation state to cancelled_by_*
      await client.query(
        `UPDATE reservations
         SET state = $1, cancelled_at = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [targetCancelledState, now, input.reservationId]
      );

      // Decrement booked count on experience if active confirmed/reconfirmed
      if (['confirmed', 'reconfirmed', 'reconfirmation_required', 'checked_in'].includes(reservation.state)) {
        await client.query(
          'UPDATE experiences SET booked = GREATEST(booked - 1, 0), updated_at = NOW() WHERE id = $1',
          [reservation.exp_id]
        );
      }

      let stripeRefundId: string | null = null;
      let finalState = targetCancelledState;

      // 4. Handle refund logic if amount > 0
      if (calculation.refundAmount > 0) {
        // Advance state to refund_pending
        if (stateMachine.canTransition(targetCancelledState, 'refund_pending')) {
          await client.query(
            'UPDATE reservations SET state = \'refund_pending\', updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [input.reservationId]
          );
          finalState = 'refund_pending';
        }

        if (payment && payment.stripe_payment_id) {
          // Stripe refund call: exceptions propagate to trigger rollback rather than silent mock fallback
          const refund = await stripe.refunds.create({
            payment_intent: payment.stripe_payment_id,
            amount: Math.round(calculation.refundAmount * 100),
            metadata: {
              reservation_id: input.reservationId,
              tier: calculation.tier,
            },
          });
          stripeRefundId = refund.id;
        }

        // Advance state to refunded
        if (stateMachine.canTransition(finalState, 'refunded')) {
          await client.query(
            'UPDATE reservations SET state = \'refunded\', payment_state = \'refunded\', updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [input.reservationId]
          );
          finalState = 'refunded';
        }

        // Update payments table if payment exists
        if (payment) {
          const paymentStatus = calculation.percentage === 100 ? 'refunded' : 'partially_refunded';
          await client.query(
            `UPDATE payments
             SET status = $1, refund_amount = $2, refund_reason = $3, refunded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [paymentStatus, calculation.refundAmount, input.reason || 'Cancellation refund', payment.id]
          );
        }

        // Record in refunds table
        await client.query(
          `INSERT INTO refunds (
             reservation_id, payment_id, stripe_refund_id, amount, currency, state, tier, reason
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            input.reservationId,
            payment ? payment.id : null,
            stripeRefundId,
            calculation.refundAmount,
            'SAR',
            'completed',
            calculation.tier,
            input.reason || null,
          ]
        );

        // Award operational bonus loyalty points if operational cancellation
        if (calculation.tier === 'operational') {
          try {
            await rewardModel.addTransaction(
              reservation.participant_id,
              100,
              'earned',
              'Operational cancellation bonus loyalty points credit'
            );
          } catch (rewardErr: any) {
            logger.warn('Failed to issue bonus loyalty points', { error: rewardErr.message });
          }
        }
      } else {
        // Record 0 refund entry
        await client.query(
          `INSERT INTO refunds (
             reservation_id, payment_id, stripe_refund_id, amount, currency, state, tier, reason
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            input.reservationId,
            payment ? payment.id : null,
            null,
            0,
            'SAR',
            'completed',
            'none',
            input.reason || 'Non-refundable cancellation (<24h)',
          ]
        );
      }

      // 5. Append immutable audit event to audit_events INSIDE transaction for atomicity
      await client.query(
        `INSERT INTO audit_events (
           actor_id, actor_role, action, resource_type, resource_id, details, classification
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          input.actorId,
          input.actorRole,
          'reservation_cancelled',
          'reservation',
          input.reservationId,
          JSON.stringify({
            canceled_by: input.canceledBy,
            refund_amount: calculation.refundAmount,
            percentage: calculation.percentage,
            tier: calculation.tier,
            reason: input.reason,
            ip_address: input.ipAddress,
            stripe_refund_id: stripeRefundId,
          }),
          'confidential',
        ]
      );

      await client.query('COMMIT');

      // 6. Backfill spot from waitlist queue
      try {
        await waitlistService.promoteNext(reservation.exp_id);
      } catch (waitlistErr: any) {
        logger.warn('Waitlist backfill failed after cancellation', { error: waitlistErr.message });
      }

      // 7. Dispatch notification receipt
      try {
        await notificationModel.create({
          recipient_id: reservation.participant_id,
          type: 'cancellation_receipt',
          title: 'Reservation Cancelled',
          title_ar: 'تم إلغاء الحجز',
          body: `Your reservation for "${reservation.exp_title}" was cancelled. Refund amount: SAR ${calculation.refundAmount} (${calculation.percentage}%).`,
          body_ar: `تم إلغاء حجزك لـ "${reservation.exp_title_ar || reservation.exp_title}". مبلغ الاسترداد: ${calculation.refundAmount} ريال (${calculation.percentage}%).`,
        });
      } catch (notifErr: any) {
        logger.warn('Failed to send cancellation notification receipt', { error: notifErr.message });
      }

      const updatedRes = await client.query('SELECT * FROM reservations WHERE id = $1', [input.reservationId]);

      return {
        reservation: updatedRes.rows[0],
        refund: {
          amount: calculation.refundAmount,
          percentage: calculation.percentage,
          tier: calculation.tier,
          stripeRefundId,
        },
      };
    } catch (error: any) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {}
      logger.error('Execute cancellation failed', { error: error.message, reservationId: input.reservationId });
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new CancellationService();
