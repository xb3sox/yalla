# [Jules] Phase 4: Advanced Recommendation Engine with Seasonal & Collaborative Filtering

**Labels**: `backlog`, `phase-4`, `recommendations`, `machine-learning`, `backend`
**Milestone**: Phase 4: Expansion & Scale (Q2 2027)

---

## Problem & Context
The current recommendation engine uses a linear $O(N)$ Set-intersection algorithm based on static user interest tags. While fast, it does not factor in seasonal weather patterns in Saudi Arabia (e.g. prioritizing outdoor dune camping in winter/evenings vs. air-conditioned indoor workshops during summer afternoons), collaborative filtering across similar user cohorts, or recency decay.

Enhancing the recommendation model with multi-factor vector scoring and seasonal contextual weighting will increase booking conversion and engagement.

---

## User Story
**As a** returning user,
**I want** personalized experience recommendations that adapt to the time of year, weather context, time of day, and choices of similar attendees,
**So that** I discover relevant local activities suited to my current mood and season.

---

## Technical Architecture & Scope

### 1. Scoring Formula Specification (`backend/src/services/recommendation.service.ts`)
Score $S(e, u)$ for experience $e$ and user $u$:
$$S(e, u) = (W_{cat} \cdot C) + (W_{tag} \cdot T) + (W_{season} \cdot S) + (W_{collab} \cdot K) + (W_{rating} \cdot R) - (W_{decay} \cdot D)$$

Where:
- $C$: Category preference overlap score $[0, 1]$.
- $T$: Precomputed tag Set-intersection score $[0, 1]$.
- $S$: Seasonal/time contextual fit $[0, 1]$ (e.g. Winter outdoor bonus, weekend evening bonus).
- $K$: Collaborative filtering matrix dot product with similar user vectors $[0, 1]$.
- $R$: Normalized experience average rating $[0, 1]$.
- $D$: Recency decay factor (penalty for experiences the user viewed or booked recently).

### 2. Precomputed Lookup Caches
- Maintain precomputed $O(1)$ Set lookups for user booking history and tag vectors in Redis (`user:<id>:tags`, `exp:tags`).
- Cache seasonal metadata dictionary (`SEASONAL_WEIGHTS`) refreshed weekly.

### 3. API Response Payload (`GET /api/v1/recommendations`)
Return structured match score and human-readable explanation tokens in both Arabic and English:
```json
{
  "recommendations": [
    {
      "experienceId": "exp_desert_stargazing",
      "title": "Winter Desert Stargazing & Coffee",
      "score": 0.94,
      "reasons": [
        { "code": "SEASONAL_FIT", "labelEn": "Perfect for Winter Evenings", "labelAr": "مثالي لأمسيات الشتاء" },
        { "code": "HIGHLY_RATED", "labelEn": "Rated 4.9★ by attendees", "labelAr": "تقييم 4.9★ من المشاركين" },
        { "code": "SIMILAR_USERS", "labelEn": "Popular with coffee enthusiasts", "labelAr": "شائع بين محبي القهوة" }
      ]
    }
  ]
}
```

---

## Acceptance Criteria
- [ ] Recommendation scoring algorithm incorporates category match, tag overlap, seasonal weight, collaborative weight, and recency penalty.
- [ ] Scoring computational complexity remains $O(N)$ with zero nested loop database calls (precomputed Redis / memory lookup Sets).
- [ ] API output includes bilingual `reasons` tokens matching client explanation parity.
- [ ] Experiences already booked or attended by user are filtered out ($S(e, u) = -\infty$).
- [ ] Benchmark test confirms execution time remains <15ms for 500 candidate experiences.
- [ ] Unit tests verify vector math, seasonal adjustments, and bilingual reason tokens.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/controllers/recommendation.controller.test.ts`.
- [ ] Add performance benchmark test verifying sub-15ms execution time for 500 catalog items.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Performance Guardrail**: Never perform SQL `SELECT *` inside recommendation scoring loops; fetch all required candidate attributes in a single initial SQL batch query or read from Redis cache.
