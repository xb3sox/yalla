import { describe, it, expect } from 'vitest';
import { 
  calculateReservationPoints,
  calculateFeedbackPoints,
  createRewardTransaction,
  calculateTotalPoints,
  calculateLifetimePoints,
  getUserRewardsSummary,
  canRedeemPoints,
  getPointsTier,
  getNextTierProgress,
  POINTS_CONFIG,
  type RewardTransaction
} from './rewardsUseCase';
import type { Reservation, Feedback } from '../../types';

describe('rewardsUseCase', () => {
  describe('POINTS_CONFIG', () => {
    it('should have correct point values', () => {
      expect(POINTS_CONFIG.BOOKING).toBe(10);
      expect(POINTS_CONFIG.ATTENDANCE).toBe(20);
      expect(POINTS_CONFIG.FEEDBACK).toBe(5);
      expect(POINTS_CONFIG.HIGH_RATING).toBe(10);
    });
  });

  describe('calculateReservationPoints', () => {
    it('should award points for booking', () => {
      const reservation: Reservation = {
        id: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        state: 'confirmed',
        createdAt: '2026-01-20T14:00:00Z',
        paymentState: 'captured',
        idempotencyKey: 'idem-1',
      };
      
      const points = calculateReservationPoints(reservation);
      expect(points).toBe(POINTS_CONFIG.BOOKING);
    });

    it('should award bonus points for attendance', () => {
      const reservation: Reservation = {
        id: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        state: 'attended',
        createdAt: '2026-01-20T14:00:00Z',
        paymentState: 'captured',
        idempotencyKey: 'idem-1',
      };
      
      const points = calculateReservationPoints(reservation);
      expect(points).toBe(POINTS_CONFIG.BOOKING + POINTS_CONFIG.ATTENDANCE);
    });

    it('should award bonus points for completed state', () => {
      const reservation: Reservation = {
        id: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        state: 'completed',
        createdAt: '2026-01-20T14:00:00Z',
        paymentState: 'captured',
        idempotencyKey: 'idem-1',
      };
      
      const points = calculateReservationPoints(reservation);
      expect(points).toBe(POINTS_CONFIG.BOOKING + POINTS_CONFIG.ATTENDANCE);
    });

    it('should not award attendance bonus for non-attended states', () => {
      const reservation: Reservation = {
        id: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        state: 'waitlisted',
        createdAt: '2026-01-20T14:00:00Z',
        paymentState: 'captured',
        idempotencyKey: 'idem-1',
      };
      
      const points = calculateReservationPoints(reservation);
      expect(points).toBe(POINTS_CONFIG.BOOKING);
    });
  });

  describe('calculateFeedbackPoints', () => {
    it('should award base points for feedback', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        reservationId: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        worthTime: 3,
        descriptionAccurate: true,
        comfortableOrganized: true,
        createdAt: '2026-01-20T14:00:00Z',
      };
      
      const points = calculateFeedbackPoints(feedback);
      expect(points).toBe(POINTS_CONFIG.FEEDBACK);
    });

    it('should award bonus for high rating (4)', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        reservationId: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        worthTime: 4,
        descriptionAccurate: true,
        comfortableOrganized: true,
        createdAt: '2026-01-20T14:00:00Z',
      };
      
      const points = calculateFeedbackPoints(feedback);
      expect(points).toBe(POINTS_CONFIG.FEEDBACK + POINTS_CONFIG.HIGH_RATING);
    });

    it('should award bonus for high rating (5)', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        reservationId: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        worthTime: 5,
        descriptionAccurate: true,
        comfortableOrganized: true,
        createdAt: '2026-01-20T14:00:00Z',
      };
      
      const points = calculateFeedbackPoints(feedback);
      expect(points).toBe(POINTS_CONFIG.FEEDBACK + POINTS_CONFIG.HIGH_RATING);
    });

    it('should not award bonus for low rating', () => {
      const feedback: Feedback = {
        id: 'fb-1',
        reservationId: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        worthTime: 2,
        descriptionAccurate: true,
        comfortableOrganized: true,
        createdAt: '2026-01-20T14:00:00Z',
      };
      
      const points = calculateFeedbackPoints(feedback);
      expect(points).toBe(POINTS_CONFIG.FEEDBACK);
    });
  });

  describe('createRewardTransaction', () => {
    it('should create earn transaction', () => {
      const transaction = createRewardTransaction(
        'user-1',
        'earn',
        10,
        'Booking reward',
        'مكافأة الحجز'
      );
      
      expect(transaction.userId).toBe('user-1');
      expect(transaction.type).toBe('earn');
      expect(transaction.points).toBe(10);
      expect(transaction.reason).toBe('Booking reward');
      expect(transaction.reasonAr).toBe('مكافأة الحجز');
      expect(transaction.id).toMatch(/^reward-/);
    });

    it('should create redeem transaction with negative points', () => {
      const transaction = createRewardTransaction(
        'user-1',
        'redeem',
        50,
        'Discount redemption',
        'استبدال الخصم'
      );
      
      expect(transaction.type).toBe('redeem');
      expect(transaction.points).toBe(-50);
    });

    it('should include reservation ID if provided', () => {
      const transaction = createRewardTransaction(
        'user-1',
        'earn',
        10,
        'Booking reward',
        'مكافأة الحجز',
        'res-1'
      );
      
      expect(transaction.reservationId).toBe('res-1');
    });
  });

  describe('calculateTotalPoints', () => {
    it('should calculate total from earn and redeem transactions', () => {
      const transactions: RewardTransaction[] = [
        { id: 'r1', userId: 'user-1', type: 'earn', points: 100, reason: '', reasonAr: '', timestamp: '' },
        { id: 'r2', userId: 'user-1', type: 'earn', points: 50, reason: '', reasonAr: '', timestamp: '' },
        { id: 'r3', userId: 'user-1', type: 'redeem', points: -30, reason: '', reasonAr: '', timestamp: '' },
      ];
      
      const total = calculateTotalPoints(transactions);
      expect(total).toBe(120);
    });

    it('should return 0 for empty transactions', () => {
      const total = calculateTotalPoints([]);
      expect(total).toBe(0);
    });
  });

  describe('calculateLifetimePoints', () => {
    it('should calculate only earn transactions', () => {
      const transactions: RewardTransaction[] = [
        { id: 'r1', userId: 'user-1', type: 'earn', points: 100, reason: '', reasonAr: '', timestamp: '' },
        { id: 'r2', userId: 'user-1', type: 'redeem', points: -50, reason: '', reasonAr: '', timestamp: '' },
        { id: 'r3', userId: 'user-1', type: 'earn', points: 200, reason: '', reasonAr: '', timestamp: '' },
      ];
      
      const lifetime = calculateLifetimePoints(transactions);
      expect(lifetime).toBe(300);
    });
  });

  describe('getPointsTier', () => {
    it('should return Member tier for 0-49 points', () => {
      const tier = getPointsTier(0);
      expect(tier.tier).toBe('Member');
      expect(tier.tierAr).toBe('عضو');
    });

    it('should return Bronze tier for 50-199 points', () => {
      const tier = getPointsTier(50);
      expect(tier.tier).toBe('Bronze');
      expect(tier.tierAr).toBe('برونزي');
    });

    it('should return Silver tier for 200-499 points', () => {
      const tier = getPointsTier(200);
      expect(tier.tier).toBe('Silver');
      expect(tier.tierAr).toBe('فضي');
    });

    it('should return Gold tier for 500-999 points', () => {
      const tier = getPointsTier(500);
      expect(tier.tier).toBe('Gold');
      expect(tier.tierAr).toBe('ذهبي');
    });

    it('should return Platinum tier for 1000+ points', () => {
      const tier = getPointsTier(1000);
      expect(tier.tier).toBe('Platinum');
      expect(tier.tierAr).toBe('بلاتيني');
    });
  });

  describe('getNextTierProgress', () => {
    it('should calculate progress for Member tier', () => {
      const progress = getNextTierProgress(25);
      expect(progress.currentTier).toBe('Member');
      expect(progress.nextTier).toBe('Bronze');
      expect(progress.pointsToNextTier).toBe(25);
      expect(progress.progress).toBe(50);
    });

    it('should calculate progress for Bronze tier', () => {
      const progress = getNextTierProgress(100);
      expect(progress.currentTier).toBe('Bronze');
      expect(progress.nextTier).toBe('Silver');
      expect(progress.pointsToNextTier).toBe(100);
    });

    it('should return Max tier for Platinum', () => {
      const progress = getNextTierProgress(1500);
      expect(progress.currentTier).toBe('Platinum');
      expect(progress.nextTier).toBe('Max');
      expect(progress.progress).toBe(100);
    });

    it('should cap progress at 100%', () => {
      const progress = getNextTierProgress(49);
      expect(progress.progress).toBeLessThanOrEqual(100);
    });
  });

  describe('canRedeemPoints', () => {
    it('should allow redemption if enough points', () => {
      const userRewards = {
        userId: 'user-1',
        totalPoints: 100,
        lifetimePoints: 100,
        transactions: [],
      };
      
      expect(canRedeemPoints(userRewards, 50)).toBe(true);
    });

    it('should reject redemption if insufficient points', () => {
      const userRewards = {
        userId: 'user-1',
        totalPoints: 30,
        lifetimePoints: 100,
        transactions: [],
      };
      
      expect(canRedeemPoints(userRewards, 50)).toBe(false);
    });
  });

  describe('getUserRewardsSummary', () => {
    it('should return complete summary', () => {
      const transactions: RewardTransaction[] = [
        { id: 'r1', userId: 'user-1', type: 'earn', points: 100, reason: '', reasonAr: '', timestamp: '' },
      ];
      
      const summary = getUserRewardsSummary('user-1', [], [], transactions);
      
      expect(summary.userId).toBe('user-1');
      expect(summary.totalPoints).toBe(100);
      expect(summary.lifetimePoints).toBe(100);
      expect(summary.transactions).toHaveLength(1);
    });
  });
});
