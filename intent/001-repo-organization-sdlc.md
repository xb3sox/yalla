# Intent: Repository Organization & AI-Native SDLC Implementation

**Author**: Engineering Team  
**Date**: 2026-10-19  
**Status**: accepted  

---

## 1. Problem

The repository contains 32 historical session report files (~400KB) in `docs/archive/` and an obsolete `pnpm-lock.yaml`, creating token waste, search confusion, and maintenance friction. Development handoffs lack a continuous machine-readable artifact chain, risking inconsistent agent execution and drift between product intent, technical specifications, and production maintenance.

## 2. Proposed Outcome

1. Clean repository structure with zero obsolete documentation clutter.
2. Full adoption of the Anthropic AI-Native SDLC playbook across all 6 stages (`intent/`, `specs/`, `plans/`, continuous evals, deployment guardrails, and automated maintenance loop).
3. Jules autonomous agent workflow aligned with SDLC stages and strict safety rules.
4. Essential project documentation (`ARCHITECTURE.md`, `API.md`, `DATABASE.md`, `README.md`) concise, clear, and complete.

## 3. Affected Users & Systems

- **Users**: Core developers, product managers, automated coding agents (Jules, Claude Code).
- **Systems**: Repo root, `docs/`, `.jules/`, `.github/workflows/`, `backend/`, and frontend build tooling.

## 4. Constraints

- Zero breaking changes to existing product code or test suites (all 664 frontend tests and 62 backend unit tests must continue passing).
- Preserve hard-earned rules in `AGENTS.md` and `.jules/` (prototype pollution protection, generic health checks, O(N) Set lookups).
- Follow Ponytail principles: minimal diff, deletion beats addition, eliminate bloat.

## 5. Open Questions

- None. Strategy approved and established via implementation plan.
