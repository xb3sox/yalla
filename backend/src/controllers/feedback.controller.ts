import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import feedbackModel from '../models/feedback.model';
import reservationModel from '../models/reservation.model';
import logger from '../utils/logger';

/**
 * Submit feedback for an experience
 */
export const createFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const { 
      reservation_id, 
      worth_time, 
      description_accurate, 
      comfortable_organized, 
      comment 
    } = req.body;

    // Validate required fields
    if (!reservation_id || worth_time === undefined || description_accurate === undefined || comfortable_organized === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields'
        }
      });
    }

    if (typeof worth_time !== 'number' || worth_time < 1 || worth_time > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'worth_time must be an integer between 1 and 5'
        }
      });
    }

    // Get reservation to verify ownership and extract experience_id
    const reservation = await reservationModel.findById(reservation_id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reservation not found'
        }
      });
    }

    if (reservation.participant_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only leave feedback for your own reservations'
        }
      });
    }

    // Usually feedback is allowed if state is checked_in or completed
    // According to typical flow, either state could apply depending on implementation
    if (reservation.state !== 'completed' && reservation.state !== 'checked_in') {
       return res.status(400).json({
         success: false,
         error: {
           code: 'INVALID_STATE',
           message: 'Feedback can only be submitted for completed or checked-in reservations'
         }
       });
    }

    // Check if feedback already exists for this reservation
    const existingFeedback = await feedbackModel.getFeedbackByReservation(reservation_id);
    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Feedback already submitted for this reservation'
        }
      });
    }

    const feedback = await feedbackModel.createFeedback(
      reservation_id,
      req.user.userId,
      reservation.experience_id,
      Math.round(worth_time),
      Boolean(description_accurate),
      Boolean(comfortable_organized),
      comment ? String(comment) : undefined
    );

    return res.status(201).json({
      success: true,
      data: feedback
    });

  } catch (error) {
    logger.error('Error in createFeedback controller', { error });
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to submit feedback'
      }
    });
  }
};

/**
 * Get feedbacks for a specific experience
 */
export const getExperienceFeedbacks = async (req: Request, res: Response) => {
  try {
    const { experienceId } = req.params;

    if (!experienceId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Experience ID is required'
        }
      });
    }

    const feedbacks = await feedbackModel.getFeedbacksByExperience(experienceId);

    return res.status(200).json({
      success: true,
      data: feedbacks,
      count: feedbacks.length
    });

  } catch (error) {
    logger.error('Error in getExperienceFeedbacks controller', { error });
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch experience feedbacks'
      }
    });
  }
};
