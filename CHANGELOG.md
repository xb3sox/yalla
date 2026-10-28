# Changelog

All notable changes to the Yalla platform are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Security
- **Refresh tokens are now revocable and single-use.** New `refresh_tokens` table
  (migration `006`) stores only SHA-256 hashes with expiry, revocation, and
  replacement links. Rotation happens on every `/auth/refresh`; replaying a
  rotated token outside a 10-second race window revokes every session for that
  user. Logout and account deletion revoke server-side.
- Access tokens shortened from 7 days to 15 minutes (unrevocable, so the refresh
  token is the true session boundary).
- Stripe webhooks verify signatures against the raw request body; missing or
  unconfigured secrets fail closed without leaking verification internals.
- Database TLS certificate verification is enabled by default
  (`DB_SSL_REJECT_UNAUTHORIZED`).
- Input sanitization no longer mangles credentials (`password`, `refreshToken`,
  and similar fields pass through untouched).
- Rate limiting resolves the real client IP behind a proxy (`TRUST_PROXY`);
  Stripe webhooks are excluded from the API limiter.

### Fixed
- Guest check-in no longer reports success when the API call fails.
- `limit`/`offset` query parameters are validated and clamped, preventing
  negative SQL limits and unbounded page sizes.
- Service worker serves navigations network-first, so deploys are picked up
  immediately instead of one visit later.
- Frontend deduplicates concurrent token refreshes to avoid tripping reuse
  detection.

---

## [2.0.0] - 2026-10-19

### Added
- **Anthropic AI-Native SDLC Architecture**:
  - Stage 1 Plan: `intent/` artifact home with `intent/TEMPLATE.md` and `intent/001-repo-organization-sdlc.md`.
  - Stage 2 Design: `specs/` design specification home with `specs/TEMPLATE.md` and `specs/001-sdlc-architecture.md`.
  - Stage 3 Build: `plans/` implementation plan home with `plans/TEMPLATE.md` and `plans/001-sdlc-execution-plan.md`.
  - Stage 4 Test: Continuous evals suite (`evals/evals.json`, `evals/check.js`, `.github/workflows/agent-evals.yml`).
  - Stage 5 Deploy: Guardrailed GitHub Actions auto-merge pipeline (`.github/workflows/jules-automerge.yml`).
  - Stage 6 Maintain: Closed-loop breach monitor (`scripts/monitor-breach.js`) that auto-generates intent on drift.
- **Essential Technical Reference Docs**:
  - `docs/ARCHITECTURE.md`: Complete Clean Architecture, DDD layers, and state machine specification.
  - `docs/API.md`: Detailed catalog of 53 endpoints across all 13 modules.
  - `docs/DATABASE.md`: PostgreSQL schema, 12 tables, relationships, and migration guide.
  - `.jules/critic.md`: Self-critique checklist for Jules prior to submitting pull requests.
  - `Dockerfile`: Multi-stage frontend container for Docker Compose.
  - `CLAUDE.md`: AI engineer context guide synchronized with `AGENTS.md`.

### Changed
- Streamlined `README.md`, `CONTRIBUTING.md`, and `DEPLOYMENT.md` to eliminate stale path references (`cd frontend`) and obsolete session claims.
- Updated `docker-compose.yml` to build root frontend container and remove missing `init.sql` volume mount.
- Aligned `AGENTS.md` and `.jules/workflow.md` with the 6-stage AI SDLC pipeline.
- Synchronized `ROADMAP.md` with complete MVP implementation.

### Removed
- Removed 32 obsolete session and completion reports in `docs/archive/` (~400KB of redundant markdown).
- Removed stale `pnpm-lock.yaml`.

---

## [1.0.0] - 2026-01-15

### Added
- Core platform: 45 functional requirements (FR-001 through FR-045).
- Frontend application with React 18, Vite, Tailwind CSS, Lucide icons, and bilingual Arabic (RTL) / English support.
- Backend API with Express, TypeScript, and PostgreSQL 15.
- Clean Architecture implementation with Domain State Machine.
- 53 REST API endpoints covering Auth, Experiences, Reservations, Payments, Staff, Safety, Notifications, and Feedback.
- Comprehensive test suite with 664 frontend tests and 62 backend unit tests.
