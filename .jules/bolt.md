# Bolt — Performance Notes

## 2026-10-07 - Precompute Set Lookups in Iterative Recommendation Scoring

**Learning:** Redundant nested array filtering inside iteration loops across $N$ items (e.g. `reservations.filter` and `feedbacks.filter` inside `calculateRecommendationScore` per experience) causes $O(N \cdot R \cdot F)$ quadratic/cubic computation time. Precomputing lookup sets (`Set<string>`) and boolean states once outside the loop reduces algorithmic complexity to $O(N + R + F)$.

**Action:** Before mapping or filtering across lists, extract invariant predicate data into precomputed `Set` structures or flags outside the loop and pass precomputed options to scoring functions.

## 2026-10-30 - Concurrent API Fetching & Atomic State Batching on Initial Load

**Learning:** Sequential `await` calls for independent endpoint fetches (e.g. reservations, notifications, unread counts, favorites) compound network roundtrip latencies linearly ($\sum T_i$). Executing requests concurrently via `Promise.all` reduces initial loading time to $\max(T_i)$ (~75% reduction) and allows atomic state updates in a single render cycle.

**Action:** Identify independent API calls in lifecycle data-loading handlers and combine them into `Promise.all` with localized `.catch()` fallbacks for non-critical resources.
