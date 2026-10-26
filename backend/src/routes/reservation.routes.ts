import { Router } from 'express';
import {
  createReservation,
  getUserReservations,
  getReservationById,
  reconfirmReservation,
  checkInReservation,
  getExperienceReservations,
  getWaitlist,
  offerSeatFromWaitlist,
  getRequiringReconfirmation,
  getStatistics,
} from '../controllers/reservation.controller';
import {
  cancelReservationSchema,
  cancelReservationHandler,
} from '../controllers/cancellation.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /api/v1/reservations
 * @desc    Create a new reservation
 * @access  Private (Participants)
 */
router.post('/', authenticate, createReservation);

/**
 * @route   GET /api/v1/reservations
 * @desc    Get user's reservations
 * @access  Private
 */
router.get('/', authenticate, getUserReservations);

/**
 * @route   GET /api/v1/reservations/requiring-reconfirmation
 * @desc    Get reservations requiring reconfirmation
 * @access  Private (Staff)
 */
router.get(
  '/requiring-reconfirmation',
  authenticate,
  authorize('operations', 'support', 'admin'),
  getRequiringReconfirmation
);

/**
 * @route   GET /api/v1/reservations/statistics
 * @desc    Get reservation statistics
 * @access  Private (Staff)
 */
router.get(
  '/statistics',
  authenticate,
  authorize('operations', 'admin'),
  getStatistics
);

/**
 * @route   GET /api/v1/reservations/:id
 * @desc    Get reservation by ID
 * @access  Private
 */
router.get('/:id', authenticate, getReservationById);

/**
 * @route   POST /api/v1/reservations/:id/reconfirm
 * @desc    Reconfirm reservation
 * @access  Private (Participants)
 */
router.post('/:id/reconfirm', authenticate, reconfirmReservation);

/**
 * @route   POST /api/v1/reservations/:id/check-in
 * @desc    Check in reservation (transition to attended)
 * @access  Private (Participants)
 */
router.post('/:id/check-in', authenticate, checkInReservation);

/**
 * @route   POST /api/v1/reservations/:id/cancel
 * @desc    Cancel reservation
 * @access  Private
 */
router.post(
  '/:id/cancel',
  authenticate,
  validate(cancelReservationSchema),
  cancelReservationHandler
);

/**
 * @route   GET /api/v1/reservations/experience/:experienceId
 * @desc    Get reservations for an experience
 * @access  Private (Staff)
 */
router.get(
  '/experience/:experienceId',
  authenticate,
  authorize('operations', 'support', 'admin'),
  getExperienceReservations
);

/**
 * @route   GET /api/v1/reservations/experience/:experienceId/waitlist
 * @desc    Get waitlist for an experience
 * @access  Private (Staff)
 */
router.get(
  '/experience/:experienceId/waitlist',
  authenticate,
  authorize('operations', 'support', 'admin'),
  getWaitlist
);

/**
 * @route   POST /api/v1/reservations/experience/:experienceId/offer-seat
 * @desc    Offer seat from waitlist
 * @access  Private (Staff)
 */
router.post(
  '/experience/:experienceId/offer-seat',
  authenticate,
  authorize('operations', 'admin'),
  offerSeatFromWaitlist
);

export default router;
