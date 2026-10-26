# Plan: Automated Attendee Cancellation & Partial/Full Refund Policy Engine

**Spec Reference**: `specs/007-cancellation-refund-engine.md`
**Intent Reference**: `intent/007-cancellation-refund-engine.md`
**Author**: Yalla Team / Jules
**Date**: 2027-01-15
**Status**: in_progress

---

## 1. Files That Change
- `NEW` `intent/007-cancellation-refund-engine.md`
- `NEW` `specs/007-cancellation-refund-engine.md`
- `NEW` `plans/007-cancellation-refund-engine.md`
- `NEW` `backend/src/migrations/005_add_refunds_table.ts`
- `NEW` `backend/src/services/waitlist.service.ts`
- `NEW` `backend/src/services/cancellation.service.ts`
- `NEW` `backend/src/controllers/cancellation.controller.ts`
- `NEW` `backend/tests/unit/services/cancellation.service.test.ts`
- `NEW` `backend/tests/unit/routes/cancellation.routes.test.ts`
- `MODIFY` `backend/src/routes/reservation.routes.ts`
- `MODIFY` `backend/src/controllers/reservation.controller.ts`

## 2. Order of Work
1. Create SDLC intent, spec, and plan artifacts.
2. Add database migration `005_add_refunds_table.ts` with `UNIQUE(reservation_id, stripe_refund_id)`.
3. Implement `WaitlistService.promoteNext()` and `CancellationService`.
4. Update `POST /api/v1/reservations/:id/cancel` route and controller with Zod validation and authorization.
5. Add unit and route integration tests.
6. Verify typecheck, unit tests, and evals.

## 3. Risks & Mitigations
- **Risk**: Duplicate refund issuance on repeated cancellation calls.
- **Mitigation**: DB unique constraint `UNIQUE(reservation_id, stripe_refund_id)` and checking current reservation state before processing refund.

## 4. Proof of Correctness
- `npm run typecheck`
- `npm test -- tests/unit`
- `node evals/check.js`
