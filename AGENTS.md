# AGENTS.md - Autonomous Agent Guide

This repository contains **Yalla**, a curated experience platform with a React/Vite frontend and an Express/TypeScript/PostgreSQL backend.

## Project Structure

- `/`: Frontend application (React 18, Vite, TypeScript, Tailwind CSS, Vitest).
- `/backend`: Backend API service (Express, TypeScript, PostgreSQL, Jest).
- `.github/workflows`: CI/CD workflows and automated PR checks.
- `.jules`: Persistent agent operational learnings and guidelines.

---

## Environment Setup & Build Commands

### Frontend
- Install: `npm ci`
- Typecheck: `npm run typecheck`
- Test: `npm test -- --run`
- Build: `npm run build`

### Backend
- Directory: `cd backend`
- Install: `npm ci`
- Typecheck: `npm run typecheck`
- Test: `npm test`
- Build: `npm run build`

---

## Agent Coding & Execution Rules

1. **Test-First Verification:**
   - Every bugfix, refactor, or feature MUST include corresponding unit or integration tests.
   - Run tests before creating a pull request. Do not submit failing tests.
2. **Security & Performance Standards:**
   - Refer to [`.jules/sentinel.md`](.jules/sentinel.md): Prevent prototype pollution in sanitizers and eliminate internal error leakage in public responses.
   - Refer to [`.jules/bolt.md`](.jules/bolt.md): Precompute set lookups and avoid nested iteration loops.
3. **Pull Request Protocol:**
   - Always branch off `main` using prefix: `jules/<feature-or-fix-name>`.
   - Provide a concise PR description with:
     - Summary of changes
     - Motivation/Problem solved
     - Verification command & test proof
   - Run Jules internal Critic Agent self-review before submitting.
