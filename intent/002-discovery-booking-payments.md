# Intent: Experience Discovery, Booking & Payment Lifecycle

**Author**: Product Team & Community Operations  
**Date**: 2026-10-19  
**Status**: accepted  

---

## 1. Problem
Adults in Saudi Arabia seeking curated local group experiences face fragmented discovery, lack of transparent seat availability, and untrusted payment flows. Overbooking, manual payment confirmations, and unhandled cancellations cause high drop-off and friction.

## 2. Proposed Outcome
A seamless discovery-to-booking funnel:
- Participants browse curated experiences filtered by category, city, date, and price.
- Dynamic availability checks prevent overbooking; full experiences offer an automated waitlist.
- 1-click booking creates a pending reservation with Stripe Payment Intent.
- Idempotent confirmation locks the seat and advances reservation state to `confirmed`.

## 3. Affected Users & Systems
- **Users**: Participants, Operations Staff, Financial Administrators.
- **Systems**: `src/pages/Home.tsx`, `src/pages/ExperienceDetail.tsx`, `src/pages/Checkout.tsx`, `backend/src/routes/experience.routes.ts`, `backend/src/routes/reservation.routes.ts`, `backend/src/routes/payment.routes.ts`, Stripe Payment Gateway.

## 4. Constraints
- Prices must be retrieved dynamically from database records (no hardcoded prices).
- Payment intent generation must be idempotent using reservation IDs.
- Concurrency control: database transactions must prevent capacity race conditions.
- Strict WCAG 2.2 AA accessibility and Arabic RTL support on all checkout flows.

## 5. Open Questions
- What is the cancellation refund policy window (e.g. 100% refund > 24 hours)?
- Answer: Enforced at 24 hours prior to experience start in `ReservationStateMachine`.
