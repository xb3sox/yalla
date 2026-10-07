## 2026-10-07 - Icon-only floating action buttons in bilingual (RTL/LTR) apps
**Learning:** Icon-only floating buttons (like BackToTop) require localized ARIA labels and title tooltips matching the active language context (`ar` / `en`) and focus visible outline indicators for keyboard accessibility.
**Action:** When adding or updating icon-only floating action buttons, always integrate language state from application context and include `focus-visible:ring-2` focus indicators.
