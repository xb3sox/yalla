# CLAUDE.md

The canonical repository instructions for all AI coding agents (including Claude Code) live in **[AGENTS.md](./AGENTS.md)**. Read that file first — it is the single source of truth for:

- Product context and architecture (frontend at repo root, API in `backend/`)
- AI-native SDLC stages (`intent/ → specs/ → plans/ → code + tests/evals`)
- Exact build/test/lint/typecheck commands
- Conventions, gotchas, and agent guardrails

Do **not** duplicate AGENTS.md content here. If a rule changes, change it in `AGENTS.md` only.

## Claude Code-specific notes

- `npm test` runs the frontend suite once; use `npm run test:watch` for watch mode.
- Before finishing any task, run the pre-PR checks listed in AGENTS.md "Commands".
- Never commit build output (`dist/`, `coverage/`) or `.env` files; they are gitignored.
