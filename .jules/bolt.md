# Bolt — Performance Notes

## 2026-10-29 - Avoid `new Date()` Instantiation and Uncached `localeCompare` Options in Sort Comparators

**Learning:** Instantiating `new Date(dateStr)` or passing options objects to `String.prototype.localeCompare` inside `.sort((a, b) => ...)` callbacks causes severe $O(N \log N)$ object creation and GC overhead. For standard ISO 8601 date strings (`YYYY-MM-DD`), direct string comparison (`a.date < b.date ? -1 : 1`) preserves chronological sorting with zero object allocations.

**Action:** Compare ISO date strings directly in array sort comparators instead of parsing `Date` instances on each comparison.

## 2026-10-07 - Precompute Set Lookups in Iterative Recommendation Scoring

**Learning:** Redundant nested array filtering inside iteration loops across $N$ items (e.g. `reservations.filter` and `feedbacks.filter` inside `calculateRecommendationScore` per experience) causes $O(N \cdot R \cdot F)$ quadratic/cubic computation time. Precomputing lookup sets (`Set<string>`) and boolean states once outside the loop reduces algorithmic complexity to $O(N + R + F)$.

**Action:** Before mapping or filtering across lists, extract invariant predicate data into precomputed `Set` structures or flags outside the loop and pass precomputed options to scoring functions.
