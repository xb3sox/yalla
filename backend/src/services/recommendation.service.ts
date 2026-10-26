/**
 * Recommendation Engine Service
 * Multi-factor recommendation engine with seasonal & collaborative filtering
 */

export interface RecommendationReason {
  code: string;
  labelEn: string;
  labelAr: string;
}

export interface RecommendationItem {
  experienceId: string;
  title?: string;
  score: number;
  reasons: RecommendationReason[];
  [key: string]: any;
}

export interface UserRecommendationContext {
  id: string;
  preferredArea?: string;
  preferredCategories?: string[];
  interestTags?: string[];
  userTagSet?: Set<string>; // Precomputed Set for O(1) tag lookup outside iteration loops
  userVector?: number[]; // Feature vector for collaborative filtering
  recentlyViewedOrBookedIds?: Set<string>;
  pastBookedIds: Set<string>;
}

export interface CandidateExperience {
  id: string;
  title: string;
  title_ar?: string;
  area?: string;
  area_ar?: string;
  environment?: string; // 'outdoor', 'indoor', 'desert', 'workshop', etc.
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  category?: string;
  tags?: string[];
  itemVector?: number[]; // Feature vector for collaborative filtering
  averageRating?: number; // 1.0 to 5.0
  booked?: number;
  capacity?: number;
  created_at?: Date | string;
  [key: string]: any;
}

export interface RecommendationWeights {
  W_cat: number;
  W_tag: number;
  W_season: number;
  W_collab: number;
  W_rating: number;
  W_decay: number;
}

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  W_cat: 0.25,
  W_tag: 0.25,
  W_season: 0.20,
  W_collab: 0.15,
  W_rating: 0.15,
  W_decay: 0.10,
};

/**
 * Seasonal weight definitions by month & environment context
 * Saudi Arabia seasonal climate model:
 * - Winter (Nov-Feb): Outdoor desert/camping bonus
 * - Summer (May-Sep): Indoor AC bonus
 * - Moderate (Mar-Apr, Oct): Balanced
 */
export const SEASONAL_WEIGHTS: Record<string, { outdoor: number; indoor: number }> = {
  winter: { outdoor: 1.0, indoor: 0.5 },
  summer: { outdoor: 0.2, indoor: 1.0 },
  moderate: { outdoor: 0.8, indoor: 0.8 },
};

/**
 * Determine season from date or current date
 */
export function getSeason(dateStr?: string): 'winter' | 'summer' | 'moderate' {
  const date = dateStr ? new Date(dateStr) : new Date();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

  // Nov (10), Dec (11), Jan (0), Feb (1) -> winter
  if (month === 10 || month === 11 || month === 0 || month === 1) {
    return 'winter';
  }
  // May (4), Jun (5), Jul (6), Aug (7), Sep (8) -> summer
  if (month >= 4 && month <= 8) {
    return 'summer';
  }
  return 'moderate';
}

/**
 * Determine if time is evening (18:00 or later)
 */
export function isEvening(timeStr?: string): boolean {
  if (!timeStr) return false;
  const hour = parseInt(timeStr.split(':')[0], 10);
  return !isNaN(hour) && hour >= 18;
}

/**
 * Calculate multi-factor recommendation score S(e, u) for an experience and user
 */
