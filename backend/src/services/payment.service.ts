import Stripe from 'stripe';
import config from '../config';
import logger from '../utils/logger';
import paymentModel, { Payment } from '../models/payment.model';

const stripeInstance = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

export { stripeInstance as stripe };

export interface CreatePaymentIntentParams {
  amount: number; // in SAR
  reservationId: string;
  userId: string;
}

export class PaymentService {
  public stripe = stripeInstance;

  /**
   * Creates a Stripe PaymentIntent configured for Saudi Mada 3DS2 compliance and Apple Pay.
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Payment> {
    const { amount, reservationId, userId } = params;

    // 1. Check if a payment already exists for this reservation
    const existingPayment = await paymentModel.findByReservationId(reservationId);
    if (existingPayment) {
      const error: any = new Error('Payment already exists for this reservation');
      error.code = 'PAYMENT_EXISTS';
      error.existingPayment = existingPayment;
      throw error;
    }

    // 2. Create Stripe PaymentIntent with Mada & Apple Pay requirements
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // SAR in halalas
      currency: 'sar',
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'any', // Enforce 3DS2 for Mada compliance
        },
      },
      metadata: {
        reservation_id: reservationId,
        user_id: userId,
      },
    });

    // 3. Save payment to DB using paymentModel
    const payment = await paymentModel.createPaymentIntentWithStripeId({
      reservation_id: reservationId,
      amount,
      currency: 'sar',
      stripe_payment_id: paymentIntent.id,
      stripe_client_secret: paymentIntent.client_secret || undefined,
    });

    logger.info('Mada/ApplePay PaymentIntent created via PaymentService', {
      paymentId: payment.id,
      stripePaymentId: paymentIntent.id,
      reservationId,
      userId,
      amount,
    });

    return payment;
  }

  /**
   * Idempotently process Stripe webhooks (e.g., payment_intent.succeeded)
   */
  async handleWebhook(event: Stripe.Event): Promise<{ handled: boolean; eventType: string }> {
    logger.info(`Processing Stripe webhook event: ${event.type}`, { eventId: event.id });

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const existingPayment = await paymentModel.findByStripePaymentId(paymentIntent.id);

        if (existingPayment && existingPayment.status === 'completed') {
          logger.info(`PaymentIntent ${paymentIntent.id} already completed, idempotent skip.`);
          return { handled: true, eventType: event.type };
        }

        await paymentModel.confirmPayment(paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await paymentModel.failPayment(paymentIntent.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;

        if (paymentIntentId) {
          await paymentModel.markRefunded(paymentIntentId);
        }
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return { handled: true, eventType: event.type };
  }
}

export default new PaymentService();
