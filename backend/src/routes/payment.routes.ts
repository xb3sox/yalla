import { Router } from 'express';
import {
  createPaymentIntent,
  getPaymentByReservation,
  processRefund,
  handleStripeWebhook,
} from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/payments/intent
 * @desc    Create payment intent
 * @access  Private (Participants)
 */
router.post('/intent', authenticate, createPaymentIntent);

/**
 * @route   GET /api/v1/payments/reservation/:reservationId
 * @desc    Get payment by reservation ID
 * @access  Private
 */
router.get('/reservation/:reservationId', authenticate, getPaymentByReservation);

/**
 * @route   POST /api/v1/payments/reservation/:reservationId/refund
 * @desc    Process refund
 * @access  Private (Staff)
 */
router.post(
  '/reservation/:reservationId/refund',
  authenticate,
  authorize('operations', 'admin'),
  processRefund
);

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Stripe webhook
 * @access  Public (Stripe)
 */
router.post('/webhook', handleStripeWebhook);

export default router;
