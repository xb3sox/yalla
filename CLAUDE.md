# CLAUDE.md

Yalla: React 18 + Vite 6 frontend at repo root (`yalla-frontend`), Express + TypeScript + PostgreSQL API in `backend/` (`yalla-backend`). Two independent npm projects (no workspaces) — install/test each separately with `npm ci`. Pinned Node 20 (`.nvmrc`).

## AI-Native SDLC Stages

1. **Stage 1 (Plan)**: Capture feature requests/bug fixes in `intent/<id>-<slug>.md` using `intent/TEMPLATE.md`.
2. **Stage 2 (Design)**: Formalize requirements, policies, and architecture in `specs/<id>-<slug>.md` using `specs/TEMPLATE.md`.
3. **Stage 3 (Build)**: Plan mode writes `plans/<id>-<slug>.md` before touching code. Autonomous implementation via Jules (`.jules/`).
4. **Stage 4 (Test)**: Run automated feedback loops and continuous evals via `node evals/check.js`.
5. **Stage 5 (Deploy)**: Automated guardrails in `.github/workflows/jules-automerge.yml` protect sensitive configs, workflows, evals, scripts, and Docker files.
6. **Stage 6 (Maintain)**: Closed-loop maintenance via `node scripts/monitor-breach.js` writing to `intent/`.

## Commands

Frontend (repo root):
- `npm run dev` — Vite on port 3000 (`strictPort`, host `0.0.0.0`)
- `npm run typecheck` — `tsc --noEmit`, covers `src/` only
- `npx vitest run <path>` — single/focused test. Bare `npm test` starts vitest **watch mode**; always add `run`.
- `npm run test:coverage` — what CI runs
- `node evals/check.js` — run AI agent invariant evals (10 core evals)

Backend (`cd backend`):
- `npm run dev` / `npm run build` / `npm start` — `tsx watch` / `tsc` / `node dist/server.js`
- `npm run lint` — eslint (only backend has lint script)
- `npm run typecheck` — `tsc --noEmit`
- `npm test -- tests/unit` — tolerates missing DB locally (warn-and-skip in `tests/setup.ts`); CI runs full suite (`npm run test:coverage`) with Postgres + migrations. `tests/api` + `tests/e2e` strictly require `DATABASE_URL` + `npm run migrate`.
- `npm run migrate` / `migrate:rollback` / `seed` — via `tsx`, need `DATABASE_URL`

Before a PR: frontend `typecheck` + `vitest run`, backend `lint` + `typecheck` + `tests/unit`, and `node evals/check.js`.

## Architecture

- Frontend entry: `src/main.tsx` → `App.tsx` (lazy-loaded routes). Layers: `domain/` + `application/` (business logic/use cases), `infrastructure/` (mock data), `data/store.tsx` (Context+useReducer), `services/api.ts` (fetch client with TTL cache, exponential retry, non-JSON error safety, safe localStorage — invalidate on mutations), `hooks/useAuth.ts`. Full specs: `docs/ARCHITECTURE.md`.
- Backend entry: `src/server.ts` (Express app, routes mount at `/api/<config.apiVersion>/`, default `v1`, override via `API_VERSION`; `/health` and `/metrics` mounted at both root and api version). Layers: `routes/` → `controllers/` → `models/`; cross-cutting in `middleware/` (auth, `security.middleware.ts`, error), `config/`, `utils/`. Lifecycle: graceful shutdown drains pool on `SIGTERM`, `SIGINT`, `unhandledRejection`, `uncaughtException`. Full endpoints: `docs/API.md`.
- Database: PostgreSQL 15 schema, 12 tables. Pool configured with connection, statement, and query timeouts (`statement_timeout: 10000`, `query_timeout: 10000`). Cloud SSL configured. Full schemas: `docs/DATABASE.md`.
- Tests: frontend Vitest+jsdom, `isolate: false` with shared cleanup in `src/test/setup.ts`. Backend Jest+ts-jest with `diagnostics: false` — **type errors never fail tests**, so always run `typecheck` separately.
- Env: copy `.env.example` → `.env` (root: `VITE_API_URL=http://localhost:3000/api/v1`) and `backend/.env.example` → `backend/.env` (`DATABASE_URL` enforced in production). Never commit `.env`.

## Gotchas

- **Port collision:** both Vite dev server and backend default to port 3000. Run one at a time or override `PORT` (backend) — backend `CORS_ORIGIN` defaults to `http://localhost:5173`.
- **Docker Compose:** `docker-compose.yml` runs dev frontend via `Dockerfile.dev` (`5173:3000`) with `VITE_API_URL: http://localhost:3000/api/v1`, and backend on `3000:3000`. Root `Dockerfile` produces a multi-stage Nginx production container on port 80 with SPA fallback routing via `nginx.conf`.
- Vitest `exclude`s `backend/**`, `dist/**`, `tests/e2e/**` — root test runs never touch the backend.
- Backend `tests/setup.ts` truncates tables with `session_replication_role = replica`; needs a Postgres role with permission to do so.
- No frontend lint script; backend eslint warns (not errors) on `any` and unused vars.
- Bilingual UI (en/ar, RTL) — keep new strings in `src/i18n/` translation keys, not hardcoded; safe dictionary fallback with optional chaining (`translations[lang]?.[key]`); project targets WCAG 2.2 AA.

## Hard-earned rules (from `.jules/`)

- Recursive input sanitizers must strip `__proto__`/`constructor`/`prototype` keys (`backend/src/middleware/security.middleware.ts`) — prototype-pollution risk.
- Body parsers (`cookieParser`, `express.json`, `express.urlencoded`) MUST precede `sanitizeInput` in `backend/src/server.ts`, otherwise `req.body` arrives `undefined` and sanitization is bypassed.
- Public `/health` and `/metrics` responses must never include raw `error.message`/DB internals — use generic status only.
- Precompute `Set` lookups outside scoring/filter loops instead of nested `.filter` per item (was `O(N·R·F)` in recommendation scoring).
- Transparent 401 token refresh loops in API client MUST include an `isRetry` guard to prevent infinite recursion on repeated unauthorized errors.
