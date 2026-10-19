/**
 * Rewards System
 * 
 * Implements a points-based reward system for user engagement:
 * - Earn points for bookings, attendance, feedback
 * - Redeem points for discounts
 * - Track reward history
 */

import type { Reservation, Feedback } from '../../domain/entities';
import { api } from '../../services/api';

export interface RewardTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'redeem';
  points: number;
  reason: string;
  reasonAr: string;
  timestamp: string;
  reservationId?: string;
}

export interface UserRewards {
  userId: string;
  totalPoints: number;
  lifetimePoints: number;
  transactions: RewardTransaction[];
}

/**
 * Points configuration
 */
export const POINTS_CONFIG = {
  BOOKING: 10,           // Points for making a booking
  ATTENDANCE: 20,        // Points for attending an experience
  FEEDBACK: 5,           // Points for providing feedback
  HIGH_RATING: 10,       // Bonus points for high rating (4-5 stars)
  REFERRAL: 50,          // Points for referring a friend
  FAVORITE: 2,           // Points for adding to favorites
} as const;

/**
 * Calculate points earned from a reservation
 */
export function calculateReservationPoints(reservation: Reservation): number {
  let points = 0;

  // Points for booking
  points += POINTS_CONFIG.BOOKING;

  // Points for attendance
  if (reservation.state === 'attended' || reservation.state === 'completed') {
    points += POINTS_CONFIG.ATTENDANCE;
  }

  return points;
}

/**
 * Calculate points earned from feedback
 */
export function calculateFeedbackPoints(feedback: Feedback): number {
  let points = POINTS_CONFIG.FEEDBACK;

  // Bonus for high rating
  if (feedback.worthTime >= 4) {
    points += POINTS_CONFIG.HIGH_RATING;
  }

  return points;
}

/**
 * Create reward transaction
 */
export function createRewardTransaction(
  userId: string,
  type: 'earn' | 'redeem',
  points: number,
  reason: string,
  reasonAr: string,
  reservationId?: string
): RewardTransaction {
  return {
    id: `reward-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    points: type === 'redeem' ? -points : points,
    reason,
    reasonAr,
    timestamp: new Date().toISOString(),
    reservationId,
  };
}

/**
 * Calculate total points for a user
 */
export function calculateTotalPoints(transactions: RewardTransaction[]): number {
  return transactions.reduce((total, transaction) => total + transaction.points, 0);
}

/**
 * Calculate lifetime points (only earnings)
 */
export function calculateLifetimePoints(transactions: RewardTransaction[]): number {
  return transactions
    .filter(t => t.type === 'earn')
    .reduce((total, transaction) => total + transaction.points, 0);
}

/**
 * Get user rewards summary
 */
export async function fetchUserRewardsSummary(): Promise<UserRewards | null> {
  try {
    const response = await api.rewards.get();
    if (response.success && response.data) {
      return {
        userId: "current",
        totalPoints: response.data.balance || 0,
        lifetimePoints: calculateLifetimePoints(response.data.transactions || []),
        transactions: response.data.transactions || [],
      };
    }
  } catch (error) {
    console.error("Error fetching rewards summary:", error);
  }
  return null;
}

export function getUserRewardsSummary(
  userId: string,
  reservations: Reservation[],
  feedbacks: Feedback[],
  transactions: RewardTransaction[]
): UserRewards {
  return {
    userId,
    totalPoints: calculateTotalPoints(transactions),
    lifetimePoints: calculateLifetimePoints(transactions),
    transactions,
  };
}

/**
 * Check if user can redeem points
 */
export function canRedeemPoints(userRewards: UserRewards, requiredPoints: number): boolean {
  return userRewards.totalPoints >= requiredPoints;
}

/**
 * Get points tier based on lifetime points
 */
export function getPointsTier(lifetimePoints: number): {
  tier: string;
  tierAr: string;
  color: string;
  icon: string;
} {
  if (lifetimePoints >= 1000) {
    return {
      tier: 'Platinum',
      tierAr: 'بلاتيني',
      color: 'text-purple-600',
      icon: '💎',
    };
  } else if (lifetimePoints >= 500) {
    return {
      tier: 'Gold',
      tierAr: 'ذهبي',
      color: 'text-yellow-600',
      icon: '🥇',
    };
  } else if (lifetimePoints >= 200) {
    return {
      tier: 'Silver',
      tierAr: 'فضي',
      color: 'text-gray-500',
      icon: '🥈',
    };
  } else if (lifetimePoints >= 50) {
    return {
      tier: 'Bronze',
      tierAr: 'برونزي',
      color: 'text-orange-600',
      icon: '🥉',
    };
  } else {
    return {
      tier: 'Member',
      tierAr: 'عضو',
      color: 'text-text-secondary',
      icon: '⭐',
    };
  }
}

/**
 * Get next tier progress
 */
export function getNextTierProgress(lifetimePoints: number): {
  currentTier: string;
  nextTier: string;
  pointsToNextTier: number;
  progress: number;
} {
  const tiers = [
    { name: 'Member', points: 0 },
    { name: 'Bronze', points: 50 },
    { name: 'Silver', points: 200 },
    { name: 'Gold', points: 500 },
    { name: 'Platinum', points: 1000 },
  ];

  let currentIndex = tiers.findIndex(t => lifetimePoints < t.points) - 1;
  if (currentIndex < 0) {
    currentIndex = lifetimePoints >= 1000 ? tiers.length - 1 : 0;
  }
  const currentTier = tiers[currentIndex];
  const nextTier = currentIndex + 1 < tiers.length ? tiers[currentIndex + 1] : null;

  if (!nextTier) {
    return {
      currentTier: currentTier.name,
      nextTier: 'Max',
      pointsToNextTier: 0,
      progress: 100,
    };
  }

  const pointsToNextTier = nextTier.points - lifetimePoints;
  const tierRange = nextTier.points - currentTier.points;
  const progress = ((lifetimePoints - currentTier.points) / tierRange) * 100;

  return {
    currentTier: currentTier.name,
    nextTier: nextTier.name,
    pointsToNextTier,
    progress: Math.min(100, Math.max(0, progress)),
  };
}
