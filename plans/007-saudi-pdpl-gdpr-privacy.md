# Plan: Saudi PDPL & GDPR Privacy Compliance Implementation

## Steps

1. **SDLC Artifact Creation**
   - Create `intent/007-saudi-pdpl-gdpr-privacy.md`, `specs/007-saudi-pdpl-gdpr-privacy.md`, and `plans/007-saudi-pdpl-gdpr-privacy.md`.

2. **Database Migration**
   - Add migration `backend/src/migrations/005_add_push_subscriptions_table.ts` for `push_subscriptions`.

3. **Backend Implementation**
   - Implement `backend/src/services/privacy.service.ts` (`exportUserData`, `anonymizeAndDeleteAccount`).
   - Implement `backend/src/controllers/privacy.controller.ts` and `backend/src/routes/privacy.routes.ts`.
   - Mount routes at `/api/v1/user` in `backend/src/server.ts`.

4. **Frontend Implementation**
   - Implement `src/pages/ProfilePrivacy.tsx` with export and deletion modal.
   - Update `src/services/api.ts` and `src/pages/Profile.tsx`.

5. **Automated Testing**
   - Add backend tests `privacy.service.test.ts` and `privacy.routes.test.ts`.
   - Add frontend component test `ProfilePrivacy.test.tsx`.

6. **Verification**
   - Run typechecks, unit tests, and evals check.
