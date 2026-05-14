# Definition of Done

> Derived from `project.config.yaml` → `dod.default`. Edit that file to customise
> per-project, then re-run `maple init` or update this file manually.
> `pre-push` hook blocks if this file is missing.

## Standard stories

- [ ] All unit tests pass (`npm test` in `app/`)
- [ ] All integration tests pass (`make test-integration` from repo root)
- [ ] All E2E tests pass (`make test-e2e` from repo root)
- [ ] All Cucumber / Behave scenarios pass
- [ ] `npm run lint` exits 0 (frontend)
- [ ] `make lint` exits 0 (backend + root)
- [ ] `make security-scan` exits 0
- [ ] No console errors or warnings in the browser (for UI work)
- [ ] API contract verified against running Spring Boot instance (for service layer changes)
- [ ] CHANGELOG entry added under `## Unreleased`
- [ ] PR description references the story file and GitHub Issue
- [ ] ADRs written and linked for any required trigger (see `sdlc.require_adr_for`)

## UI stories (additionally, when `ui: true`)

- [ ] Wireframe approved by product owner
- [ ] High-fidelity mockup approved by product owner
- [ ] Design tokens applied (`docs/design/identity/tokens.json`)
- [ ] WCAG AA accessibility audit passed (`a11y-audit` skill output linked in PR)

## Spike stories (`spike/*` branches)

- [ ] Spike document written at `docs/specs/<slug>/spike.md`
- [ ] Key findings summarised for the follow-on story
- [ ] No production code committed (spike branch only)
