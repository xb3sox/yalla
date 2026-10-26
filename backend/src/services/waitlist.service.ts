import pool from '../config/database';
import logger from '../utils/logger';
import notificationModel from '../models/notification.model';

export class WaitlistService {
  /**
   * Evaluates the highest-priority (earliest) waitlisted participant and issues a 2-hour booking offer invite
   */
  async promoteNext(experienceId: string, client?: any): Promise<any | null> {
    const dbClient = client || (await pool.connect());
    const isLocalClient = !client;

    try {
      if (isLocalClient) {
        await dbClient.query('BEGIN');
      }

      // 1. Lock earliest waitlisted reservation row
      const query = `
        SELECT r.*, e.title AS experience_title, e.title_ar AS experience_title_ar
        FROM reservations r
        JOIN experiences e ON r.experience_id = e.id
        WHERE r.experience_id = $1 AND r.state = 'waitlisted'
        ORDER BY r.created_at ASC
        LIMIT 1
        FOR UPDATE OF r
      `;
      const result = await dbClient.query(query, [experienceId]);

      if (result.rows.length === 0) {
        if (isLocalClient) await dbClient.query('COMMIT');
        return null;
      }

      const reservation = result.rows[0];

      // 2. Set expiry_at to 2 hours from now
      const expiryAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

      // 3. Advance state to offered
      const updateQuery = `
        UPDATE reservations
        SET state = 'offered',
            expiry_at = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      const updateRes = await dbClient.query(updateQuery, [expiryAt, reservation.id]);
      const updatedReservation = updateRes.rows[0];

      if (isLocalClient) {
        await dbClient.query('COMMIT');
      }

      // 4. Dispatch waitlist booking offer notification
      try {
        await notificationModel.create({
          recipient_id: reservation.participant_id,
          type: 'waitlist_offer',
          title: 'Spot Available!',
          title_ar: 'مقعد متاح!',
          body: `A spot opened up for "${reservation.experience_title}". You have 2 hours to confirm your booking!`,
          body_ar: `أصبح هناك مقعد متاح لـ "${reservation.experience_title_ar || reservation.experience_title}". لديك ساعتان لتأكيد حجزك!`,
        });
      } catch (notifErr: any) {
        logger.warn('Failed to send waitlist promotion notification', { error: notifErr.message });
      }

      logger.info('Auto-promoted waitlisted reservation to offered state', {
        reservationId: reservation.id,
        experienceId,
        expiryAt,
      });

      return updatedReservation;
    } catch (error: any) {
      if (isLocalClient) {
        try {
          await dbClient.query('ROLLBACK');
        } catch (_) {}
      }
      logger.error('Waitlist promotion failed', { error: error.message, experienceId });
      throw error;
    } finally {
      if (isLocalClient) {
        dbClient.release();
      }
    }
  }
}

export default new WaitlistService();
