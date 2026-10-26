# Intent: Automated Attendee Cancellation & Partial/Full Refund Policy Engine

**Author**: Yalla Team / Jules
**Date**: 2027-01-15
**Status**: accepted

---

## 1. Problem
Currently, when a confirmed attendee cancels a reservation, staff operations must manually calculate refund eligibility, issue Stripe refunds, update database records, and check if waitlisted attendees can be promoted. This creates operational overhead and delays refund confirmation for participants.

## 2. Proposed Outcome
An automated, rule-based cancellation and refund engine that enforces Yalla's tier-based cancellation policy (>48h = 100%, 24-48h = 50%, <24h = 0%, Host/Yalla Operational = 100% + bonus points credit), processes Stripe refunds instantly, updates state transitions atomically, and automatically backfills canceled spots from the waitlist queue with 2-hour time-limited booking invites.

## 3. Affected Users & Systems
- **Users**: Participants, Staff Operations, Admin
- **Systems**: Backend API (Express + TypeScript + PostgreSQL), Stripe Integration, Rewards Engine, Audit Logging System, Notification System

## 4. Constraints
- Financial Invariant: Never issue duplicate refunds for the same reservation/payment intent (`UNIQUE(reservation_id, stripe_refund_id)`).
- State Lifecycle: Strictly adhere to `ReservationStateMachine.ts` and `reservation.model.ts` (`state` column, state transitions `cancelled_by_*` -> `refund_pending` -> `refunded`).
- Auditability: Write immutable append-only records to `audit_events`.
- WCAG / i18n: Dispatches localized notification/SMS receipts to participants.

## 5. Open Questions
- None. Requirements and policy matrix are fully specified in PRD / Phase 3 scope.
