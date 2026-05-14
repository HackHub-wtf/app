# Contributing to HackHub

HackHub is open source under the GNU Affero General Public License v3. Contributions
are welcome — code, docs, bug reports, and feature ideas all count.

## Before You Start

- Check [open issues](https://github.com/HackHub-wtf/app/issues) for existing work
- For large changes, open an issue first to discuss the approach
- By contributing you agree your work is licensed under AGPLv3

## Local Setup

See **[DEV.md](./DEV.md)** for the full developer setup guide.

Quick start:
```bash
git clone https://github.com/HackHub-wtf/app.git
cd app
cp .env.example .env
./scripts/generate-jwt-keys.sh   # populates .env with JWT keys
docker compose up -d
./scripts/install.sh --demo      # first-run wizard
```

## Repo Structure

```
app/
├── hackhub-app/   React 19 + TypeScript frontend
├── hackhub-api/   Spring Boot 3.3 backend
├── docs/          Architecture docs and ADRs
├── infra/         Postgres init, MinIO init, nginx config
├── scripts/       install.sh, seed-dev.sh, reset.sh
└── tests/         E2E Playwright + integration tests
```

## Branching

- Branch from `main`
- Name: `feature/short-description`, `fix/issue-number`, `docs/topic`
- Keep branches focused — one concern per PR

## Commit Messages

Plain imperative English. No buzzwords.

```
# Good
add org invitation token endpoint
fix dashboard stats showing zero after page load
drop hardcoded demo credentials from login page

# Bad
implement enhanced organization invitation feature
ensure proper column grouping to improve clarity
leverage best practices for token validation
```

Banned words: implement, enhance, ensure, leverage, utilize, facilitate.

## Pull Request Requirements

- `npx tsc --noEmit` passes (zero type errors)
- `npm test` passes in `hackhub-app/`
- `./mvnw test` passes in `hackhub-api/`
- No `Co-Authored-By:` lines in commits
- Update relevant docs if behavior changes

## Testing

```bash
# Frontend
cd hackhub-app && npm test
cd hackhub-app && npm run build   # type check + bundle

# Backend
cd hackhub-api && ./mvnw test -DskipSpotlessCheck
cd hackhub-api && ./mvnw verify   # includes JaCoCo coverage gate
```

## Reporting Bugs

Open a GitHub issue with:
- Steps to reproduce
- Expected vs actual behavior
- Version / environment
- Logs if relevant

## Questions

Open a GitHub Discussion or email kinncj@gmail.com.
