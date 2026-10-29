import pool, { db } from '../config/database';
import logger from '../utils/logger';

export interface Feedback {
  id: string;
  reservation_id: string;
  participant_id: string;
  experience_id: string;
  worth_time: number;
  description_accurate: boolean;
  comfortable_organized: boolean;
  comment?: string;
  created_at: Date;
}

class FeedbackModel {
  /**
   * Create a new feedback for an experience
   */
  async createFeedback(
    reservationId: string,
    participantId: string,
    experienceId: string,
    worthTime: number,
    descriptionAccurate: boolean,
    comfortableOrganized: boolean,
    comment?: string
  ): Promise<Feedback> {
    try {
      const query = `
        INSERT INTO feedbacks (
          reservation_id,
          participant_id,
          experience_id,
          worth_time,
          description_accurate,
          comfortable_organized,
          comment
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        reservationId,
        participantId,
        experienceId,
        worthTime,
        descriptionAccurate,
        comfortableOrganized,
        comment || null
      ];
      
      const result = await pool.query(query, values);
      
      logger.info('Feedback created successfully', {
        reservationId,
        experienceId,
        feedbackId: result.rows[0].id
      });
      
      return result.rows[0] as Feedback;
    } catch (error) {
      logger.error('Error creating feedback', { error, reservationId });
      throw error;
    }
  }

  /**
   * Get all feedbacks for a specific experience
   */
  async getFeedbacksByExperience(experienceId: string): Promise<Feedback[]> {
    try {
      const query = `
        SELECT *
        FROM feedbacks
        WHERE experience_id = $1
        ORDER BY created_at DESC
      `;
      
      const result = await db.queryReplica(query, [experienceId]);
      return result.rows as Feedback[];
    } catch (error) {
      logger.error('Error getting feedbacks by experience', { error, experienceId });
      throw error;
    }
  }

  /**
   * Check if a feedback already exists for a given reservation
   */
  async getFeedbackByReservation(reservationId: string): Promise<Feedback | null> {
    try {
      const query = `
        SELECT *
        FROM feedbacks
        WHERE reservation_id = $1
      `;
      
      const result = await db.queryReplica(query, [reservationId]);
      return result.rows.length > 0 ? (result.rows[0] as Feedback) : null;
    } catch (error) {
      logger.error('Error getting feedback by reservation', { error, reservationId });
      throw error;
    }
  }
}

export default new FeedbackModel();
