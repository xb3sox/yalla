import pool, { transaction } from '../config/database';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface Reservation {
  id: string;
  participant_id: string;
  experience_id: string;
  state: string;
  created_at: Date;
  confirmed_at?: Date;
  reconfirmed_at?: Date;
  checked_in_at?: Date;
  cancelled_at?: Date;
  expiry_at?: Date;
  payment_state: string;
  payment_id?: string;
  idempotency_key: string;
  updated_at: Date;
}

export interface CreateReservationInput {
  participant_id: string;
  experience_id: string;
  idempotency_key: string;
}

export interface ReservationStateMachine {
  canTransition(from: string, to: string): boolean;
  getNextStates(current: string): string[];
}

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  initiated: ['payment_pending', 'cancelled_by_participant', 'cancelled_by_yalla'],
  payment_pending: ['confirmed', 'waitlisted', 'failed', 'cancelled_by_participant', 'cancelled_by_yalla'],
  confirmed: ['reconfirmation_required', 'checked_in', 'attended', 'cancelled_by_participant', 'cancelled_by_yalla'],
  reconfirmation_required: ['reconfirmed', 'expired', 'cancelled_by_participant', 'cancelled_by_yalla'],
  reconfirmed: ['checked_in', 'attended', 'cancelled_by_participant', 'cancelled_by_yalla'],
  waitlisted: ['offered', 'cancelled_by_participant', 'cancelled_by_yalla'],
  offered: ['confirmed', 'expired', 'declined', 'cancelled_by_participant', 'cancelled_by_yalla'],
  checked_in: ['attended', 'no_show', 'cancelled_by_yalla'],
  attended: ['completed'],
  completed: [],
  expired: [],
  declined: [],
  failed: [],
  no_show: [],
  cancelled_by_participant: ['refund_pending'],
  cancelled_by_yalla: ['refund_pending'],
  refund_pending: ['refunded'],
  refunded: [],
};

const stateMachine: ReservationStateMachine = {
  canTransition(from: string, to: string): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) || false;
  },
  getNextStates(current: string): string[] {
    return VALID_TRANSITIONS[current] || [];
  },
};

class ReservationModel {
  /**
   * Deep transactional reservation intake with capacity lock and idempotency check
   */
  async createWithCapacityCheck(input: {
    participant_id: string;
    experience_id: string;
    idempotency_key: string;
  }): Promise<{ reservation: Reservation; isWaitlisted: boolean; experience: any }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Lock experience row to serialize concurrent booking attempts
      const expRes = await client.query(
        'SELECT * FROM experiences WHERE id = $1 FOR UPDATE',
        [input.experience_id]
      );
      if (expRes.rows.length === 0) {
        throw new Error('EXPERIENCE_NOT_FOUND');
      }
      const experience = expRes.rows[0];
      if (experience.plan_state !== 'published') {
        throw new Error('EXPERIENCE_NOT_AVAILABLE');
      }

      // 2. Idempotency check inside transaction
      const existingRes = await client.query(
        'SELECT * FROM reservations WHERE idempotency_key = $1',
        [input.idempotency_key]
      );
      if (existingRes.rows.length > 0) {
        await client.query('COMMIT');
        return {
          reservation: existingRes.rows[0],
          isWaitlisted: existingRes.rows[0].state === 'waitlisted',
          experience,
        };
      }

      // 3. Active duplicate reservation check
      const activeCheck = await client.query(
        `SELECT id FROM reservations 
         WHERE participant_id = $1 
           AND experience_id = $2 
           AND state IN ('initiated', 'payment_pending', 'confirmed', 'reconfirmation_required', 'reconfirmed', 'waitlisted', 'offered')`,
        [input.participant_id, input.experience_id]
      );
      if (activeCheck.rows.length > 0) {
        throw new Error('Active reservation already exists for this experience');
      }

      // 4. Check capacity atomically
      const isWaitlisted = experience.booked >= experience.capacity;
      const targetState = isWaitlisted ? 'waitlisted' : 'confirmed';
      const paymentState = isWaitlisted ? 'initiated' : 'captured';
      const paymentId = isWaitlisted ? null : `pay_${uuidv4()}`;

