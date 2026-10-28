# Plan: Staff Operations, Capacity Overrides & Attendance Auditing

**Spec Reference**: `specs/004-staff-operations-capacity.md`  
**Intent Reference**: `intent/004-staff-operations-capacity.md`  
**Author**: Jules / Antigravity Agent  
**Date**: 2026-10-19  
**Status**: completed  

---

## 1. Files That Change

- `backend/src/routes/staff.routes.ts` (Staff management routes)
- `backend/src/controllers/staff.controller.ts` (Operations handlers & export logic)
- `backend/src/middleware/auth.middleware.ts` (RBAC role verification)
- `backend/src/models/audit.model.ts` (Privileged action logging)
- `src/pages/Staff.tsx` (Operations UI console)
- `src/pages/Staff.test.tsx` (Frontend operations component tests)

## 2. Order of Work

1. Implement `requireRole` middleware in `auth.middleware.ts`.
2. Implement CSV and Excel export utilities using `json2csv` and `exceljs`.
3. Add capacity override endpoint writing directly to `audit_logs`.
4. Build frontend operations page with tabs for schedules, capacity, and attendee rosters.
5. Verify with automated tests.

## 3. Risks & Mitigations

- **Privilege Escalation**: Strict rejection of non-admin roles on capacity overrides.
- **Export Memory Bloat**: Stream responses with pagination limits where appropriate.

## 4. Proof of Correctness

- `npx vitest run src/pages/Staff.test.tsx`
- `cd backend && npm run typecheck`