export function calculateScore(
  exp: CandidateExperience,
  userCtx: UserRecommendationContext,
  weights: RecommendationWeights = DEFAULT_WEIGHTS
): { score: number; reasons: RecommendationReason[] } {
  // Exclude already booked or attended experiences: score = -Infinity
  if (userCtx.pastBookedIds.has(exp.id)) {
    return { score: -Infinity, reasons: [] };
  }

  const reasons: RecommendationReason[] = [];

  // 1. Category Overlap Score C [0, 1]
  let C = 0;
  if (userCtx.preferredArea && exp.area && exp.area.toLowerCase().includes(userCtx.preferredArea.toLowerCase())) {
    C += 0.5;
  }
  if (userCtx.preferredCategories && exp.category) {
    if (userCtx.preferredCategories.some(c => c.toLowerCase() === exp.category?.toLowerCase())) {
      C += 0.5;
    }
  }
  // Fallback category check if preferredArea matched partially or default
  if (!userCtx.preferredArea && !userCtx.preferredCategories) {
    C = 0.5; // Neutral score if no preferences specified
  }
  C = Math.min(1.0, Math.max(0.0, C));

  if (C >= 0.5) {
    reasons.push({
      code: 'CATEGORY_MATCH',
      labelEn: 'Matches your area and style',
      labelAr: 'يتوافق مع منطقتك وأسلوبك المفضل',
    });
  }

  // 2. Precomputed Tag Set-Intersection Score T [0, 1]
  let T = 0;
  const expTags = exp.tags || [];
  const userTagSet = userCtx.userTagSet || (userCtx.interestTags && userCtx.interestTags.length > 0
    ? new Set(userCtx.interestTags.map(t => t.toLowerCase()))
    : undefined);

  if (userTagSet && userTagSet.size > 0 && expTags.length > 0) {
    const matchCount = expTags.filter(t => userTagSet.has(t.toLowerCase())).length;
    T = matchCount / Math.max(1, userTagSet.size);
  } else if (expTags.length > 0) {
    T = 0.3; // Default baseline if user has no explicit tags
  }
  T = Math.min(1.0, Math.max(0.0, T));

  if (T > 0) {
    reasons.push({
      code: 'TAG_MATCH',
      labelEn: 'Matches your interest tags',
      labelAr: 'يتطابق مع اهتماماتك',
    });
  }

  // 3. Seasonal/Time Contextual Fit S [0, 1]
  const season = getSeason(exp.date);
  const evening = isEvening(exp.time);
  const env = (exp.environment || '').toLowerCase();

  let S = 0.5; // Baseline
  const isOutdoor = env.includes('outdoor') || env.includes('desert') || env.includes('camping');
  const isIndoor = env.includes('indoor') || env.includes('workshop') || env.includes('lounge');

  if (season === 'winter') {
    if (isOutdoor) {
      S = evening ? 1.0 : 0.9;
      reasons.push({
        code: 'SEASONAL_FIT',
        labelEn: evening ? 'Perfect for Winter Evenings' : 'Ideal for Winter Outdoors',
        labelAr: evening ? 'مثالي لأمسيات الشتاء' : 'مثالي للمكشات الشتوية',
      });
    } else {
      S = 0.6;
    }
  } else if (season === 'summer') {
    if (isIndoor) {
      S = 0.95;
      reasons.push({
        code: 'SEASONAL_FIT',
        labelEn: 'Cool Indoor Experience for Summer',
        labelAr: 'تجربة داخلية مكيفة لموسم الصيف',
      });
    } else if (isOutdoor && evening) {
      S = 0.7;
      reasons.push({
        code: 'SEASONAL_FIT',
        labelEn: 'Pleasant Summer Evening Activity',
        labelAr: 'نشاط مسائي لطيف في الصيف',
      });
    } else {
      S = 0.2;
    }
  } else {
    // Moderate season
    S = 0.8;
    reasons.push({
      code: 'SEASONAL_FIT',
      labelEn: 'Great for current season',
      labelAr: 'مناسب للموسم الحالي',
    });
  }
  S = Math.min(1.0, Math.max(0.0, S));

  // 4. Collaborative Filtering Dot Product K [0, 1]
  let K = 0.5;
  if (userCtx.userVector && exp.itemVector && userCtx.userVector.length === exp.itemVector.length) {
    let dot = 0;
    let normU = 0;
    let normE = 0;
    for (let i = 0; i < userCtx.userVector.length; i++) {
      dot += userCtx.userVector[i] * exp.itemVector[i];
      normU += userCtx.userVector[i] ** 2;
      normE += exp.itemVector[i] ** 2;
    }
    const denom = Math.sqrt(normU) * Math.sqrt(normE);
    K = denom > 0 ? dot / denom : 0.5;
  }
  K = Math.min(1.0, Math.max(0.0, K));

  if (K >= 0.7) {
    reasons.push({
      code: 'SIMILAR_USERS',
      labelEn: 'Popular with similar attendees',
      labelAr: 'شائع بين المشاركين المماثلين',
    });
  }

  // 5. Normalized Rating R [0, 1]
  const rating = exp.averageRating !== undefined ? exp.averageRating : 4.5;
  const R = Math.min(1.0, Math.max(0.0, rating / 5.0));

  if (rating >= 4.5) {
    const formattedRating = rating.toFixed(1);
    reasons.push({
      code: 'HIGHLY_RATED',
      labelEn: `Rated ${formattedRating}★ by attendees`,
      labelAr: `تقييم ${formattedRating}★ من المشاركين`,
    });
  }

  // 6. Recency Decay D [0, 1]
  let D = 0;
  if (userCtx.recentlyViewedOrBookedIds && userCtx.recentlyViewedOrBookedIds.has(exp.id)) {
    D = 0.8; // High decay penalty if recently viewed/interacted
  }

  // Scoring Formula:
  // S(e, u) = (W_cat * C) + (W_tag * T) + (W_season * S) + (W_collab * K) + (W_rating * R) - (W_decay * D)
  const score =
    weights.W_cat * C +
    weights.W_tag * T +
    weights.W_season * S +
    weights.W_collab * K +
    weights.W_rating * R -
    weights.W_decay * D;

  // De-duplicate reasons by code
  const uniqueReasonsMap = new Map<string, RecommendationReason>();
  for (const r of reasons) {
    if (!uniqueReasonsMap.has(r.code)) {
      uniqueReasonsMap.set(r.code, r);
    }
  }

  return {
    score: parseFloat(score.toFixed(4)),
    reasons: Array.from(uniqueReasonsMap.values()),
  };
}

/**
 * Score a list of experiences in linear O(N) time using precomputed lookup Sets
 */
export function rankRecommendations(
  experiences: CandidateExperience[],
  userCtx: UserRecommendationContext,
  limit: number = 20,
  weights: RecommendationWeights = DEFAULT_WEIGHTS
): RecommendationItem[] {
  // Ensure pastBookedIds and userTagSet are precomputed Sets for fast O(1) checks outside the iteration loop
  const pastBookedSet = userCtx.pastBookedIds instanceof Set ? userCtx.pastBookedIds : new Set<string>(userCtx.pastBookedIds);
  const userTagSet = userCtx.userTagSet || (userCtx.interestTags && userCtx.interestTags.length > 0
    ? new Set<string>(userCtx.interestTags.map(t => t.toLowerCase()))
    : new Set<string>());

  const context: UserRecommendationContext = {
    ...userCtx,
    pastBookedIds: pastBookedSet,
    userTagSet,
  };

  const scored: RecommendationItem[] = [];

  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    const { score, reasons } = calculateScore(exp, context, weights);

    if (score !== -Infinity) {
      scored.push({
        ...exp,
        experienceId: exp.id,
        score,
        reasons,
      });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
