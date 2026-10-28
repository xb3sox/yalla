# Intent: Staff Operations, Capacity Overrides & Attendance Auditing

**Author**: Operations Director  
**Date**: 2026-10-19  
**Status**: accepted  

---

## 1. Problem

Operations staff need comprehensive control over experiences, host dispatching, venue assignments, and capacity thresholds. When venues change or attendance counts require manual correction, modifications must be rigorously audited to prevent fraud or unrecorded capacity violations.

## 2. Proposed Outcome

Centralized staff portal and operational API:

- Create, schedule, and publish experience plans with minimum and maximum thresholds.
- Assign primary and backup hosts and venues.
- Override capacity limits with mandatory audit logging.
- Generate operational attendance reports and export attendee rosters as CSV/Excel.
- Perform audited attendance corrections for guests unable to scan dynamic PINs.

## 3. Affected Users & Systems

- **Users**: Operations Coordinators, Field Hosts, Platform Administrators.
- **Systems**: `src/pages/Staff.tsx`, `backend/src/routes/staff.routes.ts`, `backend/src/controllers/staff.controller.ts`, `backend/src/models/audit.model.ts`.

## 4. Constraints

- Role-based access control (RBAC): only users with `staff` or `admin` roles can access operational routes.
- Capacity overrides require `admin` role and must write an immutable audit log entry.
- Export endpoints must support streaming CSV/Excel without memory exhaustion.

## 5. Open Questions

- What audit parameters are required when staff manually checks in a guest?
- Answer: `actor_id`, `reservation_id`, `reason`, `ip_address`, and `timestamp`.
