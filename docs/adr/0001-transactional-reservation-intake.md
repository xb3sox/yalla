# ADR 0001: Transactional Reservation Intake & State Machine Locality

## Status

Accepted

## Context

Reservation creation previously suffered from architectural shallowness and seam leakage:

1. Client components (`ExperienceDetails.tsx`) generated synthetic booking IDs (`res-${Date.now()}`) and dispatched them to an in-memory reducer store without guaranteeing persistence or backend consistency.
2. Backend controllers coordinated booking across multiple uncoordinated pool queries (`findById`, `check capacity`, `create`, `incrementBooked`, `updateState`) without row locking or transactional isolation, creating race conditions under concurrent booking.
3. State transition dictionaries were duplicated across controllers and models, risking divergence.

## Decision

1. **Encapsulate reservation intake in domain model**:
   All reservation creation goes through `reservationModel.createWithCapacityCheck`, which runs inside a PostgreSQL transaction with `SELECT ... FOR UPDATE` row-level capacity locking, idempotency check, and state transition.
2. **Localize state transition rules**:
   State transitions (`EXPERIENCE_TRANSITIONS`, `SAFETY_CASE_TRANSITIONS`) are declared and exported directly from their respective models (`experience.model.ts`, `safety_case.model.ts`). Controllers consume model definitions and never redefine transition records inline.
3. **Unify recommendation reason generation**:
   Backend recommendation engine emits structured reason tokens with O(N) precomputed Set lookups; client components consume these tokens for localized explanation badges.
4. **Wire client to authoritative API seam**:
   Client pages (`ExperienceDetails.tsx`, `MyPlans.tsx`) call `api.reservations` methods directly, using local store dispatch as reactive synchronization.

## Consequences

- **Positive**: Eliminates race conditions and overbooking. Guarantees transactional consistency. Eliminates duplicated state machine definitions. Keeps recommendation explanation logic centralized.
- **Negative / Constraints**: PostgreSQL role must permit `SELECT ... FOR UPDATE` locking.
