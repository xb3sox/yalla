# Spec: Automated Attendee Cancellation & Partial/Full Refund Policy Engine

**Intent Reference**: `intent/007-cancellation-refund-engine.md`
**Author**: Yalla Team / Jules
**Date**: 2027-01-15
**Status**: approved

---

## 1. Executive Summary

This feature automates attendee cancellations, rule-based partial/full refund calculation, instant Stripe refund processing, and waitlist backfilling.

## 2. Requirements & Domain Logic

- **Refund Policy Rules Matrix**:
  - `> 48 Hours Before Event Start`: 100% refund of base fee (`tier: 'full'`).
  - `24 to 48 Hours Before Event Start`: 50% partial refund (`tier: 'partial'`).
  - `< 24 Hours Before Event Start`: 0% refund (`tier: 'none'`, spot released).
  - `Host / Yalla Operational Cancellation`: 100% full refund + bonus loyalty points credit (`tier: 'operational'`).
- **State Machine Lifecycle**:
  - Active (`confirmed` / `reconfirmed`) -> `cancelled_by_participant` or `cancelled_by_yalla`.
  - If refund amount > 0: `cancelled_by_*` -> `refund_pending` -> `refunded`.
  - If refund amount == 0: state remains `cancelled_by_*` (spot released).
- **Waitlist Auto-Promotion**:
  - Promotes highest priority waitlisted reservation from `waitlisted` -> `offered` with `expiry_at` set to 2 hours from now.

## 3. Technical Design & Architecture

- **Database Schema**:
  - Table `refunds` with `UNIQUE(reservation_id, stripe_refund_id)`.
- **Backend Services**:
  - `CancellationService.calculateRefundAmount(reservation, eventStartTime, canceledBy, price)`
  - `CancellationService.executeCancellation(input)`
  - `WaitlistService.promoteNext(experienceId)`
- **API Endpoint**:
  - `POST /api/v1/reservations/:id/cancel`
  - Validated via Zod middleware.
  - Authorized for reservation owner or staff (`staff`, `admin`, `operations`, `support`).

## 4. Policy Constraints & Compliance

- **Security & Financial Integrity**:
  - Idempotent Stripe refunds.
  - Constraint `UNIQUE(reservation_id, stripe_refund_id)`.
- **Auditability**:
  - Immutable append-only audit event in `audit_events`.

## 5. Areas of Concern & Tradeoffs

- Concurrency: Atomically acquire row locks (`SELECT ... FOR UPDATE`) on reservation and experience rows during cancellation to prevent race conditions during state transitions and waitlist promotions.
