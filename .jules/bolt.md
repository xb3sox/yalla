## 2026-10-08 - React.memo for Repeated Card Components
**Learning:** List items such as `ExperienceCard` rendered repeatedly across multiple pages (Explore, Favorites, Recommendations) benefit significantly from `React.memo` to prevent re-rendering unchanged items during parent state updates (e.g. typing in search inputs or toggling sort orders).
**Action:** Always memoize list item components when parent state changes frequently.
