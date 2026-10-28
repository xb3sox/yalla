# Intent: Trust, Safety Cases & Audit Logging

**Author**: Trust & Safety Lead  
**Date**: 2026-10-19  
**Status**: accepted  

---

## 1. Problem

Curated experiences require deep interpersonal trust. When behavioral incidents, harassment, or safety concerns occur, participants must have immediate, private channels to report them. Reports must be strictly isolated from general support staff to protect reporter privacy, prevent retaliation, and enable decisive moderation actions (such as account restrictions and permanent blocking).

## 2. Proposed Outcome

A robust safety reporting and auditing subsystem:

- Participants report safety incidents with confidentiality levels and optional evidence.
- Users can unilaterally block other participants, permanently preventing common group matching.
- Specialized Trust & Safety staff (`safety_staff` role) access restricted case queues.
- Safety staff update investigation status, record confidential notes, and apply sanctions.
- Comprehensive, immutable audit trail for all regulatory and legal compliance inquiries.

## 3. Affected Users & Systems

- **Users**: Participants, Trust & Safety Staff, System Administrators.
- **Systems**: `backend/src/routes/safety_case.routes.ts`, `backend/src/routes/blocks.routes.ts`, `backend/src/routes/audit.routes.ts`, `backend/src/models/safety_case.model.ts`, `backend/src/models/audit.model.ts`.

## 4. Constraints

- General `staff` and `host` roles must be completely barred from accessing safety cases.
- Blocked user relationships must be bidirectionally respected during group formation and recommendation scoring.
- Audit logs must be strictly append-only; update and delete operations must be forbidden at the database layer.

## 5. Open Questions

- Can a participant see the resolution notes of a safety case?
- Answer: Only the final disposition status (`action_taken`, `dismissed`); internal investigative notes remain strictly restricted.