      // 5. Insert reservation
      const insertRes = await client.query(
        `INSERT INTO reservations (
           participant_id, experience_id, state, payment_state, payment_id, idempotency_key, confirmed_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          input.participant_id,
          input.experience_id,
          targetState,
          paymentState,
          paymentId,
          input.idempotency_key,
          isWaitlisted ? null : new Date(),
        ]
      );

      // 6. If confirmed, increment booked count atomically on locked row
      if (!isWaitlisted) {
        await client.query(
          'UPDATE experiences SET booked = booked + 1, updated_at = NOW() WHERE id = $1',
          [input.experience_id]
        );
        experience.booked += 1;
      }

      await client.query('COMMIT');
      logger.info('Reservation intake completed atomically', {
        reservationId: insertRes.rows[0].id,
        state: targetState,
        isWaitlisted,
      });

      return {
        reservation: insertRes.rows[0],
        isWaitlisted,
        experience,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new reservation with idempotency check
   */
  async create(input: CreateReservationInput): Promise<Reservation> {
    // Check for duplicate reservation with same idempotency key
    const existingQuery = `
      SELECT * FROM reservations 
      WHERE idempotency_key = $1
    `;
    const existing = await pool.query(existingQuery, [input.idempotency_key]);
    
    if (existing.rows.length > 0) {
      logger.info('Duplicate reservation request detected', { 
        idempotencyKey: input.idempotency_key,
        existingReservationId: existing.rows[0].id 
      });
      return existing.rows[0];
    }

    // Check for active reservation for same participant and experience
    const activeCheckQuery = `
      SELECT * FROM reservations
      WHERE participant_id = $1 
        AND experience_id = $2
        AND state IN ('initiated', 'payment_pending', 'confirmed', 'reconfirmation_required', 'reconfirmed', 'waitlisted', 'offered')
    `;
    const activeCheck = await pool.query(activeCheckQuery, [
      input.participant_id,
      input.experience_id,
    ]);

    if (activeCheck.rows.length > 0) {
      throw new Error('Active reservation already exists for this experience');
    }

    // Create reservation
    const query = `
      INSERT INTO reservations (
        participant_id, experience_id, state, payment_state, idempotency_key
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      input.participant_id,
      input.experience_id,
      'initiated',
      'initiated',
      input.idempotency_key,
    ];
    
    const result = await pool.query(query, values);
    logger.info('Reservation created', { 
      reservationId: result.rows[0].id,
      participantId: input.participant_id,
      experienceId: input.experience_id 
    });
    
    return result.rows[0];
  }

  /**
   * Find reservation by ID
   */
  async findById(id: string): Promise<Reservation | null> {
    const query = 'SELECT * FROM reservations WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    return result.rows[0] || null;
  }

  /**
   * Find reservations by participant
   */
  async findByParticipant(participantId: string): Promise<Reservation[]> {
    const query = `
      SELECT r.*, e.title, e.title_ar, e.date, e.time, e.price
      FROM reservations r
      JOIN experiences e ON r.experience_id = e.id
      WHERE r.participant_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query, [participantId]);
    
    return result.rows;
  }

  /**
   * Find reservations by experience
   */
  async findByExperience(experienceId: string): Promise<Reservation[]> {
    const query = `
      SELECT r.*, u.display_name, u.phone
      FROM reservations r
      JOIN users u ON r.participant_id = u.id
      WHERE r.experience_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query, [experienceId]);
    
