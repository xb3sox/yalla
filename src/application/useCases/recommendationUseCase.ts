/**
 * Recommendation Engine
 * 
 * Provides intelligent experience recommendations based on:
 * - User preferences
 * - Booking history
 * - Favorites
 * - Feedback ratings
 */

import type { Experience, Reservation, Feedback, UserProfile } from '../../domain/entities';

export interface RecommendationScore {
  experienceId: string;
  score: number;
  reasons: string[];
}

export interface PrecomputedRecommendationData {
  bookedPlanIds?: Set<string>;
  favoriteIdsSet?: Set<string>;
  hasPositiveFeedback?: boolean;
}

/**
 * Calculate recommendation score for an experience
 */
export function calculateRecommendationScore(
  experience: Experience,
  user: UserProfile,
  reservations: Reservation[],
  feedbacks: Feedback[],
  favorites: string[],
  precomputed?: PrecomputedRecommendationData
): RecommendationScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. Area preference match (30 points)
  if (user.preferences.preferredArea) {
    const userArea = user.preferences.preferredArea.toLowerCase();
    const expArea = experience.area.toLowerCase();
    if (expArea.includes(userArea) || userArea.includes(expArea)) {
      score += 30;
      reasons.push('Matches your preferred area');
    }
  }

  // 2. Language preference match (20 points)
  if (user.preferences.experienceLanguage) {
    if (experience.language === user.preferences.experienceLanguage) {
      score += 20;
      reasons.push('In your preferred language');
    }
  }

  // 3. Budget range match (20 points)
  if (user.preferences.budgetRange) {
    const { min, max } = user.preferences.budgetRange;
    if (experience.price >= min && experience.price <= max) {
      score += 20;
      reasons.push('Within your budget range');
    }
  }

  // 4. Positive feedback for similar experiences (15 points)
  // Optimization: use precomputed boolean or evaluate once using Set lookup
  const hasPositiveFeedback = precomputed?.hasPositiveFeedback ?? (() => {
    const attendedIds = new Set(
      reservations
        .filter(r => r.state === 'attended' || r.state === 'completed')
        .map(r => r.id)
    );
    return feedbacks.some(
      f => attendedIds.has(f.reservationId) && f.worthTime >= 4
    );
  })();

  if (hasPositiveFeedback) {
    score += 15;
    reasons.push('Based on your positive experiences');
  }

  // 5. Availability (10 points)
  const spotsLeft = experience.capacity - experience.booked;
  if (spotsLeft > 0) {
    score += 10;
    if (spotsLeft <= 3) {
      reasons.push('Limited spots available');
    } else {
      reasons.push('Good availability');
    }
  }

  // 6. Not already booked (5 points)
  // Optimization: use precomputed Set for O(1) lookup
  const hasBooked = precomputed?.bookedPlanIds
    ? precomputed.bookedPlanIds.has(experience.id)
    : reservations.some(r => r.planId === experience.id);

  if (!hasBooked) {
    score += 5;
  }

  // 7. Not in favorites (bonus for discovery)
  // Optimization: use precomputed Set for O(1) lookup
  const isFavorite = precomputed?.favoriteIdsSet
    ? precomputed.favoriteIdsSet.has(experience.id)
    : favorites.includes(experience.id);

  if (!isFavorite) {
    score += 5;
    reasons.push('New experience to discover');
  }

  return {
    experienceId: experience.id,
    score,
    reasons,
  };
}

/**
 * Get top recommended experiences
 * Optimized to precompute lookup sets and feedback status in O(R + F) once
 * instead of redundant O(R * F) recalculations for every experience (N).
 */
export function getRecommendedExperiences(
  experiences: Experience[],
  user: UserProfile,
  reservations: Reservation[],
  feedbacks: Feedback[],
  favorites: string[],
  limit: number = 3
): RecommendationScore[] {
  // Precompute lookup structures outside the iteration loop for O(1) checks
  const bookedPlanIds = new Set(reservations.map(r => r.planId));
  const favoriteIdsSet = new Set(favorites);

  const attendedIds = new Set(
    reservations
      .filter(r => r.state === 'attended' || r.state === 'completed')
      .map(r => r.id)
  );
  const hasPositiveFeedback = feedbacks.some(
    f => attendedIds.has(f.reservationId) && f.worthTime >= 4
  );

  const precomputed: PrecomputedRecommendationData = {
    bookedPlanIds,
    favoriteIdsSet,
    hasPositiveFeedback,
  };

  const scores = experiences
    .filter(exp => exp.planState === 'published')
    .map(exp => calculateRecommendationScore(exp, user, reservations, feedbacks, favorites, precomputed))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scores;
}

/**
 * Get recommendation reasons for display
 */
export function getRecommendationReasons(
  score: RecommendationScore,
  lang: 'en' | 'ar'
): string[] {
  if (lang === 'ar') {
    return score.reasons.map(reason => {
      const translations: Record<string, string> = {
        'Matches your preferred area': 'يتطابق مع منطقتك المفضلة',
        'In your preferred language': 'بلغتك المفضلة',
        'Within your budget range': 'ضمن نطاق ميزانيتك',
        'Based on your positive experiences': 'بناءً على تجاربك الإيجابية',
        'Limited spots available': 'أماكن محدودة متاحة',
        'Good availability': 'توفر جيد',
        'New experience to discover': 'تجربة جديدة للاكتشاف',
      };
      return translations[reason] || reason;
    });
  }
  return score.reasons;
}
