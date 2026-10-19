# Plan: Repository Reorganization & AI-Native SDLC Architecture

**Spec Reference**: `specs/001-sdlc-architecture.md`  
**Intent Reference**: `intent/001-repo-organization-sdlc.md`  
**Author**: Jules / Antigravity Agent  
**Date**: 2026-10-19  
**Status**: in_progress  

---

## 1. Files That Change
- `[DELETE] docs/archive/*` (32 obsolete session files)
- `[DELETE] pnpm-lock.yaml` (stale lockfile)
- `[NEW] docs/ARCHITECTURE.md` (clean architecture & DDD guide)
- `[NEW] docs/API.md` (53 endpoints reference)
- `[NEW] docs/DATABASE.md` (PostgreSQL schemas & relations)
- `[NEW] intent/TEMPLATE.md` & `intent/001-repo-organization-sdlc.md`
- `[NEW] specs/TEMPLATE.md` & `specs/001-sdlc-architecture.md`
- `[NEW] plans/TEMPLATE.md` & `plans/001-sdlc-execution-plan.md`
- `[NEW] evals/evals.json` & `evals/check.js`
- `[NEW] .github/workflows/agent-evals.yml`
- `[NEW] scripts/monitor-breach.js`
- `[MODIFY] docker-compose.yml` & `[NEW] Dockerfile`
- `[MODIFY] AGENTS.md` & `[NEW] CLAUDE.md`
- `[MODIFY] .jules/workflow.md` & `[NEW] .jules/critic.md`
- `[MODIFY] README.md`, `CONTRIBUTING.md`, `DEPLOYMENT.md`, `ROADMAP.md`, `CHANGELOG.md`

## 2. Order of Work
1. Purge obsolete files (`docs/archive/`, `pnpm-lock.yaml`).
2. Add core technical documents (`docs/ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE.md`).
3. Commit SDLC templates and inaugural artifacts (`intent/`, `specs/`, `plans/`).
4. Establish evaluation framework in `evals/` and CI agent workflow.
5. Create deterministic breach monitoring script in `scripts/monitor-breach.js`.
6. Fix Docker and frontend container definitions.
7. Align Jules operational guidelines and AI developer contexts (`AGENTS.md`, `CLAUDE.md`, `.jules/`).
8. Update root documentation (`README.md`, `CONTRIBUTING.md`, `DEPLOYMENT.md`, `CHANGELOG.md`).
9. Run full verification test matrix.

## 3. Risks & Mitigations
- **Risk**: Deletion of non-essential docs breaking external links or developer bookmarks.
  - **Mitigation**: All valid technical content consolidated in `docs/ARCHITECTURE.md`, `docs/API.md`, and `docs/DATABASE.md`.
- **Risk**: Test breakage during environment adjustments.
  - **Mitigation**: Run `tsc --noEmit` and full test suites before and after every phase.

## 4. Proof of Correctness
- `npm run typecheck` passes with zero errors.
- `npx vitest run` passes all 664 frontend tests.
- `cd backend && npm run typecheck && npm run lint && npm test -- tests/unit` passes completely.
- `node scripts/monitor-breach.js --dry-run` executes with exit code 0.
