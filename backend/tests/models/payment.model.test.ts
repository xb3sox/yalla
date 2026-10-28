jest.mock('stripe', () => require('../helpers/stripeMock').stripeMockFactory());

import paymentModel from '../../src/models/payment.model';
import reservationModel from '../../src/models/reservation.model';
import experienceModel from '../../src/models/experience.model';
import userModel from '../../src/models/user.model';
import pool from '../../src/config/database';

describe('Payment Model', () => {
  let testUserId: string;
  let testExperienceId: string;
  let testReservationId: string;
  let testPaymentId: string;

  beforeAll(async () => {
    // Create test user
    const user = await userModel.create({
      phone: '+966508888888',
      password: 'password123',
      display_name: 'Payment Test User',
      language: 'en',
      adult_declaration_accepted: true,
      terms_accepted: true,
    });
    testUserId = user.id;

    // Create test experience
    const experience = await experienceModel.create({
      title: 'Payment Test Experience',
      title_ar: 'تجربة اختبار الدفع',
      description: 'Test description',
      description_ar: 'وصف اختباري',
      date: '2027-03-01',
      time: '10:00',
      duration: '2 hours',
      duration_minutes: 120,
      area: 'Riyadh',
      area_ar: 'الرياض',
      group_size_min: 4,
      group_size_max: 8,
      language: 'en',
      price: 100,
      capacity: 8,
      plan_state: 'published',
    });
    testExperienceId = experience.id;

    // Create test reservation
    const reservation = await reservationModel.create({
      participant_id: testUserId,
      experience_id: testExperienceId,
      idempotency_key: 'payment-test-key',
    });
    testReservationId = reservation.id;
  });

  // No per-file cleanup: tests/setup.ts wipes all tables before each file.


  // A participant may hold only one active reservation per experience, so
  // scenarios that need another reservation must use a fresh participant.
  async function createFreshReservation(key: string): Promise<string> {
    const suffix = Math.floor(100000 + Math.random() * 899999);
    const user = await userModel.create({
      phone: `+9665077${suffix}`,
      password: 'password123',
      display_name: 'Refund Test User',
      language: 'en',
      adult_declaration_accepted: true,
      terms_accepted: true,
    } as any);
    const reservation = await reservationModel.create({
      participant_id: user.id,
      experience_id: testExperienceId,
      idempotency_key: key,
    } as any);
    return reservation.id;
  }

  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      const payment = await paymentModel.createPaymentIntent({
        reservation_id: testReservationId,
        amount: 100,
        currency: 'sar',
      });

      expect(payment).toBeDefined();
      expect(payment.id).toBeDefined();
      expect(payment.reservation_id).toBe(testReservationId);
      expect(payment.amount).toBe(100);
      expect(payment.currency).toBe('sar');
      expect(payment.status).toBe('pending');
      expect(payment.stripe_payment_id).toBeDefined();
      expect(payment.stripe_client_secret).toBeDefined();

      testPaymentId = payment.id;
    });

    it('should prevent duplicate payment intents for same reservation', async () => {
      await expect(
        paymentModel.createPaymentIntent({
          reservation_id: testReservationId,
          amount: 100,
          currency: 'sar',
        })
      ).rejects.toThrow('Payment intent already exists for this reservation');
    });
  });

  describe('findByReservationId', () => {
    it('should find payment by reservation ID', async () => {
      const payment = await paymentModel.findByReservationId(testReservationId);

      expect(payment).toBeDefined();
      expect(payment?.id).toBe(testPaymentId);
      expect(payment?.reservation_id).toBe(testReservationId);
    });

    it('should return null for non-existent reservation', async () => {
      const payment = await paymentModel.findByReservationId(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(payment).toBeNull();
    });
  });

  describe('findByStripePaymentId', () => {
    it('should find payment by Stripe payment intent ID', async () => {
      const originalPayment = await paymentModel.findByReservationId(testReservationId);
      const payment = await paymentModel.findByStripePaymentId(
        originalPayment!.stripe_payment_id!
      );

      expect(payment).toBeDefined();
      expect(payment?.id).toBe(testPaymentId);
    });

    it('should return null for non-existent Stripe payment intent ID', async () => {
      const payment = await paymentModel.findByStripePaymentId('pi_nonexistent');
      expect(payment).toBeNull();
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment', async () => {
      const payment = await paymentModel.findByReservationId(testReservationId);
      const confirmed = await paymentModel.confirmPayment(payment!.stripe_payment_id!);

      expect(confirmed).toBeDefined();
      expect(confirmed.status).toBe('completed');
      expect(confirmed.completed_at).toBeDefined();
    });

    it('should throw error for non-existent payment', async () => {
      await expect(
        paymentModel.confirmPayment('pi_nonexistent')
      ).rejects.toThrow(/No such payment_intent/);
    });
  });

  describe('refundPayment', () => {
    it('should refund full payment', async () => {
      const payment = await paymentModel.findByReservationId(testReservationId);
      const refunded = await paymentModel.refundPayment(payment!.id);

      expect(refunded).toBeDefined();
      expect(refunded.status).toBe('refunded');
      expect(refunded.refund_amount).toBe(payment!.amount);
      expect(refunded.refunded_at).toBeDefined();
    });

    it('should refund partial payment', async () => {
      // Create new payment for partial refund test
      const newReservationId = await createFreshReservation('partial-refund-test');

      const newPayment = await paymentModel.createPaymentIntent({
        reservation_id: newReservationId,
        amount: 100,
        currency: 'sar',
      });

      await paymentModel.confirmPayment(newPayment.stripe_payment_id!);

      const refunded = await paymentModel.refundPayment(newPayment.id, 50);

      expect(refunded).toBeDefined();
      expect(refunded.status).toBe('partially_refunded');
      expect(refunded.refund_amount).toBe(50);
    });

    it('should throw error for non-existent payment', async () => {
      await expect(
        paymentModel.refundPayment('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error for non-completed payment', async () => {
      const newReservationId = await createFreshReservation('non-completed-refund-test');

      const newPayment = await paymentModel.createPaymentIntent({
        reservation_id: newReservationId,
        amount: 100,
        currency: 'sar',
      });

      await expect(paymentModel.refundPayment(newPayment.id)).rejects.toThrow(
        'Payment is not in completed status'
      );
    });
  });

  describe('getPaymentStatistics', () => {
    it('should get payment statistics', async () => {
      const stats = await paymentModel.getPaymentStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalPayments).toBeDefined();
      expect(stats.totalRevenue).toBeDefined();
      expect(stats.completedPayments).toBeDefined();
      expect(stats.refundedPayments).toBeDefined();
    });
  });
});
