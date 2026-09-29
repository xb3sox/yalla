import paymentModel from '../src/models/payment.model';
import reservationModel from '../src/models/reservation.model';
import experienceModel from '../src/models/experience.model';
import userModel from '../src/models/user.model';
import pool from '../src/config/database';

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
      displayName: 'Payment Test User',
      language: 'en',
      adultDeclarationAccepted: true,
      termsAccepted: true,
    });
    testUserId = user.id;

    // Create test experience
    const experience = await experienceModel.create({
      title: 'Payment Test Experience',
      titleAr: 'تجربة اختبار الدفع',
      description: 'Test description',
      descriptionAr: 'وصف اختباري',
      date: '2026-03-01',
      time: '10:00',
      duration: '2 hours',
      durationMinutes: 120,
      area: 'Riyadh',
      areaAr: 'الرياض',
      groupSizeMin: 4,
      groupSizeMax: 8,
      language: 'en',
      price: 100,
      capacity: 8,
      planState: 'published',
    });
    testExperienceId = experience.id;

    // Create test reservation
    const reservation = await reservationModel.create({
      participantId: testUserId,
      experienceId: testExperienceId,
      idempotencyKey: 'payment-test-key',
    });
    testReservationId = reservation.id;
  });

  afterAll(async () => {
    // Clean up
    if (testPaymentId) {
      await pool.query('DELETE FROM payments WHERE id = $1', [testPaymentId]);
    }
    await pool.query('DELETE FROM reservations WHERE id = $1', [testReservationId]);
    await pool.query('DELETE FROM experiences WHERE id = $1', [testExperienceId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent', async () => {
      const payment = await paymentModel.createPaymentIntent({
        reservationId: testReservationId,
        amount: 100,
        currency: 'sar',
      });

      expect(payment).toBeDefined();
      expect(payment.id).toBeDefined();
      expect(payment.reservationId).toBe(testReservationId);
      expect(payment.amount).toBe(100);
      expect(payment.currency).toBe('sar');
      expect(payment.status).toBe('pending');
      expect(payment.stripePaymentIntentId).toBeDefined();
      expect(payment.stripeClientSecret).toBeDefined();

      testPaymentId = payment.id;
    });

    it('should prevent duplicate payment intents for same reservation', async () => {
      await expect(
        paymentModel.createPaymentIntent({
          reservationId: testReservationId,
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
      expect(payment?.reservationId).toBe(testReservationId);
    });

    it('should return null for non-existent reservation', async () => {
      const payment = await paymentModel.findByReservationId(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(payment).toBeNull();
    });
  });

  describe('findByStripePaymentIntentId', () => {
    it('should find payment by Stripe payment intent ID', async () => {
      const originalPayment = await paymentModel.findByReservationId(testReservationId);
      const payment = await paymentModel.findByStripePaymentIntentId(
        originalPayment!.stripePaymentIntentId
      );

      expect(payment).toBeDefined();
      expect(payment?.id).toBe(testPaymentId);
    });

    it('should return null for non-existent Stripe payment intent ID', async () => {
      const payment = await paymentModel.findByStripePaymentIntentId('pi_nonexistent');
      expect(payment).toBeNull();
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment', async () => {
      const payment = await paymentModel.findByReservationId(testReservationId);
      const confirmed = await paymentModel.confirmPayment(payment!.stripePaymentIntentId);

      expect(confirmed).toBeDefined();
      expect(confirmed.status).toBe('completed');
      expect(confirmed.completedAt).toBeDefined();
    });

    it('should throw error for non-existent payment', async () => {
      await expect(
        paymentModel.confirmPayment('pi_nonexistent')
      ).rejects.toThrow('Payment not found');
    });
  });

  describe('refundPayment', () => {
    it('should refund full payment', async () => {
      const payment = await paymentModel.findByReservationId(testReservationId);
      const refunded = await paymentModel.refundPayment(payment!.id);

      expect(refunded).toBeDefined();
      expect(refunded.status).toBe('refunded');
      expect(refunded.refundAmount).toBe(payment!.amount);
      expect(refunded.refundedAt).toBeDefined();
    });

    it('should refund partial payment', async () => {
      // Create new payment for partial refund test
      const newReservation = await reservationModel.create({
        participantId: testUserId,
        experienceId: testExperienceId,
        idempotencyKey: 'partial-refund-test',
      });

      const newPayment = await paymentModel.createPaymentIntent({
        reservationId: newReservation.id,
        amount: 100,
        currency: 'sar',
      });

      await paymentModel.confirmPayment(newPayment.stripePaymentIntentId);

      const refunded = await paymentModel.refundPayment(newPayment.id, 50);

      expect(refunded).toBeDefined();
      expect(refunded.status).toBe('partially_refunded');
      expect(refunded.refundAmount).toBe(50);
    });

    it('should throw error for non-existent payment', async () => {
      await expect(
        paymentModel.refundPayment('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error for non-completed payment', async () => {
      const newReservation = await reservationModel.create({
        participantId: testUserId,
        experienceId: testExperienceId,
        idempotencyKey: 'non-completed-refund-test',
      });

      const newPayment = await paymentModel.createPaymentIntent({
        reservationId: newReservation.id,
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
