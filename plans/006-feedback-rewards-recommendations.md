# Plan: Feedback, Loyalty Rewards & Recommendation Engine

**Spec Reference**: `specs/006-feedback-rewards-recommendations.md`  
**Intent Reference**: `intent/006-feedback-rewards-recommendations.md`  
**Author**: Jules / Antigravity Agent  
**Date**: 2026-10-19  
**Status**: completed  

---

## 1. Files That Change
- `backend/src/routes/feedback.routes.ts` & `backend/src/controllers/feedback.controller.ts`
- `backend/src/routes/reward.routes.ts` & `backend/src/controllers/reward.controller.ts`
- `backend/src/controllers/recommendation.controller.ts`
- `src/application/useCases/rewardsUseCase.ts` & `src/application/useCases/recommendationUseCase.ts`
- `src/pages/Feedback.tsx`
- `backend/tests/unit/feedback.controller.test.ts`
- `backend/tests/unit/reward.controller.test.ts`
- `backend/tests/unit/recommendation.test.ts`

## 2. Order of Work
1. Implement `feedbacks`, `rewards`, and `reward_transactions` migrations and models.
2. Wire controllers with validation and reservation state checks.
3. Optimize recommendation controller with `new Set` precomputation.
4. Implement frontend use cases and test suites.
5. Verify with automated tests.

## 3. Risks & Mitigations
- **Overspending Points**: Atomic SQL conditional update prevents negative balances.
- **Negative Feedback Manipulation**: Reviews restricted to verified attendees.

## 4. Proof of Correctness
- `cd backend && npm test -- tests/unit/feedback.controller.test.ts`
- `cd backend && npm test -- tests/unit/reward.controller.test.ts`
- `cd backend && npm test -- tests/unit/recommendation.test.ts`
- `npx vitest run src/application/useCases/recommendationUseCase.test.ts`
- `npx vitest run src/application/useCases/rewardsUseCase.test.ts`
