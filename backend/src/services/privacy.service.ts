import pool from '../config/database';
import auditModel from '../models/audit.model';
import logger from '../utils/logger';

export interface UserExportData {
  profile: {
    id: string;
    phone: string;
    display_name: string;
    language: string;
    preferred_area?: string;
    experience_language: string;
    budget_min: number;
    budget_max: number;
    accessibility_needs?: string;
    marketing_consent: boolean;
    created_at: Date;
  };
  reservations: any[];
  payments: any[];
  feedback: any[];
  rewards_ledger: any[];
  audit_events: any[];
  push_subscriptions: any[];
  exported_at: string;
}

export class PrivacyService {
  /**
   * Aggregates complete personal data for user export archive without leaking PII of other users.
   */
  async exportUserData(userId: string): Promise<UserExportData> {
    const userResult = await pool.query(
      `SELECT id, phone, display_name, language, preferred_area, experience_language,
              budget_min, budget_max, accessibility_needs, marketing_consent, created_at
       FROM users WHERE id::text = $1`,
      [userId]
    );

    if (!userResult.rows[0]) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Query user's reservations (omitting co-attendee/host PII)
    const reservationsResult = await pool.query(
      `SELECT r.id, r.experience_id, e.title, e.title_ar, e.date, e.time, r.state,
              r.payment_state, r.created_at, r.updated_at, r.confirmed_at, r.reconfirmed_at,
              r.checked_in_at, r.cancelled_at, r.refund_status, r.refund_amount
       FROM reservations r
       JOIN experiences e ON r.experience_id = e.id
       WHERE r.participant_id::text = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // Query payments associated with user's reservations
    const paymentsResult = await pool.query(
      `SELECT p.id, p.reservation_id, p.amount, p.currency, p.status, p.created_at, p.completed_at, p.refund_amount, p.refund_reason
       FROM payments p
       JOIN reservations r ON p.reservation_id = r.id
       WHERE r.participant_id::text = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    // Query user's feedback
    const feedbackResult = await pool.query(
      `SELECT f.id, f.reservation_id, f.experience_id, f.worth_time, f.description_accurate,
              f.comfortable_organized, f.comment, f.created_at
       FROM feedbacks f
       WHERE f.participant_id::text = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    // Query user's rewards ledger
    const rewardsResult = await pool.query(
      `SELECT id, points, type, description, created_at
       FROM rewards_ledger
       WHERE user_id::text = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    // Query user's audit events
    const auditResult = await pool.query(
      `SELECT id, action, resource_type, resource_id, timestamp, classification
       FROM audit_events
       WHERE actor_id::text = $1
       ORDER BY timestamp DESC`,
      [userId]
    );

    // Query user's push subscriptions (safely handling missing table if needed)
    let pushSubscriptions: any[] = [];
    try {
      const pushResult = await pool.query(
        `SELECT id, endpoint, created_at
         FROM push_subscriptions
         WHERE user_id::text = $1
         ORDER BY created_at DESC`,
        [userId]
      );
      pushSubscriptions = pushResult.rows;
    } catch {
      pushSubscriptions = [];
    }

    logger.info('Aggregated user personal data for export', { userId });

    return {
      profile: {
        id: user.id,
        phone: user.phone,
        display_name: user.display_name,
        language: user.language,
        preferred_area: user.preferred_area,
        experience_language: user.experience_language,
        budget_min: Number(user.budget_min),
        budget_max: Number(user.budget_max),
        accessibility_needs: user.accessibility_needs,
        marketing_consent: Boolean(user.marketing_consent),
        created_at: user.created_at,
      },
      reservations: reservationsResult.rows,
      payments: paymentsResult.rows,
      feedback: feedbackResult.rows,
      rewards_ledger: rewardsResult.rows,
      audit_events: auditResult.rows,
      push_subscriptions: pushSubscriptions,
      exported_at: new Date().toISOString(),
    };
  }

  /**
   * Executes RTBF / erasure and account anonymization.
   * Anonymizes profile info, sets phone = 'deleted_' || id, clears credentials,
   * deletes push subscriptions and notifications, preserves financial transaction logs,
   * and writes an immutable entry to audit_events.
   */
  async anonymizeAndDeleteAccount(
    userId: string,
    reqIp?: string,
    actorRole: string = 'participant'
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Soft-delete and anonymize user record
      const anonymizeQuery = `
        UPDATE users
        SET display_name = 'Anonymized User',
            phone = 'deleted_' || id,
            accessibility_needs = NULL,
            preferred_area = NULL,
            marketing_consent = FALSE,
            is_active = FALSE,
            password_hash = 'DELETED',
            updated_at = CURRENT_TIMESTAMP
        WHERE id::text = $1
        RETURNING id
      `;
      const updateRes = await client.query(anonymizeQuery, [userId]);

      if (updateRes.rowCount === 0) {
        throw new Error('User not found');
      }

      // 2. Delete user's push subscriptions
      try {
        await client.query(`DELETE FROM push_subscriptions WHERE user_id::text = $1`, [userId]);
      } catch {
        // Handle case where push_subscriptions table might not exist in local setup
      }

      // 3. Delete user's in-app notifications
      await client.query(`DELETE FROM notifications WHERE recipient_id::text = $1`, [userId]);

      await client.query('COMMIT');

      // 4. Record immutable audit event in audit_events table
      await auditModel.create({
        actor_id: userId,
        actor_role: actorRole,
        action: 'ACCOUNT_ERASURE',
        resource_type: 'user',
        resource_id: userId,
        details: {
          timestamp: new Date().toISOString(),
          ip: reqIp || '127.0.0.1',
          strategy: 'soft_delete_anonymization',
        },
        classification: 'restricted',
      });

      logger.info('Account anonymized and soft-deleted successfully', { userId });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to anonymize and delete account', { userId, error });
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new PrivacyService();
