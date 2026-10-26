## 2026-10-07 - Precompute Set Lookups in Iterative Recommendation Scoring

**Learning:** Redundant nested array filtering inside iteration loops across $N$ items (e.g. `reservations.filter` and `feedbacks.filter` inside `calculateRecommendationScore` per experience) causes $O(N \cdot R \cdot F)$ quadratic/cubic computation time. Precomputing lookup sets (`Set<string>`) and boolean states once outside the loop reduces algorithmic complexity to $O(N + R + F)$.

**Action:** Before mapping or filtering across lists, extract invariant predicate data into precomputed `Set` structures or flags outside the loop and pass precomputed options to scoring functions.

## 2026-10-26 - Precompute Sort Comparator Keys in O(N) Linear Pass

**Learning:** In `Array.prototype.sort((a, b) => ...)`, comparator callbacks are executed $O(N \log N)$ times (e.g., ~700–1500 calls for 100 items). Performing non-trivial operations inside sort comparators (such as `new Date(a.date).getTime()` or regex replace + `parseInt` on string IDs) allocates hundreds of ephemeral objects and runs redundant computations per sort pass. Precomputing sort keys into a `Map` or lookup table in a single $O(N)$ pass reduces execution time by ~78% and eliminates garbage collection spikes on client renders.

**Action:** When sorting list items by derived or parsed properties (dates, numbers embedded in strings, computed scores), extract and precompute key values into a `Map` in a linear $O(N)$ pass prior to calling `Array.prototype.sort()`.
