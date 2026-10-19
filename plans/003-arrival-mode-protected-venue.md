# Plan: Arrival Mode, Venue Protection & Dynamic PIN Check-In

**Spec Reference**: `specs/003-arrival-mode-protected-venue.md`  
**Intent Reference**: `intent/003-arrival-mode-protected-venue.md`  
**Author**: Jules / Antigravity Agent  
**Date**: 2026-10-19  
**Status**: completed  

---

## 1. Files That Change
- `backend/src/routes/host.routes.ts` (Host endpoints for experience roster & PIN verification)
- `backend/src/controllers/host.controller.ts` (Check-in verification logic)
- `backend/src/routes/reservation.routes.ts` (Arrival mode coordinate gating)
- `src/application/useCases/reconfirmationUseCase.ts` (Attendance reconfirmation client logic)
- `src/pages/ArrivalMode.tsx` (Venue reveal, navigation links, PIN display)
- `backend/tests/unit/controllers/host.controller.test.ts` (Automated verification)

## 2. Order of Work
1. Strip coordinates from `experience.model.ts:findAllPublished`.
2. Add `GET /api/v1/reservations/:id/arrival` route requiring `reconfirmed` state.
3. Implement `POST /api/v1/host/check-in` with host ownership validation and PIN matching.
4. Add state machine checks preventing check-in for cancelled or pending reservations.
5. Verify with host controller unit test suite.

## 3. Risks & Mitigations
- **Unauthorized Coordinate Scraping**: Coordinate fields omitted from SQL select queries on public routes.
- **PIN Brute-Force**: Rate limiters applied to `/api/v1/host/check-in` (maximum 10 attempts per minute per host).

## 4. Proof of Correctness
- `cd backend && npm test -- tests/unit/controllers/host.controller.test.ts`
- `npx vitest run src/application/useCases/reconfirmationUseCase.test.ts`
