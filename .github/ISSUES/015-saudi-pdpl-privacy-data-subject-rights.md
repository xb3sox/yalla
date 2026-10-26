# [Jules] Platform: Saudi PDPL & GDPR Privacy Compliance (Data Export, Data Correction, Account Deletion)

**Labels**: `backlog`, `platform`, `privacy`, `pdpl`, `gdpr`, `security`, `backend`, `frontend`, `jules`
**Milestone**: Platform Engineering & Operational Excellence

---

## Problem & Context
To operate in Saudi Arabia and internationally, Yalla must comply with the Saudi Personal Data Protection Law (PDPL) and GDPR data subject rights regulations (FR-019 to FR-021).

Users must be empowered to download a machine-readable archive of all their personal data (profile, bookings, feedback, payments), request data corrections, and execute account deletion with proper anonymization of financial audit records.

---

## User Story
**As a** registered Yalla user,
**I want** to export my personal data archive, correct inaccurate profile information, and request account deletion directly from my account settings,
**So that** my privacy rights are respected and compliant with Saudi PDPL regulations.

---

## Technical Architecture & Scope

### 1. Data Export Engine (`backend/src/services/privacy.service.ts`)
- `exportUserData(userId)`: Aggregates records across `users`, `reservations`, `payments`, `feedback`, `rewards_ledger`, `audit_events`, and `push_subscriptions`.
- Formats output as JSON or downloadable ZIP archive containing structured JSON and CSV files.
- Endpoint: `GET /api/v1/user/export-data`.

### 2. Account Deletion & Anonymization Engine (`POST /api/v1/user/delete-account`)
- Soft-delete / Anonymization Strategy adhering to Yalla's PostgreSQL schema:
  - Note: The `users` table schema defines `display_name VARCHAR(100)` and `phone VARCHAR(20) UNIQUE NOT NULL` (there is no `email` or `name` column).
  - For Right to Be Forgotten (RTBF) / erasure:
    - Update `display_name = 'Anonymized User'`.
    - Set `phone = 'deleted_' || id` (preserving `UNIQUE NOT NULL` constraint on `phone` without collisions).
    - Nullify sensitive personal preferences: `accessibility_needs = NULL`, `preferred_area = NULL`, `marketing_consent = FALSE`, `is_active = FALSE`.
    - Clear credentials: reset `password_hash = 'DELETED'`, invalidate refresh tokens, and clear auth cookies.
  - Delete user `push_subscriptions` and associated in-app notifications.
  - Preserve transaction records in `payments` and `reservations` linked to the anonymized user ID to satisfy statutory 5-year financial record retention laws.
  - Write immutable audit trail entry to `audit_events` (not `audit_logs`) recording the account erasure execution.

### 3. Frontend Account Privacy Management (`src/pages/ProfilePrivacy.tsx`)
- UI controls for:
  - "Download My Data" button (triggers streaming JSON download).
  - "Request Account Deletion" modal with two-factor confirmation (password / OTP re-entry).

---

## Acceptance Criteria
- [ ] `GET /api/v1/user/export-data` generates complete, machine-readable JSON object containing user's profile, booking history, feedback, and points ledger.
- [ ] `POST /api/v1/user/delete-account` requires password/OTP confirmation.
- [ ] Account anonymization conforms to `users` schema: sets `display_name = 'Anonymized User'`, sets `phone = 'deleted_' || id`, nullifies personal attributes, and deletes push subscriptions.
- [ ] Deleted user cannot log in or authenticate with previous phone or credentials.
- [ ] Account deletion event logged in `audit_events` with actor ID, timestamp, and IP address.
- [ ] UI provides accessible Arabic and English privacy settings interface complying with WCAG 2.2 AA standards.
- [ ] Automated tests verify data export schema and account anonymization logic.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/services/privacy.service.test.ts` testing anonymization updates on `users` table (`display_name`, `phone`), session revocation, and data export bundling.
- [ ] Add route tests in `backend/tests/unit/routes/privacy.routes.test.ts`.
- [ ] Verify test suite passes: `npm run typecheck`, `npm test -- tests/unit`, and `node evals/check.js`.

---

## SDLC & Security Guardrails
- **Data Protection & Schema Integrity**: Never expose PII of other users (e.g. co-attendees or hosts) when generating a user's personal data export archive.
- **Audit Immutability**: All RTBF and privacy operations must append to `audit_events` (strictly no deletes from `audit_events`).
