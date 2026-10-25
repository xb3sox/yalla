# [Jules] Phase 3: Automated Attendee Cancellation & Partial/Full Refund Policy Engine

**Labels**: `backlog`, `phase-3`, `payments`, `stripe`, `backend`, `jules`
**Milestone**: Phase 3: Real-Time & Communications (Q1 2027)

---

## Problem & Context
Currently, when a confirmed attendee cancels a reservation, staff operations must manually calculate refund eligibility, issue Stripe refunds, update database records, and manually check if waitlisted attendees can be promoted.

An automated, rule-based cancellation and refund engine is required to enforce Yalla's tier-based cancellation policy, process partial/full Stripe refunds instantly, and automatically backfill canceled spots from the waitlist queue.

---

## User Story
**As an** attendee or staff member,
**I want** cancellations to automatically calculate eligible refund percentages based on notice period and issue Stripe refunds instantly,
**So that** refund processing is immediate, transparent, and backfills the waitlist without manual operational overhead.

---

## Technical Architecture & Scope

### 1. Cancellation Policy Rules Matrix
- **>48 Hours Before Event Start**: 100% refund of base experience fee.
- **24 to 48 Hours Before Event Start**: 50% partial refund.
- **<24 Hours Before Event Start**: 0% refund (non-refundable window; spot released).
- **Host / Yalla Operational Cancellation**: 100% full refund + bonus loyalty points credit.

### 2. Core Service (`backend/src/services/cancellation.service.ts`)
- `calculateRefundAmount(reservation, eventStartTime)`: Determines eligible refund amount and policy tier.
- `executeCancellation(reservationId, canceledBy, reason)`:
  1. Executes PostgreSQL transaction: transitions `reservations.status` to `canceled`.
  2. Calls Stripe API `stripe.refunds.create({ payment_intent, amount })` for Stripe payments or updates points balance for synthetic/reward redemptions.
  3. Records entry in `refunds` table with `refund_id`, `amount`, `status`, `tier`.
  4. Triggers waitlist auto-promotion pipeline (`WaitlistService.promoteNext()`).
  5. Emits cancellation audit log and dispatches SMS/Email receipt to user.

### 3. API Endpoint (`POST /api/v1/reservations/:id/cancel`)
- Endpoint schema validation using Zod.
- Require authentication (`req.user.id === reservation.user_id` OR `req.user.role IN ('staff', 'admin')`).

---

## Acceptance Criteria
- [ ] Cancellation endpoint enforces role authorization and validates reservation state (`confirmed` or `reconfirmed`).
- [ ] Refund tiers (>48h = 100%, 24-48h = 50%, <24h = 0%) calculated accurately based on ISO timestamps.
- [ ] Stripe API refund issued via `stripe.refunds.create` with appropriate metadata (`reservation_id`, `tier`).
- [ ] Waitlist queue automatically evaluates highest-priority waitlisted user and issues time-limited 2-hour booking invite.
- [ ] Database transaction ensures atomic state transition of reservation, refund record, and audit log.
- [ ] Complete unit test coverage for all time windows and edge cases (e.g. Stripe webhook reconciliation).

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/services/cancellation.service.test.ts` testing time-based refund calculations and Stripe mocks.
- [ ] Add integration test in `backend/tests/unit/routes/cancellation.routes.test.ts`.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Financial Invariants**: Never issue duplicate refunds for the same `payment_intent_id`; enforce database constraint `UNIQUE(reservation_id, stripe_refund_id)`.
- **Auditability**: Every cancellation and refund event must write an immutable record to `audit_logs` capturing `user_id`, `refund_amount`, `stripe_refund_id`, and `ip_address`.
