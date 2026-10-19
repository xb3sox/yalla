# Plan: Trust, Safety Cases & Audit Logging

**Spec Reference**: `specs/005-trust-safety-audit.md`  
**Intent Reference**: `intent/005-trust-safety-audit.md`  
**Author**: Jules / Antigravity Agent  
**Date**: 2026-10-19  
**Status**: completed  

---

## 1. Files That Change
- `backend/src/routes/safety_case.routes.ts` (Safety case endpoints)
- `backend/src/controllers/safety_case.controller.ts` (Case state machine and triage)
- `backend/src/routes/blocks.routes.ts` (User blocking endpoints)
- `backend/src/routes/audit.routes.ts` (Audit query and export endpoints)
- `backend/src/models/safety_case.model.ts` (Safety data layer)
- `backend/src/models/audit.model.ts` (Immutable audit logging)

## 2. Order of Work
1. Implement `safety_cases`, `user_blocks`, and `audit_logs` SQL schemas.
2. Build RBAC middleware enforcing `safety_staff` and `admin` permission gates.
3. Wire state transition logic for safety cases.
4. Implement bilateral block check in group matching logic.
5. Verify with automated test suites.

## 3. Risks & Mitigations
- **Information Leakage**: Restrict case payloads from serializing reporter contact info to third parties.
- **Audit Tampering**: Database user permissions grant only INSERT and SELECT on `audit_logs`.

## 4. Proof of Correctness
- `cd backend && npm test -- tests/unit/security.middleware.test.ts`
- `cd backend && npm run typecheck`
