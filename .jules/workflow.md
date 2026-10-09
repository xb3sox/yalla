# Jules Operational Workflow

## Branch Conventions
- Always create branches from latest `main`.
- Naming format: `jules/<issue-id>-<short-description>` (e.g. `jules/issue-12-stripe-webhook`).

## Pre-PR Checklist
Before opening a pull request:
1. Ensure full test suite passes (`npm test -- --run` and `cd backend && npm test`).
2. Run typechecks (`npm run typecheck` in both root and `backend`).
3. Check diff to verify no unintended files (`.env`, secrets, or CI configs) are modified.
4. Run internal Critic Agent self-critique.
