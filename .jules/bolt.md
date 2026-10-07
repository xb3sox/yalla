## 2026-10-07 - Precompute Set Lookups in Iterative Recommendation Scoring

**Learning:** Redundant nested array filtering inside iteration loops across $N$ items (e.g. `reservations.filter` and `feedbacks.filter` inside `calculateRecommendationScore` per experience) causes $O(N \cdot R \cdot F)$ quadratic/cubic computation time. Precomputing lookup sets (`Set<string>`) and boolean states once outside the loop reduces algorithmic complexity to $O(N + R + F)$.

**Action:** Before mapping or filtering across lists, extract invariant predicate data into precomputed `Set` structures or flags outside the loop and pass precomputed options to scoring functions.
