# 008 — Full Repo Audit & Cleanup

Goal: evidence-based audit; fix real defects, remove dead weight, no mass refactors.

## Steps

1. Baseline: typecheck, lint, unit tests, builds, `evals/check.js` (FE+BE).
2. Security: `npm audit`, Semgrep (p/owasp-top-ten, p/typescript, p/secrets),
   Gitleaks (working tree + history), Trivy fs (if obtainable), manual auth/
   payment/SQL/CORS/headers review.
3. Deps/hygiene: `npm outdated`, Knip (dead files/deps/exports), duplicate/dead
   code grep, Docker/nginx/compose, CI workflows (pinning, permissions), docs drift.
4. Manual review: server.ts, auth/payment/reservation, api.ts, store, migrations.
5. Fix P0/P1 + safe cleanup; P2/P3 logged in `docs/AUDIT-2026-10-28.md`.
6. Re-run all gates; commit to session branch; PR.

## Rules

- No breaking API/DB changes without migration + test.
- Every fix verified by a gate; unverifiable findings reported, not "fixed".
- Ultra-concise reporting.
