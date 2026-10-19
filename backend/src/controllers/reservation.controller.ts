import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import reservationModel from '../models/reservation.model';
import experienceModel from '../models/experience.model';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new reservation
 */
export const createReservation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { experience_id } = req.body;
    if (!experience_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'experience_id is required',
        },
      });
    }
    const idempotency_key = req.body.idempotency_key || uuidv4();

    // Validate experience exists and is published
    const experience = await experienceModel.findById(experience_id);
    
    if (!experience) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPERIENCE_NOT_FOUND',
          message: 'Experience not found',
        },
      });
    }

    if (experience.plan_state !== 'published') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EXPERIENCE_NOT_AVAILABLE',
          message: 'Experience is not available for booking',
        },
      });
    }

    // Check capacity
    if (experience.booked >= experience.capacity) {
      // Add to waitlist
      const reservation = await reservationModel.create({
        participant_id: req.user.userId,
        experience_id,
        idempotency_key,
      });

      await reservationModel.updateState(reservation.id, 'waitlisted');

      logger.info('User added to waitlist', { 
        userId: req.user.userId, 
        experienceId: experience_id 
      });

      return res.status(201).json({
        success: true,
        data: {
          reservation,
          message: 'Added to waitlist',
        },
      });
    }

    // Create reservation
    const reservation = await reservationModel.create({
      participant_id: req.user.userId,
      experience_id,
      idempotency_key,
    });

    // Update experience booked count
    await experienceModel.incrementBooked(experience_id);

    // Update reservation to confirmed (simulating payment success)
    const confirmedReservation = await reservationModel.updateState(
      reservation.id,
      'confirmed',
      { payment_state: 'captured', payment_id: `pay_${uuidv4()}` }
    );

    logger.info('Reservation created and confirmed', { 
      userId: req.user.userId, 
      experienceId: experience_id,
      reservationId: confirmedReservation.id 
    });

    res.status(201).json({
      success: true,
      data: {
        reservation: confirmedReservation,
        experience,
      },
    });
  } catch (error: any) {
    if (error.message === 'Active reservation already exists for this experience') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RESERVATION',
          message: error.message,
        },
      });
    }

    logger.error('Create reservation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_RESERVATION_FAILED',
        message: 'Failed to create reservation',
      },
    });
  }
};

/**
 * Get user's reservations
 */
export const getUserReservations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const reservations = await reservationModel.findByParticipant(req.user.userId);

    res.json({
      success: true,
      data: { reservations },
    });
  } catch (error: any) {
    logger.error('Get user reservations failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_RESERVATIONS_FAILED',
        message: 'Failed to get reservations',
      },
    });
  }
};

/**
 * Get reservation by ID
 */
export const getReservationById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { id } = req.params;
    const reservation = await reservationModel.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found',
        },
      });
    }

    // Check ownership (unless staff)
    if (
      reservation.participant_id !== req.user.userId &&
      !['operations', 'support', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this reservation',
        },
      });
    }

    res.json({
      success: true,
      data: { reservation },
    });
  } catch (error: any) {
    logger.error('Get reservation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_RESERVATION_FAILED',
        message: 'Failed to get reservation',
      },
    });
  }
};

/**
 * Reconfirm reservation
 */
export const reconfirmReservation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { id } = req.params;
    const reservation = await reservationModel.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found',
        },
      });
    }

    // Check ownership
    if (reservation.participant_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to reconfirm this reservation',
        },
      });
    }

    const reconfirmed = await reservationModel.reconfirm(id);

    logger.info('Reservation reconfirmed', { 
      userId: req.user.userId, 
      reservationId: id 
    });

    res.json({
      success: true,
      data: { reservation: reconfirmed },
      message: 'Reservation reconfirmed successfully',
    });
  } catch (error: any) {
    if (
      error.message === 'Reservation not found' ||
      error.message === 'Reservation is not in reconfirmation_required state' ||
      error.message === 'Reconfirmation period has expired'
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'RECONFIRMATION_FAILED',
          message: error.message,
        },
      });
    }

    logger.error('Reconfirm reservation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'RECONFIRM_RESERVATION_FAILED',
        message: 'Failed to reconfirm reservation',
      },
    });
  }
};

/**
 * Check in reservation
 */
