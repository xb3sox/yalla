# [Jules] Platform: Saudi PDPL & GDPR Privacy Compliance (Data Export, Data Correction, Account Deletion)

**Labels**: `backlog`, `platform`, `privacy`, `pdpl`, `gdpr`, `security`, `backend`, `frontend`
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
- `exportUserData(userId)`: Aggregates records across `users`, `reservations`, `payments`, `feedback`, `rewards_ledger`, `audit_logs`, and `push_subscriptions`.
- Formats output as JSON or downloadable ZIP archive containing structured JSON and CSV files.
- Endpoint: `GET /api/v1/user/export-data`.

### 2. Account Deletion & Anonymization Engine (`POST /api/v1/user/delete-account`)
- Soft-delete / Anonymization Strategy:
  - Scrub PII fields in `users` table: set `name = 'Anonymized User'`, `email = 'deleted_<uuid>@anonymized.yalla'`, `phone = NULL`.
  - Delete `push_subscriptions`, clear refresh tokens and auth cookies.
  - Preserve transaction IDs in `payments` and `reservations` with anonymized user references to satisfy financial record retention laws (5 years).
  - Write immutable entry to `audit_logs` recording account deletion request.

### 3. Frontend Account Privacy Management (`src/pages/ProfilePrivacy.tsx`)
- UI controls for:
  - "Download My Data" button (triggers streaming JSON download).
  - "Request Account Deletion" modal with two-factor confirmation (password / OTP re-entry).

---

## Acceptance Criteria
- [ ] `GET /api/v1/user/export-data` generates complete, machine-readable JSON object containing user's profile, booking history, feedback, and points ledger.
- [ ] `DELETE /api/v1/user/account` requires password/OTP confirmation and anonymizes PII fields while retaining required financial transaction records.
- [ ] Deleted user cannot log in or authenticate with previous credentials.
- [ ] Account deletion event logged in `audit_logs` with timestamp and IP address.
- [ ] UI provides accessible Arabic and English privacy settings interface complying with WCAG 2.2 AA standards.
- [ ] Automated tests verify data export schema and account anonymization logic.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/services/privacy.service.test.ts`.
- [ ] Add route tests in `backend/tests/unit/routes/privacy.routes.test.ts`.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Data Protection**: Never expose PII of other users (e.g. co-attendees or hosts) when generating a user's personal data export archive.
