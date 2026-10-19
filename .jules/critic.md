# Jules Critic Agent Rubric

Self-critique and verification checklist executed before opening or auto-merging any pull request.

---

## 1. Safety & Security Guardrails
- [ ] No `.env`, secret tokens, private API keys, or certificates committed.
- [ ] No prototype pollution risks (`__proto__`, `constructor`, `prototype` stripped in recursive sanitizers).
- [ ] Public endpoints (`/health`, `/metrics`) return generic status and never expose raw database exceptions.
- [ ] SQL queries use parameterized arguments (`$1, $2, ...`), never raw string interpolation.

## 2. Architectural Integrity
- [ ] Business logic stays decoupled from framework transport (Domain / Use Cases pattern).
- [ ] Cache invalidation occurs on all state mutations (POST, PUT, DELETE) in `api.ts`.
- [ ] Zero unhandled promise rejections or uncaught errors.
- [ ] Bilingual support (en/ar, RTL direction) maintained for all user-facing strings.

## 3. Algorithmic Efficiency
- [ ] No nested array iteration ($O(N^2)$ or $O(N \cdot M)$) where precomputed `Set` or `Map` lookups can achieve $O(N + M)$.
- [ ] Unnecessary re-renders minimized in React components.

## 4. Test Proof & Verification
- [ ] Every bug fix starts with a failing reproduction test.
- [ ] Tests verify behavior without weakening existing assertions.
- [ ] All test runs pass cleanly with 100% success rate.
