import Stripe from 'stripe';
import config from '../config';
import logger from '../utils/logger';
import pool from '../config/database';
import reservationModel from './reservation.model';

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

export interface Payment {
  id: string;
  reservation_id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_id?: string;
  stripe_client_secret?: string;
  receipt_url?: string;
  refund_amount?: number;
  refund_reason?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  refunded_at?: Date;
}

export interface CreatePaymentInput {
  reservation_id: string;
  amount: number;
  currency?: string;
}

class PaymentModel {
  /**
   * Save pre-created Stripe PaymentIntent into DB
   */
  async createPaymentIntentWithStripeId(input: {
    reservation_id: string;
    amount: number;
    currency?: string;
    stripe_payment_id: string;
    stripe_client_secret?: string;
  }): Promise<Payment> {
    try {
      const query = `
        INSERT INTO payments (
          reservation_id, amount, currency, status, stripe_payment_id, stripe_client_secret
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [
        input.reservation_id,
        input.amount,
        input.currency || 'sar',
        'pending',
        input.stripe_payment_id,
        input.stripe_client_secret || null,
      ];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      logger.error('createPaymentIntentWithStripeId failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(input: CreatePaymentInput): Promise<Payment> {
    try {
      // One live payment per reservation (the controller enforces this too,
      // but direct model callers must not be able to double-charge).
      const reservationIdForCheck = input.reservation_id || (input as any).reservationId;
      const existing = reservationIdForCheck
        ? await this.findByReservationId(reservationIdForCheck)
        : null;
      if (existing && ['pending', 'processing', 'completed'].includes(existing.status)) {
        throw new Error('Payment intent already exists for this reservation');
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(input.amount * 100), // Convert to cents
        currency: input.currency || 'sar',
        metadata: {
          reservation_id: input.reservation_id || (input as any).reservationId,
        },
      });

      // Save to database
      const query = `
        INSERT INTO payments (
          reservation_id, amount, currency, status, stripe_payment_id, stripe_client_secret
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const reservationId = input.reservation_id || (input as any).reservationId;
      const values = [
        reservationId,
        input.amount,
        input.currency || 'sar',
        'pending',
        paymentIntent.id,
        paymentIntent.client_secret,
      ];
      
      const result = await pool.query(query, values);
      
      logger.info('Payment intent created', { 
        paymentId: result.rows[0].id,
        stripePaymentId: paymentIntent.id,
        amount: input.amount 
      });
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Create payment intent failed', { error: error.message });
      if (error.message?.startsWith('Payment intent already exists')) {
        throw error;
      }
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Confirm payment
   */
  async confirmPayment(stripePaymentId: string): Promise<Payment> {
    try {
      // Verify with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment not succeeded: ${paymentIntent.status}`);
      }
      
      // Get receipt URL from the latest charge
      let receiptUrl: string | undefined;
      if (paymentIntent.latest_charge) {
        try {
          const chargeId = typeof paymentIntent.latest_charge === 'string' 
            ? paymentIntent.latest_charge 
            : paymentIntent.latest_charge.id;
            
          const charge = await stripe.charges.retrieve(chargeId);
          receiptUrl = charge.receipt_url || undefined;
        } catch (chargeErr: any) {
          logger.warn('Could not retrieve charge for receipt_url', { error: chargeErr.message });
        }
      }

      // Update database
      const query = `
        UPDATE payments
        SET status = 'completed', receipt_url = $2, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE stripe_payment_id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [stripePaymentId, receiptUrl || null]);
      
      if (result.rows.length === 0) {
        throw new Error('Payment not found');
      }
      
      const payment = result.rows[0];
      
      // Update reservation state using reservationModel
      try {
        await reservationModel.updateState(payment.reservation_id, 'confirmed', {
          payment_state: 'paid',
          payment_id: payment.id
        });
        logger.info('Reservation updated upon payment confirmation', {
          reservationId: payment.reservation_id,
          paymentId: payment.id
        });
      } catch (resErr: any) {
        logger.error('Failed to update reservation upon payment confirmation', { error: resErr.message });
      }
      
      logger.info('Payment confirmed', { 
        stripePaymentId,
        paymentId: payment.id,
        receiptUrl: receiptUrl || 'not_available'
      });
      
      return payment;
    } catch (error: any) {
      logger.error('Confirm payment failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Fail payment
   */
  async failPayment(stripePaymentId: string): Promise<Payment> {
    try {
      // Update database
      const query = `
        UPDATE payments
        SET status = 'failed', updated_at = CURRENT_TIMESTAMP
        WHERE stripe_payment_id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [stripePaymentId]);
      
      if (result.rows.length === 0) {
        throw new Error('Payment not found');
      }
      
      const payment = result.rows[0];
      
      // Update reservation state using reservationModel
      try {
        await reservationModel.updateState(payment.reservation_id, 'failed', {
          payment_state: 'failed'
        });
        logger.info('Reservation updated upon payment failure', {
          reservationId: payment.reservation_id,
          paymentId: payment.id
        });
      } catch (resErr: any) {
        logger.error('Failed to update reservation upon payment failure', { error: resErr.message });
      }
      
      logger.info('Payment failed', { 
        stripePaymentId,
        paymentId: payment.id 
      });
      
      return payment;
    } catch (error: any) {
      logger.error('Fail payment process failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Mark payment as refunded (used by webhook)
   */
  async markRefunded(stripePaymentId: string): Promise<Payment> {
    try {
      // Update database
      const query = `
        UPDATE payments
        SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
        WHERE stripe_payment_id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [stripePaymentId]);
      
      if (result.rows.length === 0) {
        throw new Error('Payment not found');
      }
      
      const payment = result.rows[0];
      
      // Update reservation state using reservationModel
      try {
        await reservationModel.updateState(payment.reservation_id, 'refunded', {
          payment_state: 'refunded'
        });
        logger.info('Reservation updated upon refund webhook', {
          reservationId: payment.reservation_id,
          paymentId: payment.id
        });
      } catch (resErr: any) {
        logger.error('Failed to update reservation upon refund webhook', { error: resErr.message });
      }
      
      logger.info('Payment marked as refunded', { 
        stripePaymentId,
        paymentId: payment.id 
      });
      
      return payment;
    } catch (error: any) {
      logger.error('Mark refunded failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(stripePaymentId: string, amount?: number): Promise<Payment> {
    try {
      // Create refund with Stripe
      const refundParams: any = {
        payment_intent: stripePaymentId,
      };
      
      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }
      
      const existing = await this.findByStripePaymentId(stripePaymentId);
      if (!existing) {
        throw new Error('Payment not found');
      }

      const refund = await stripe.refunds.create(refundParams);

      // Track how much was refunded (cumulative across partial refunds)
      // and whether the payment is now fully refunded.
      const refundAmount = (existing.refund_amount || 0) + (amount ?? existing.amount);
      const newStatus = refundAmount >= existing.amount ? 'refunded' : 'partially_refunded';

      const query = `
        UPDATE payments
        SET status = $2, refund_amount = $3, refunded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE stripe_payment_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [stripePaymentId, newStatus, refundAmount]);
      
      if (result.rows.length === 0) {
        throw new Error('Payment not found');
      }
      
      logger.info('Refund processed', { 
        stripePaymentId,
        refundId: refund.id,
        amount: amount || 'full' 
      });
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('Process refund failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get payment by reservation ID
   */
  async findByReservationId(reservationId: string): Promise<Payment | null> {
    const query = 'SELECT * FROM payments WHERE reservation_id = $1';
    const result = await pool.query(query, [reservationId]);
    
    return result.rows[0] || null;
  }

  /**
   * Get payment by Stripe payment ID
   */
  async findByStripePaymentId(stripePaymentId: string): Promise<Payment | null> {
    const query = 'SELECT * FROM payments WHERE stripe_payment_id = $1';
    const result = await pool.query(query, [stripePaymentId]);
    
    return result.rows[0] || null;
  }

  /**
   * Refund payment (alias for processRefund with better naming)
   */
  async refundPayment(paymentId: string, amount?: number): Promise<Payment> {
    const payment = await this.findById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }
    
    if (payment.status !== 'completed') {
      throw new Error('Payment is not in completed status');
    }
    
    if (!payment.stripe_payment_id) {
      throw new Error('Payment has no Stripe payment ID');
    }
    
    return await this.processRefund(payment.stripe_payment_id, amount);
  }

  /**
   * Find payment by ID
   */
  async findById(id: string): Promise<Payment | null> {
    const query = 'SELECT * FROM payments WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    return result.rows[0] || null;
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*)::int as total_payments,
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments
      FROM payments
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.confirmPayment((event.data.object as any).id);
        break;
      
      case 'payment_intent.payment_failed':
        await this.failPayment((event.data.object as any).id);
        break;
      
      case 'charge.refunded':
        // A charge refund is tied to a payment intent
        await this.markRefunded((event.data.object as any).payment_intent);
        break;
      
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
  }
}

export { stripe };
export default new PaymentModel();
