import paymentService from '../../../src/services/payment.service';
import paymentModel from '../../../src/models/payment.model';

// Mock paymentModel
jest.mock('../../../src/models/payment.model');

describe('PaymentService Unit Tests', () => {
  let paymentIntentCreateSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    paymentIntentCreateSpy = jest
      .spyOn(paymentService.stripe.paymentIntents, 'create')
      .mockImplementation();
  });

  afterEach(() => {
    paymentIntentCreateSpy.mockRestore();
  });

  describe('createPaymentIntent', () => {
    it('should configure PaymentIntent with SAR currency halalas and Mada 3DS2 options', async () => {
      (paymentModel.findByReservationId as jest.Mock).mockResolvedValue(null);

      const mockStripePaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
      };
      paymentIntentCreateSpy.mockResolvedValue(mockStripePaymentIntent as any);

      const mockSavedPayment = {
        id: 'pay_123',
        reservation_id: 'res_456',
        amount: 150,
        currency: 'sar',
        status: 'pending',
        stripe_payment_id: 'pi_test_123',
        stripe_client_secret: 'pi_test_123_secret',
      };
      (paymentModel.createPaymentIntentWithStripeId as jest.Mock).mockResolvedValue(
        mockSavedPayment
      );

      const result = await paymentService.createPaymentIntent({
        amount: 150, // 150 SAR
        reservationId: 'res_456',
        userId: 'user_789',
      });

      expect(paymentModel.findByReservationId).toHaveBeenCalledWith('res_456');

      expect(paymentIntentCreateSpy).toHaveBeenCalledWith({
        amount: 15000, // 150 SAR in halalas
        currency: 'sar',
        payment_method_types: ['card'],
        payment_method_options: {
          card: {
            request_three_d_secure: 'any',
          },
        },
        metadata: {
          reservation_id: 'res_456',
          user_id: 'user_789',
        },
      });

      expect(paymentModel.createPaymentIntentWithStripeId).toHaveBeenCalledWith({
        reservation_id: 'res_456',
        amount: 150,
        currency: 'sar',
        stripe_payment_id: 'pi_test_123',
        stripe_client_secret: 'pi_test_123_secret',
      });

      expect(result).toEqual(mockSavedPayment);
    });

    it('should throw PAYMENT_EXISTS error if payment already exists for reservation', async () => {
      (paymentModel.findByReservationId as jest.Mock).mockResolvedValue({
        id: 'pay_existing',
      });

      await expect(
        paymentService.createPaymentIntent({
          amount: 100,
          reservationId: 'res_existing',
          userId: 'user_1',
        })
      ).rejects.toMatchObject({
        message: 'Payment already exists for this reservation',
        code: 'PAYMENT_EXISTS',
      });

      expect(paymentIntentCreateSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded idempotently', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_succeeded_123',
          },
        },
      } as any;

      // First run - payment is completed
      (paymentModel.findByStripePaymentId as jest.Mock).mockResolvedValue({
        id: 'pay_123',
        status: 'completed',
      });

      const res1 = await paymentService.handleWebhook(mockEvent);
      expect(res1).toEqual({ handled: true, eventType: 'payment_intent.succeeded' });
      expect(paymentModel.confirmPayment).not.toHaveBeenCalled();

      // Second run - payment not yet confirmed
      (paymentModel.findByStripePaymentId as jest.Mock).mockResolvedValue({
        id: 'pay_123',
        status: 'pending',
      });
      (paymentModel.confirmPayment as jest.Mock).mockResolvedValue({
        id: 'pay_123',
        status: 'completed',
      });

      const res2 = await paymentService.handleWebhook(mockEvent);
      expect(res2).toEqual({ handled: true, eventType: 'payment_intent.succeeded' });
      expect(paymentModel.confirmPayment).toHaveBeenCalledWith('pi_succeeded_123');
    });

    it('should handle payment_intent.payment_failed', async () => {
      const mockEvent = {
        id: 'evt_fail',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failed_123',
          },
        },
      } as any;

      (paymentModel.failPayment as jest.Mock).mockResolvedValue({
        id: 'pay_failed',
        status: 'failed',
      });

      const res = await paymentService.handleWebhook(mockEvent);
      expect(res).toEqual({ handled: true, eventType: 'payment_intent.payment_failed' });
      expect(paymentModel.failPayment).toHaveBeenCalledWith('pi_failed_123');
    });
  });
});
