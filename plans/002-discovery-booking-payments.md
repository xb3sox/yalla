# Plan: Experience Discovery, Booking & Payment Lifecycle

**Spec Reference**: `specs/002-discovery-booking-payments.md`  
**Intent Reference**: `intent/002-discovery-booking-payments.md`  
**Author**: Jules / Antigravity Agent  
**Date**: 2026-10-19  
**Status**: completed  

---

## 1. Files That Change
- `backend/src/routes/experience.routes.ts` (API endpoints for listing & retrieval)
- `backend/src/routes/reservation.routes.ts` (Booking lifecycle & waitlist management)
- `backend/src/routes/payment.routes.ts` (Stripe intent & confirmation)
- `src/domain/services/ReservationStateMachine.ts` (Domain transition rules)
- `src/application/useCases/bookingUseCase.ts` (Application booking use case)
- `src/pages/Home.tsx`, `src/pages/ExperienceDetail.tsx`, `src/pages/Checkout.tsx`

## 2. Order of Work
1. Define PostgreSQL schema for `experiences`, `reservations`, `payments`.
2. Implement backend models with parameterized queries.
3. Wire controllers with Zod input validation and error middleware.
4. Implement frontend use case and state machine.
5. Verify with automated tests across unit and integration suites.

## 3. Risks & Mitigations
- **Double Booking**: Mitigate with transactional seat count validation.
- **Stripe Failure**: Webhook fallback reconciles payments when client drops connection.

## 4. Proof of Correctness
- `npx vitest run src/domain/services/ReservationStateMachine.test.ts`
- `npx vitest run src/application/useCases/bookingUseCase.test.ts`
- `cd backend && npm test -- tests/unit/reward.controller.test.ts`
