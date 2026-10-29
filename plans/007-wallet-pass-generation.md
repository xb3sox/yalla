# Plan: Offline Boarding Pass & Apple/Google Wallet Pass Generation

**Spec Reference**: `specs/007-wallet-pass-generation.md`
**Intent Reference**: `intent/007-wallet-pass-generation.md`
**Author**: Mobile & Experience Lead
**Date**: 2026-10-26
**Status**: in_progress

---

## 1. Files That Change
- `[NEW] backend/src/services/appleWallet.service.ts`
- `[NEW] backend/src/services/googleWallet.service.ts`
- `[NEW] backend/src/controllers/wallet.controller.ts`
- `[NEW] backend/src/routes/wallet.routes.ts`
- `[MODIFY] backend/src/server.ts`
- `[NEW] src/components/WalletButtons.tsx`
- `[MODIFY] src/pages/ArrivalMode.tsx`
- `[MODIFY] src/pages/MyPlans.tsx`
- `[MODIFY] src/pages/ExperienceDetails.tsx`
- `[MODIFY] src/i18n/index.ts`
- `[NEW] backend/tests/unit/services/wallet.service.test.ts`
- `[NEW] backend/tests/unit/routes/wallet.routes.test.ts`
- `[NEW] src/components/WalletButtons.test.tsx`

## 2. Order of Work
1. Implement backend `AppleWalletService` and `GoogleWalletService` with privacy gating logic.
2. Implement backend `WalletController` and `WalletRoutes` and mount in `server.ts`.
3. Create frontend `WalletButtons` component and integrate into `ArrivalMode`, `MyPlans`, and `ExperienceDetails`.
4. Add unit and integration test suites for wallet pass generation and privacy gating rules.
5. Complete verification and pre-commit checks.

## 3. Risks & Mitigations
- **Risk**: Leaking exact venue coordinates in pre-24h passes.
- **Mitigation**: Unit tests in `wallet.service.test.ts` strictly assert that pre-24h or unconfirmed pass JSON payloads omit `locations`/`relevantLocations` and exact street address.

## 4. Proof of Correctness
- `npm run typecheck` passes in backend and frontend.
- `npm test -- tests/unit` passes all unit and integration tests.
- `node evals/check.js` passes 10/10 AI agent evals.
