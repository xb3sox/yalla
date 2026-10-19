# Yalla Domain Glossary

Shared domain vocabulary anchoring architecture seams and boundaries.

---

### Reservation Intake
The atomic transactional entry point that verifies participant eligibility, acquires an exclusive capacity lock on an experience, checks idempotency keys, and transitions reservation state from initiated to confirmed or waitlisted.

### Capacity Lock
A pessimistic row-level lock (`SELECT ... FOR UPDATE`) held during reservation intake to prevent concurrent overbooking when available slots approach zero.

### Transition Invariant
The immutable set of allowed state changes governing lifecycle progression (e.g. `EXPERIENCE_TRANSITIONS`, `SAFETY_CASE_TRANSITIONS`, `VALID_TRANSITIONS`). Transition invariants reside directly in domain models and must never be duplicated in transport controllers.

### Recommendation Reason
A structured, localized token emitted by the recommendation engine explaining why an experience matches a user profile (e.g. area match, budget match, accessibility match, or limited availability).

### Data Access Seam
The single authoritative gateway (`api.ts`) through which client views read and mutate persistent state. Client state stores hold only ephemeral UI session state (language, active modal, current user), never disconnected copies of entity tables.
