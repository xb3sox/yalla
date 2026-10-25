# [Jules] Platform: Comprehensive End-to-End E2E Playwright Test Suite

**Labels**: `backlog`, `platform`, `testing`, `playwright`, `e2e`, `ci`
**Milestone**: Platform Engineering & Quality Assurance

---

## Problem & Context
Yalla currently maintains 664 frontend unit/component tests (Vitest) and 62 backend unit/integration tests (Jest). While unit tests cover individual modules, end-to-end user journeys (e.g., catalog discovery -> experience detail -> booking checkout with Stripe mock -> 24h attendance reconfirmation -> arrival mode PIN display) are not validated automatically across real browser viewports (Desktop Chromium, Mobile Safari, Android Chrome).

An automated Playwright E2E suite running in CI will detect visual, routing, session, or API integration regressions before code reaches production.

---

## User Story
**As a** core contributor or release engineer,
**I want** automated Playwright E2E tests running on every pull request,
**So that** critical end-to-end user journeys across mobile and desktop viewports are guaranteed to work smoothly before merging.

---

## Technical Architecture & Scope

### 1. Framework Setup (`tests/e2e/`)
- Install `@playwright/test`.
- Config file `playwright.config.ts`:
  - Projects: `Desktop Chrome` (1280x720), `Mobile Safari` (iPhone 14 viewport 390x844), `Mobile Chrome` (Pixel 7 viewport 412x915).
  - WebServer runner: Start frontend (`npm run dev`) and backend (`npm --prefix backend run dev`) concurrently or against Docker Compose test container.
  - Test database seed reset before test run (`npm --prefix backend run seed`).

### 2. Core Journey E2E Test Specs
- **`tests/e2e/01-discovery-and-filters.spec.ts`**:
  - Filter experiences by category, city (Riyadh/Jeddah), and search query.
  - Toggle language between English and Arabic RTL; verify layout direction (`dir="rtl"`) and translation strings.
- **`tests/e2e/02-booking-checkout-flow.spec.ts`**:
  - Log in as test attendee.
  - Select session time and seat count.
  - Complete checkout flow with mock Stripe payment intent. Verify redirect to reservation confirmation screen.
- **`tests/e2e/03-arrival-mode-pin-checkin.spec.ts`**:
  - Reconfirm 24-hour attendance.
  - Access Arrival Mode (`/arrival/:id`), verify venue details unlock and dynamic 4-digit PIN displays.
  - Log in as Host on second browser context, submit PIN, and verify real-time check-in confirmation.

### 3. CI Pipeline Integration (`.github/workflows/ci-cd.yml`)
- Add `e2e` job to GitHub Actions workflow.
- Upload Playwright HTML report and failure screenshots/traces as build artifacts (`retention-days: 7`).

---

## Acceptance Criteria
- [ ] Playwright test harness configured with Desktop and Mobile device profiles.
- [ ] End-to-end specs cover discovery, RTL language switching, checkout, 24h reconfirmation, and arrival mode check-in.
- [ ] Tests run headlessly in CI and pass cleanly with 0 flakiness.
- [ ] Failure traces and video recordings captured automatically on assertion failure.
- [ ] Documentation added to `README.md` and `AGENTS.md` explaining local E2E commands (`npm run test:e2e`).

---

## Testing Requirements
- [ ] Run `npx playwright test` locally and verify all 3 journey specs pass.
- [ ] Verify test suite passes cleanly alongside unit tests (`npx vitest run` and `npm test -- tests/unit`).

---

## SDLC & Security Guardrails
- **Isolation**: E2E tests must execute against a dedicated test database (`yalla_e2e_test`) and never interact with production Stripe API keys or live user data.