    return result.rows;
  }

  /**
   * Update reservation state with validation
   */
  async updateState(
    reservationId: string, 
    newState: string, 
    additionalFields: Partial<Reservation> = {}
  ): Promise<Reservation> {
    return await transaction(async (client) => {
      // Get current reservation
      const currentQuery = 'SELECT * FROM reservations WHERE id = $1 FOR UPDATE';
      const current = await client.query(currentQuery, [reservationId]);
      
      if (current.rows.length === 0) {
        throw new Error('Reservation not found');
      }
      
      const reservation = current.rows[0];
      
      // Validate state transition
      if (!stateMachine.canTransition(reservation.state, newState)) {
        throw new Error(`Invalid state transition: ${reservation.state} -> ${newState}`);
      }
      
      // Build update query
      const updates: string[] = ['state = $1', 'updated_at = CURRENT_TIMESTAMP'];
      const values: any[] = [newState];
      let paramCount = 2;
      
      // Add timestamp fields based on new state
      if (newState === 'confirmed' && !reservation.confirmed_at) {
        updates.push(`confirmed_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
      }
      
      if (newState === 'reconfirmed') {
        updates.push(`reconfirmed_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
      }
      
      if (newState === 'checked_in') {
        updates.push(`checked_in_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
      }

      if (newState === 'attended') {
        if (!reservation.checked_in_at) {
          updates.push(`checked_in_at = $${paramCount}`);
          values.push(new Date());
          paramCount++;
        }
      }
      
      if (newState === 'cancelled_by_participant' || newState === 'cancelled_by_yalla') {
        updates.push(`cancelled_at = $${paramCount}`);
        values.push(new Date());
        paramCount++;
      }
      
      // Add additional fields
      for (const [key, value] of Object.entries(additionalFields)) {
        if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
      
      values.push(reservationId);
      
      const query = `
        UPDATE reservations
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      
      logger.info('Reservation state updated', { 
        reservationId,
        oldState: reservation.state,
        newState 
      });
      
      return result.rows[0];
    });
  }

  /**
   * Reconfirm reservation
   */
  async reconfirm(reservationId: string): Promise<Reservation> {
    const reservation = await this.findById(reservationId);
    
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    
    if (reservation.state !== 'reconfirmation_required') {
      throw new Error('Reservation is not in reconfirmation_required state');
    }
    
    if (reservation.expiry_at && new Date(reservation.expiry_at) < new Date()) {
      throw new Error('Reconfirmation period has expired');
    }
    
    return await this.updateState(reservationId, 'reconfirmed');
  }

  /**
   * Check in reservation (transition to attended directly and record checked_in_at)
   */
  async checkIn(reservationId: string): Promise<Reservation> {
    const reservation = await this.findById(reservationId);
    
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    
    if (!['confirmed', 'reconfirmed', 'checked_in'].includes(reservation.state)) {
      throw new Error('Reservation cannot be checked in from its current state');
    }
    
    return await this.updateState(reservationId, 'attended');
  }

  /**
   * Cancel reservation
   */
  async cancel(reservationId: string, cancelledBy: 'participant' | 'yalla'): Promise<Reservation> {
    const reservation = await this.findById(reservationId);
    
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    
    const newState = cancelledBy === 'participant' ? 'cancelled_by_participant' : 'cancelled_by_yalla';
    
    return await this.updateState(reservationId, newState);
  }

  /**
   * Get waitlist for experience
   */
  async getWaitlist(experienceId: string): Promise<Reservation[]> {
    const query = `
      SELECT r.*, u.display_name, u.phone
      FROM reservations r
      JOIN users u ON r.participant_id = u.id
      WHERE r.experience_id = $1 AND r.state = 'waitlisted'
      ORDER BY r.created_at ASC
    `;
    const result = await pool.query(query, [experienceId]);
    
    return result.rows;
  }

  /**
   * Offer seat from waitlist
   */
  async offerSeatFromWaitlist(experienceId: string): Promise<Reservation | null> {
    return await transaction(async (client) => {
      // Get first person in waitlist
      const waitlistQuery = `
        SELECT * FROM reservations
        WHERE experience_id = $1 AND state = 'waitlisted'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE
      `;
      const waitlist = await client.query(waitlistQuery, [experienceId]);
      
      if (waitlist.rows.length === 0) {
        return null;
      }
      
      const reservation = waitlist.rows[0];
      
      // Update to offered state
      const updateQuery = `
        UPDATE reservations
        SET state = 'offered', 
            expiry_at = CURRENT_TIMESTAMP + INTERVAL '24 hours',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(updateQuery, [reservation.id]);
      
      logger.info('Seat offered from waitlist', { 
        reservationId: reservation.id,
        experienceId 
      });
      
      return result.rows[0];
    });
  }

  /**
   * Get reservations requiring reconfirmation
   */
  async getRequiringReconfirmation(): Promise<Reservation[]> {
    const query = `
      SELECT r.*, e.title, e.title_ar, e.date, u.display_name, u.phone
      FROM reservations r
      JOIN experiences e ON r.experience_id = e.id
      JOIN users u ON r.participant_id = u.id
      WHERE r.state = 'reconfirmation_required'
        AND (r.expiry_at IS NULL OR r.expiry_at > CURRENT_TIMESTAMP)
      ORDER BY r.expiry_at ASC
    `;
    const result = await pool.query(query);
    
    return result.rows;
  }

  /**
   * Expire old reconfirmations
   */
  async expireOldReconfirmations(): Promise<number> {
    const query = `
      UPDATE reservations
      SET state = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE state = 'reconfirmation_required'
        AND expiry_at < CURRENT_TIMESTAMP
      RETURNING id
    `;
    const result = await pool.query(query);
    
    logger.info('Expired old reconfirmations', { count: result.rowCount });
    
    return result.rowCount || 0;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<any> {
    const query = `
      SELECT 
        state,
        COUNT(*) as count
      FROM reservations
      GROUP BY state
      ORDER BY count DESC
    `;
    const result = await pool.query(query);
    
    return result.rows;
  }
}

export { stateMachine };
export default new ReservationModel();
