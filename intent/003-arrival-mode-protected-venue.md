# Intent: Arrival Mode, Venue Protection & Dynamic PIN Check-In

**Author**: Trust & Community Operations  
**Date**: 2026-10-19  
**Status**: accepted  

---

## 1. Problem

Publicly exposing exact venue coordinates or private meeting addresses attracts unvetted drop-ins, creates host security risks, and prevents accurate attendance verification. Furthermore, paper guest lists and manual check-in cause line delays and errors.

## 2. Proposed Outcome

A protected arrival mode and cryptographic PIN check-in:

- Venue coordinates (`latitude`, `longitude`, exact street address) are strictly concealed from public API responses.
- Access unlocks exclusively in "Arrival Mode" for users with `reconfirmed` status within the event time window.
- The participant app generates a dynamic 6-digit verification PIN.
- The host verifies the PIN using a dedicated host interface (`/api/v1/host/check-in`) to transition state to `checked_in`.

## 3. Affected Users & Systems

- **Users**: Confirmed participants, designated experience hosts.
- **Systems**: `src/pages/ArrivalMode.tsx`, `src/pages/HostPortal.tsx`, `backend/src/routes/host.routes.ts`, `backend/src/routes/reservation.routes.ts`, `backend/src/models/reservation.model.ts`.

## 4. Constraints

- Coordinates must NEVER leak in `GET /api/v1/experiences` or `GET /api/v1/experiences/:id`.
- Reconfirmation must be completed prior to unlocking coordinates.
- Check-in PIN must be verified server-side with strict state transition validation.

## 5. Open Questions

- What occurs if a guest is unable to access arrival mode due to network loss?
- Answer: Host roster permits manual verified check-in with mandatory audit logging.
