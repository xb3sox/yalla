# Contributing to Yalla

Guidelines for human contributors and autonomous AI agents contributing to Yalla.

---

## 1. Getting Started

### Prerequisites
- Node.js 20.x
- npm 9.x+
- Git

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd yalla

# Install frontend dependencies (root)
npm ci

# Install backend dependencies
cd backend && npm ci && cd ..

# Setup environments
cp .env.example .env
cp backend/.env.example backend/.env
```

---

## 2. Branch & Commit Conventions

### Branch Naming
- Features: `feature/<short-description>`
- Bug Fixes: `fix/<short-description>`
- Autonomous Agents (Jules): `jules/<issue-id>-<short-description>` (e.g. `jules/issue-14-stripe-webhook`)
- Documentation: `docs/<short-description>`

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:
```
feat(booking): implement dynamic check-in PIN generation
fix(security): strip prototype pollution keys in recursive sanitization
perf(recommendations): precompute lookup Sets outside scoring loop
test(auth): add unit tests for refresh token cookie verification
docs(sdlc): update stage 2 specification template
```

---

## 3. AI-Native SDLC Gateways

All significant changes follow the Anthropic AI-Native SDLC lifecycle:
1. **Plan**: Feature or task initiated in `intent/<id>-<slug>.md`.
2. **Design**: Technical spec created in `specs/<id>-<slug>.md`.
3. **Build**: Plan approved in `plans/<id>-<slug>.md` prior to code modifications.
4. **Test**: All test gates pass locally.
5. **Deploy**: Safe pull requests reviewed against `.jules/critic.md` rubric.

---

## 4. Pre-PR Quality Checklist

Before submitting a pull request, run all verification targets:

```bash
# 1. Frontend verification
npm run typecheck
npx vitest run

# 2. Backend verification
cd backend
npm run typecheck
npm run lint
npm test -- tests/unit
cd ..

# 3. Agent evals
node evals/check.js
```

Ensure:
- Zero TypeScript compiler errors.
- Zero ESLint errors.
- All unit and invariant test suites pass with 100% success rate.
- No sensitive configuration files (`.env`, private keys) are modified or committed.
- Any bug fix is accompanied by a reproduction test verifying the resolution.