export const checkInReservation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { id } = req.params;
    const reservation = await reservationModel.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found',
        },
      });
    }

    // Check ownership
    // Depending on business logic, this might be staff only, 
    // but the issue specifies "Reservations Attendee Check-In", 
    // so we assume the attendee can self-check-in, or host.
    // For now we allow participant.
    if (reservation.participant_id !== req.user.userId && !['operations', 'admin', 'host'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to check in this reservation',
        },
      });
    }

    const checkedIn = await reservationModel.checkIn(id);

    logger.info('Reservation checked in', { 
      userId: req.user.userId, 
      reservationId: id 
    });

    res.json({
      success: true,
      data: { reservation: checkedIn },
      message: 'Reservation checked in successfully',
    });
  } catch (error: any) {
    if (
      error.message === 'Reservation not found' ||
      error.message === 'Reservation cannot be checked in from its current state'
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CHECK_IN_FAILED',
          message: error.message,
        },
      });
    }

    logger.error('Check in reservation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CHECK_IN_RESERVATION_FAILED',
        message: 'Failed to check in reservation',
      },
    });
  }
};

/**
 * Cancel reservation
 */
export const cancelReservation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { id } = req.params;
    const reservation = await reservationModel.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found',
        },
      });
    }

    // Check ownership
    if (reservation.participant_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to cancel this reservation',
        },
      });
    }

    const cancelled = await reservationModel.cancel(id, 'participant');

    // Decrement experience booked count
    await experienceModel.decrementBooked(reservation.experience_id);

    logger.info('Reservation cancelled', { 
      userId: req.user.userId, 
      reservationId: id 
    });

    res.json({
      success: true,
      data: { reservation: cancelled },
      message: 'Reservation cancelled successfully',
    });
  } catch (error: any) {
    if (
      error.message === 'Reservation not found' ||
      error.message.includes('Invalid state transition')
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANCELLATION_FAILED',
          message: error.message,
        },
      });
    }

    logger.error('Cancel reservation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_RESERVATION_FAILED',
        message: 'Failed to cancel reservation',
      },
    });
  }
};

/**
 * Get experience reservations (staff only)
 */
export const getExperienceReservations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { experienceId } = req.params;
    const reservations = await reservationModel.findByExperience(experienceId);

    res.json({
      success: true,
      data: { reservations },
    });
  } catch (error: any) {
    logger.error('Get experience reservations failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_RESERVATIONS_FAILED',
        message: 'Failed to get reservations',
      },
    });
  }
};

/**
 * Get waitlist for experience (staff only)
 */
export const getWaitlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { experienceId } = req.params;
    const waitlist = await reservationModel.getWaitlist(experienceId);

    res.json({
      success: true,
      data: { waitlist },
    });
  } catch (error: any) {
    logger.error('Get waitlist failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_WAITLIST_FAILED',
        message: 'Failed to get waitlist',
      },
    });
  }
};

/**
 * Offer seat from waitlist (staff only)
 */
export const offerSeatFromWaitlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { experienceId } = req.params;
    const reservation = await reservationModel.offerSeatFromWaitlist(experienceId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WAITLIST_EMPTY',
          message: 'No one in waitlist',
        },
      });
    }

    logger.info('Seat offered from waitlist', { 
      staffId: req.user.userId, 
      experienceId,
      reservationId: reservation.id 
    });

    res.json({
      success: true,
      data: { reservation },
      message: 'Seat offered successfully',
    });
  } catch (error: any) {
    logger.error('Offer seat failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'OFFER_SEAT_FAILED',
        message: 'Failed to offer seat',
      },
    });
  }
};

/**
 * Get reservations requiring reconfirmation (staff only)
 */
export const getRequiringReconfirmation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const reservations = await reservationModel.getRequiringReconfirmation();

    res.json({
      success: true,
      data: { reservations },
    });
  } catch (error: any) {
    logger.error('Get reconfirmations failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_RECONFIRMATIONS_FAILED',
        message: 'Failed to get reservations requiring reconfirmation',
      },
    });
  }
};

/**
 * Get reservation statistics (staff only)
 */
export const getStatistics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const statistics = await reservationModel.getStatistics();

    res.json({
      success: true,
      data: { statistics },
    });
  } catch (error: any) {
    logger.error('Get statistics failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STATISTICS_FAILED',
        message: 'Failed to get statistics',
      },
    });
  }
};
