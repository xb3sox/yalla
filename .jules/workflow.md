# Jules Operational Workflow

Autonomous coding workflow adhering to the Anthropic AI-Native SDLC Playbook.

---

## 1. Branch Conventions
- Always branch from latest `main`.
- Naming standard: `jules/<issue-id>-<short-description>` (e.g., `jules/issue-42-stripe-webhook`, `jules/sdlc-repo-reorganization`).

---

## 2. SDLC Progression Gateways

1. **Intent Handshake**: Verify an active `intent/<id>-<slug>.md` exists or create one using `intent/TEMPLATE.md`.
2. **Spec Alignment**: For features or schema changes, review `specs/<id>-<slug>.md` to enforce UX, brand, and security invariants.
3. **Plan Mode Execution**: Commit or reference a written plan before editing code.
4. **Implementation**: Smallest complete diff (Ponytail standard). Deletion beats addition.
5. **Pre-PR Quality Gate**:
   - Frontend: `npm run typecheck` + `npx vitest run`
   - Backend: `cd backend && npm run typecheck && npm run lint && npm test -- tests/unit`
   - Agent Invariants: `node evals/check.js`
   - Critic Audit: Verify against `.jules/critic.md`

---

## 3. Persona Invariants
- **Sentinel (`.jules/sentinel.md`)**: No prototype pollution in recursive objects; zero DB leak in health endpoints.
- **Bolt (`.jules/bolt.md`)**: Precompute Sets outside iterative loops ($O(N)$ vs $O(N \cdot M)$).
- **Critic (`.jules/critic.md`)**: Strict zero-gap audit before submitting PRs.
