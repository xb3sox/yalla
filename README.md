# Yalla

**Managed discovery and booking for small-group local experiences.**

[![CI](https://github.com/xb3sox/yalla/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/xb3sox/yalla/actions/workflows/ci-cd.yml)
[![Agent evals](https://github.com/xb3sox/yalla/actions/workflows/agent-evals.yml/badge.svg)](https://github.com/xb3sox/yalla/actions/workflows/agent-evals.yml)
[![Node 20](https://img.shields.io/badge/node-20_LTS-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2_AA-0A7B4F)](https://www.w3.org/TR/WCAG22/)
[![Proprietary](https://img.shields.io/badge/license-proprietary-lightgrey)](#license)

Yalla is an end-to-end managed platform for curated local activities. Unlike open
marketplaces, every host, venue, schedule, and safety policy is vetted by Yalla
before an experience is listed — so guests can book with confidence and hosts can
focus on running great events.

The product is bilingual (English and Arabic with full RTL support), installable
as a PWA, and built to WCAG 2.2 AA.

## Features

- **Discovery** — filter curated experiences by category, city, and date.
- **Booking** — seat reservations, waitlists, and Stripe payment intents.
- **Attendance** — 24-hour reconfirmation and an arrival mode with a protected, rotating venue check-in PIN.
- **Roles** — scoped access for participants, hosts, operations, support, trust & safety, and admin.
- **Feedback** — post-experience ratings that feed host quality control.
- **Localization** — one UI serving Arabic (RTL) and English (LTR).

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 18, Vite 6, TypeScript 5, Tailwind CSS 4, PWA |
| Backend | Node.js 20, Express 4, TypeScript, Zod, JWT in HttpOnly cookies |
| Data | PostgreSQL 15, Redis 7 for rate limiting and cache (optional) |
| Payments | Stripe payment intents and webhooks |
| Testing | Vitest + Testing Library, Jest + Supertest, axe accessibility checks |
| Delivery | GitHub Actions, Docker, Nginx |

## Quick start

**Prerequisites:** Node.js 20 (see `.nvmrc`), npm 9+, and PostgreSQL 15 for the
backend. Docker can supply PostgreSQL and Redis for you.

### 1. Install

```bash
git clone https://github.com/xb3sox/yalla.git
cd yalla
npm ci
npm ci --prefix backend
```

The frontend and backend are two independent npm projects — install and run each separately.

### 2. Configure

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Then set `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` in
`backend/.env`. See [Configuration](#configuration) for the rest.

### 3. Run

```bash
npm run dev                    # frontend → http://localhost:5173
npm run dev --prefix backend   # API       → http://localhost:3000
```

On first run, create the schema and optional demo data:

```bash
npm run migrate --prefix backend
npm run seed --prefix backend
```

### Docker alternative

```bash
docker compose up --build
```

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Adminer (database UI) | http://localhost:8080 |

## Configuration

Variables live in `.env` (frontend, `VITE_` prefix only) and `backend/.env`.
Defaults are documented in [`.env.example`](./.env.example) and
[`backend/.env.example`](./backend/.env.example).

| Variable | File | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `.env` | API base URL, e.g. `http://localhost:3000/api/v1` |
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string (required in production) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | `backend/.env` | Token signing keys — use long random values |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `backend/.env` | Payments and webhook verification |
| `CORS_ORIGIN` | `backend/.env` | Allowed frontend origin |
| `REDIS_URL` | `backend/.env` | Distributed rate limiting and cache (optional) |
| `API_VERSION`, `PORT` | `backend/.env` | Route prefix (default `v1`) and listen port |

> [!NOTE]
> Never commit `.env` files. Production secrets belong in your platform's secret manager.

## Architecture

```mermaid
graph LR
    Client["Browser / PWA<br/>React + Vite"] -->|"REST / JSON"| API["Express API<br/>TypeScript"]
    API -->|"SQL (pooled)"| DB[("PostgreSQL 15")]
    API -->|"Cache & rate limits"| Redis[("Redis 7")]
    API -->|"Payment intents<br/>Webhooks"| Stripe["Stripe"]
```

Both apps follow a layered, dependency-inward design: domain and application
logic stay framework-agnostic, while HTTP, persistence, and third-party
integrations sit at the edges. Reservation state transitions are centralized in
the model layer, and capacity checks run inside atomic, row-locked transactions.

## Project structure

```text
.
├── src/            React app — pages, components, domain, application, services
├── backend/        Express API — routes, controllers, models, middleware, migrations
├── docs/           Architecture, API reference, database spec, ADRs
├── intent/         Problem statements (AI-native SDLC stage 1)
├── specs/          Design specifications (stage 2)
├── plans/          Implementation plans (stage 3)
├── evals/          Automated architectural invariant checks
├── scripts/        Automation and drift-monitoring tooling
└── .github/        CI/CD workflows and issue templates
```

## Commands

| Task | Frontend (root) | Backend |
| --- | --- | --- |
| Dev server | `npm run dev` | `npm run dev --prefix backend` |
| Production build | `npm run build` | `npm run build --prefix backend` |
| Type check | `npm run typecheck` | `npm run typecheck --prefix backend` |
| Lint | — | `npm run lint --prefix backend` |
| Unit tests | `npx vitest run` | `npm test --prefix backend -- tests/unit` |
| Coverage | `npm run test:coverage` | `npm run test:coverage --prefix backend` |
| Invariant evals | `node evals/check.js` | — |

Bare `npm test` starts Vitest in watch mode; use `npx vitest run` for a single pass.
Backend API and end-to-end suites need a live `DATABASE_URL` and an applied schema.

## Continuous integration

| Workflow | Enforces |
| --- | --- |
| [`ci-cd.yml`](./.github/workflows/ci-cd.yml) | Type checks, lint, unit tests, builds, security scan |
| [`agent-evals.yml`](./.github/workflows/agent-evals.yml) | Architectural invariants and regression evals |
| [`jules-automerge.yml`](./.github/workflows/jules-automerge.yml) | Blocks auto-merge when sensitive paths change |

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Clean Architecture, DDD layers, reservation state machine |
| [`docs/API.md`](./docs/API.md) | REST endpoints, payloads, headers, status codes |
| [`docs/DATABASE.md`](./docs/DATABASE.md) | Schema, ER diagram, migrations |
| [`docs/adr/`](./docs/adr/) | Architecture decision records |
| [`AGENTS.md`](./AGENTS.md) | Commands and guardrails for AI coding agents |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Branches, commits, and review standards |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Production deployment guide |
| [`CHANGELOG.md`](./CHANGELOG.md) · [`ROADMAP.md`](./ROADMAP.md) | Release history and planned work |
| [`GLOSSARY.md`](./GLOSSARY.md) | Product domain vocabulary |

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, commit conventions,
and review expectations. Before opening a pull request, run type checks, tests,
and `node evals/check.js`.

AI-assisted and autonomous contributions must follow [AGENTS.md](./AGENTS.md).

## Security

Please report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/xb3sox/yalla/security/advisories/new)
rather than in a public issue.

## License

Proprietary — all rights reserved. No part of this codebase may be copied,
modified, or distributed without written permission.
