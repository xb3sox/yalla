import cancellationService from '../../../src/services/cancellation.service';
import pool from '../../../src/config/database';
import { stripe } from '../../../src/models/payment.model';
import waitlistService from '../../../src/services/waitlist.service';
import rewardModel from '../../../src/models/reward.model';

jest.mock('../../../src/config/database');
jest.mock('../../../src/models/payment.model', () => ({
  __esModule: true,
  default: {
    findByReservationId: jest.fn(),
  },
  stripe: {
    refunds: {
      create: jest.fn(),
    },
  },
}));
jest.mock('../../../src/services/waitlist.service');
jest.mock('../../../src/models/reward.model');

describe('CancellationService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateRefundAmount', () => {
    const mockReservation = { price: 200 };
    const eventStartTime = new Date('2027-01-20T18:00:00Z');

    it('should calculate 100% full refund when > 48 hours before start', () => {
      const now = new Date('2027-01-18T10:00:00Z'); // ~56 hours before
      const result = cancellationService.calculateRefundAmount(
        mockReservation,
        eventStartTime,
        'participant',
        200,
        now
      );

      expect(result.tier).toBe('full');
      expect(result.percentage).toBe(100);
      expect(result.refundAmount).toBe(200);
      expect(result.hoursUntilStart).toBeGreaterThan(48);
    });

    it('should calculate 50% partial refund when 24-48 hours before start', () => {
      const now = new Date('2027-01-19T06:00:00Z'); // ~36 hours before
      const result = cancellationService.calculateRefundAmount(
        mockReservation,
        eventStartTime,
        'participant',
        200,
        now
      );

      expect(result.tier).toBe('partial');
      expect(result.percentage).toBe(50);
      expect(result.refundAmount).toBe(100);
      expect(result.hoursUntilStart).toBeGreaterThanOrEqual(24);
      expect(result.hoursUntilStart).toBeLessThanOrEqual(48);
    });

    it('should calculate 0% refund when < 24 hours before start', () => {
      const now = new Date('2027-01-20T02:00:00Z'); // 16 hours before
      const result = cancellationService.calculateRefundAmount(
        mockReservation,
        eventStartTime,
        'participant',
        200,
        now
      );

      expect(result.tier).toBe('none');
      expect(result.percentage).toBe(0);
      expect(result.refundAmount).toBe(0);
      expect(result.hoursUntilStart).toBeLessThan(24);
    });

    it('should calculate 100% operational refund when canceled by Yalla/Host', () => {
      const now = new Date('2027-01-20T17:00:00Z'); // 1 hour before
      const result = cancellationService.calculateRefundAmount(
        mockReservation,
        eventStartTime,
        'yalla',
        200,
        now
      );

      expect(result.tier).toBe('operational');
      expect(result.percentage).toBe(100);
      expect(result.refundAmount).toBe(200);
    });
  });

  describe('executeCancellation', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);
      (waitlistService.promoteNext as jest.Mock).mockResolvedValue(null);
      (rewardModel.addTransaction as jest.Mock).mockResolvedValue({});
    });

    it('should execute full cancellation lifecycle with Stripe refund, atomic audit event, and waitlist promotion', async () => {
      const reservationId = '11111111-1111-1111-1111-111111111111';
      const actorId = 'user-1';
      const expId = 'exp-1';

      mockClient.query.mockImplementation((queryText: string) => {
        if (queryText.includes('SELECT r.*, e.id AS exp_id')) {
          return Promise.resolve({
            rows: [
              {
                id: reservationId,
                participant_id: actorId,
                state: 'confirmed',
                exp_id: expId,
                exp_date: '2027-01-25',
                exp_time: '18:00:00',
                exp_price: 200,
                exp_title: 'Desert Camping',
                exp_title_ar: 'تخييم صحراوي',
              },
            ],
          });
        }
        if (queryText.includes('SELECT * FROM payments WHERE reservation_id')) {
          return Promise.resolve({
            rows: [
              {
                id: 'pay-1',
                reservation_id: reservationId,
                amount: 200,
                stripe_payment_id: 'pi_test123',
                status: 'completed',
              },
            ],
          });
        }
        if (queryText.includes('SELECT * FROM reservations WHERE id =')) {
          return Promise.resolve({
            rows: [
              {
                id: reservationId,
                state: 'refunded',
                cancelled_at: new Date(),
              },
            ],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      (stripe.refunds.create as jest.Mock).mockResolvedValue({
        id: 're_test999',
      });

      const now = new Date('2027-01-20T10:00:00Z'); // 5+ days before start (>48h)
      const result = await cancellationService.executeCancellation({
        reservationId,
        canceledBy: 'participant',
        actorId,
        actorRole: 'participant',
        now,
      });

      expect(stripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test123',
        amount: 20000, // $200.00 in cents
        metadata: {
          reservation_id: reservationId,
          tier: 'full',
        },
      });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_events'),
        expect.arrayContaining([
          actorId,
          'participant',
          'reservation_cancelled',
          'reservation',
          reservationId,
        ])
      );

      expect(waitlistService.promoteNext).toHaveBeenCalledWith(expId);
      expect(result.refund.tier).toBe('full');
      expect(result.refund.amount).toBe(200);
      expect(result.reservation.state).toBe('refunded');
    });

    it('should award bonus loyalty points on operational cancellation', async () => {
      const reservationId = '22222222-2222-2222-2222-222222222222';
      const actorId = 'staff-1';
      const expId = 'exp-2';

      mockClient.query.mockImplementation((queryText: string) => {
        if (queryText.includes('SELECT r.*, e.id AS exp_id')) {
          return Promise.resolve({
            rows: [
              {
                id: reservationId,
                participant_id: 'participant-99',
                state: 'confirmed',
                exp_id: expId,
                exp_date: '2027-01-21',
                exp_time: '18:00:00',
                exp_price: 150,
                exp_title: 'Stargazing',
              },
            ],
          });
        }
        if (queryText.includes('SELECT * FROM payments WHERE reservation_id')) {
          return Promise.resolve({ rows: [] });
        }
        if (queryText.includes('SELECT * FROM reservations WHERE id =')) {
          return Promise.resolve({
            rows: [
              {
                id: reservationId,
                state: 'refunded',
              },
            ],
          });
        }
        return Promise.resolve({ rows: [] });
      });

      const result = await cancellationService.executeCancellation({
        reservationId,
        canceledBy: 'yalla',
        actorId,
        actorRole: 'staff',
        now: new Date('2027-01-21T17:00:00Z'),
      });

      expect(rewardModel.addTransaction).toHaveBeenCalledWith(
        'participant-99',
        100,
        'earned',
        'Operational cancellation bonus loyalty points credit'
      );
      expect(result.refund.tier).toBe('operational');
      expect(result.refund.amount).toBe(150);
    });
  });
});
