import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import paymentModel from '../models/payment.model';
import reservationModel from '../models/reservation.model';
import logger from '../utils/logger';
import { stripe } from '../models/payment.model';

/**
 * Create payment intent for reservation
 */
export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
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

    const { reservation_id } = req.body;

    // Verify reservation exists and belongs to user
    const reservation = await reservationModel.findById(reservation_id);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found',
        },
      });
    }

    if (reservation.participant_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to pay for this reservation',
        },
      });
    }

    // Check if payment already exists
    const existingPayment = await paymentModel.findByReservationId(reservation_id);
    if (existingPayment) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'PAYMENT_EXISTS',
          message: 'Payment already exists for this reservation',
          data: { payment: existingPayment },
        },
      });
    }

    // Get experience price (you'll need to implement this)
    // For now, using a placeholder
    const amount = 100; // TODO: Get from experience

    // Create payment intent
    const payment = await paymentModel.createPaymentIntent({
      reservation_id,
      amount,
      currency: 'sar',
    });

    logger.info('Payment intent created', { 
      userId: req.user.userId, 
      reservationId: reservation_id,
      paymentId: payment.id 
    });

    res.status(201).json({
      success: true,
      data: {
        payment,
        clientSecret: payment.stripe_client_secret,
      },
    });
  } catch (error: any) {
    logger.error('Create payment intent failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_PAYMENT_FAILED',
        message: 'Failed to create payment intent',
      },
    });
  }
};

/**
 * Get payment by reservation ID
 */
export const getPaymentByReservation = async (req: AuthRequest, res: Response) => {
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

    const { reservationId } = req.params;
    const payment = await paymentModel.findByReservationId(reservationId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
        },
      });
    }

    // Verify ownership (unless staff)
    const reservation = await reservationModel.findById(reservationId);
    if (
      reservation?.participant_id !== req.user.userId &&
      !['operations', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this payment',
        },
      });
    }

    res.json({
      success: true,
      data: { payment },
    });
  } catch (error: any) {
    logger.error('Get payment failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PAYMENT_FAILED',
        message: 'Failed to get payment',
      },
    });
  }
};

/**
 * Process refund
 */
export const processRefund = async (req: AuthRequest, res: Response) => {
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

    const { reservationId } = req.params;
    const { amount } = req.body;

    // Get payment
    const payment = await paymentModel.findByReservationId(reservationId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
        },
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYMENT_STATUS',
          message: 'Payment is not in completed status',
        },
      });
    }

    // Process refund
    const refundedPayment = await paymentModel.processRefund(
      payment.stripe_payment_id!,
      amount
    );

    // Update reservation state
    await reservationModel.updateState(reservationId, 'refund_pending');

    logger.info('Refund processed', { 
      staffId: req.user.userId, 
      reservationId,
      amount: amount || 'full' 
    });

    res.json({
      success: true,
      data: { payment: refundedPayment },
      message: 'Refund processed successfully',
    });
  } catch (error: any) {
    logger.error('Process refund failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'REFUND_FAILED',
        message: 'Failed to process refund',
      },
    });
  }
};

/**
 * Handle Stripe webhook
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      config.stripe.webhookSecret
    );

    await paymentModel.handleWebhook(event);

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Stripe webhook failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: {
        code: 'WEBHOOK_FAILED',
        message: `Webhook Error: ${error.message}`,
      },
    });
  }
};
