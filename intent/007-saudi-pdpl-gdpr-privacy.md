# Intent: Saudi PDPL & GDPR Privacy Compliance (Data Export, Data Correction, Account Deletion)

**Author**: Jules / Platform Engineering
**Date**: 2026-10-26
**Status**: accepted

---

## 1. Problem
To operate in Saudi Arabia and internationally, Yalla must comply with the Saudi Personal Data Protection Law (PDPL) and GDPR data subject rights regulations (FR-019 to FR-021).
Users must be empowered to download a machine-readable archive of all their personal data (profile, bookings, feedback, payments), request data corrections, and execute account deletion with proper anonymization of financial audit records.

## 2. Proposed Outcome
- Registered users can export their personal data archive via `GET /api/v1/user/export-data` as structured JSON without exposing PII of other users.
- Users can request account deletion via `POST /api/v1/user/delete-account` with password/OTP verification.
- Account anonymization updates `display_name` to 'Anonymized User', sets `phone = 'deleted_' || id`, nullifies personal attributes, deletes push subscriptions and notifications, while preserving financial transaction records (`payments`, `reservations`).
- An immutable audit trail entry is logged in `audit_events`.
- Frontend provides an accessible WCAG 2.2 AA compliant Arabic and English UI in `src/pages/ProfilePrivacy.tsx`.

## 3. Affected Users & Systems
- **Users**: Registered Yalla Participants, Hosts, Support Staff
- **Systems**: Express API (`backend/src/services/privacy.service.ts`, `backend/src/routes/privacy.routes.ts`), PostgreSQL Database, React Frontend (`src/pages/ProfilePrivacy.tsx`, `src/services/api.ts`)

## 4. Constraints
- Strict protection against PII leaks of co-attendees and hosts in export archive.
- Statutory 5-year retention of financial records (`payments`, `reservations`).
- Audit log immutability (strictly no deletes from `audit_events`).
- WCAG 2.2 AA compliance for frontend interface.

## 5. Open Questions
- None.
