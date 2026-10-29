# Spec: Saudi PDPL & GDPR Privacy Compliance

**Intent Reference**: `intent/007-saudi-pdpl-gdpr-privacy.md`
**Author**: Jules / Platform Engineering
**Date**: 2026-10-26
**Status**: approved

---

## 1. Executive Summary
This specification defines the privacy engine, endpoints, schema migrations, and frontend UI required for Yalla's compliance with Saudi Personal Data Protection Law (PDPL) and GDPR data subject rights (FR-019 to FR-021).

## 2. Requirements & Domain Logic
- **FR-019 (Data Export)**: `GET /api/v1/user/export-data` aggregates `users`, `reservations`, `payments`, `feedbacks`, `rewards_ledger`, `audit_events`, and `push_subscriptions` for the authenticated user without disclosing PII of other participants or hosts.
- **FR-020 (Account Erasure / RTBF)**: `POST /api/v1/user/delete-account` requires password/confirmation. Anonymizes user record (`display_name = 'Anonymized User'`, `phone = 'deleted_' || id`, `accessibility_needs = NULL`, `preferred_area = NULL`, `marketing_consent = FALSE`, `is_active = FALSE`, `password_hash = 'DELETED'`), revokes auth tokens/cookies, deletes `push_subscriptions` and in-app `notifications`, retains financial records in `payments` and `reservations`, and logs an immutable audit event in `audit_events`.
- **FR-021 (Data Correction & UI)**: Accessible Arabic and English interface (`src/pages/ProfilePrivacy.tsx`) allowing users to download data, correct profile info, and request deletion.

## 3. Technical Design & Architecture
- **Backend Components**:
  - `backend/src/services/privacy.service.ts`: Core aggregation and anonymization transaction logic.
  - `backend/src/controllers/privacy.controller.ts`: API request handling and password validation.
  - `backend/src/routes/privacy.routes.ts`: Routes mounted at `/api/v1/user`.
- **Database Schema**:
  - `push_subscriptions` table (`id`, `user_id`, `endpoint`, `keys`, `created_at`).
- **Frontend Components**:
  - `src/pages/ProfilePrivacy.tsx`: WCAG 2.2 AA compliant UI component.
  - `src/services/api.ts`: Methods for privacy API calls.

## 4. Policy Constraints & Compliance
- Security: Never expose PII of third parties in data export.
- Audit: Append-only entries to `audit_events` on account erasure.
- Retention: Statutory 5-year retention of financial records.
- Accessibility: WCAG 2.2 AA compliant UI controls, high contrast, ARIA tags, RTL support.

## 5. Areas of Concern & Tradeoffs
> [!NOTE]
> Unique constraints on `users.phone` require `deleted_${id}` format to avoid constraint violations while preventing user re-login.
