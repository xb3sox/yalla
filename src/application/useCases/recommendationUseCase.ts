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

/**
 * Calculate recommendation score for an experience
 */
export function calculateRecommendationScore(
  experience: Experience,
  user: UserProfile,
  reservations: Reservation[],
  feedbacks: Feedback[],
  favorites: string[]
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
  const attendedReservations = reservations.filter(r => 
    r.state === 'attended' || r.state === 'completed'
  );
  
  const positiveFeedbacks = feedbacks.filter(f => 
    attendedReservations.some(r => r.id === f.reservationId) &&
    f.worthTime >= 4
  );

  if (positiveFeedbacks.length > 0) {
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
  const hasBooked = reservations.some(r => r.planId === experience.id);
  if (!hasBooked) {
    score += 5;
  }

  // 7. Not in favorites (bonus for discovery)
  if (!favorites.includes(experience.id)) {
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
 */
export function getRecommendedExperiences(
  experiences: Experience[],
  user: UserProfile,
  reservations: Reservation[],
  feedbacks: Feedback[],
  favorites: string[],
  limit: number = 3
): RecommendationScore[] {
  const scores = experiences
    .filter(exp => exp.planState === 'published')
    .map(exp => calculateRecommendationScore(exp, user, reservations, feedbacks, favorites))
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
