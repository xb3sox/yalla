# Pull Request

## What changed

<!-- One or two sentences. Link the intent/spec/plan artifact if one exists. -->

## Related issue

Closes #

## Type

- [ ] Feature
- [ ] Fix
- [ ] Refactor / performance
- [ ] Docs
- [ ] Chore / config

## Verification

Commands run locally (see the [README](../README.md#commands)):

- [ ] `npm run typecheck`
- [ ] `npm run lint:md`
- [ ] `npx vitest run`
- [ ] `npm run typecheck --prefix backend`
- [ ] `npm run lint --prefix backend`
- [ ] `npm test --prefix backend -- tests/unit`
- [ ] `node evals/check.js`

## Review notes

- [ ] Tests added or updated for the behaviour change
- [ ] No secrets, tokens, or `.env` values committed
- [ ] Accessibility and RTL rendering checked for user-facing UI changes
- [ ] No sensitive paths touched (`.github/`, `evals/`, `scripts/`,
      Docker, lockfiles, configs) — if any were, human review is required
