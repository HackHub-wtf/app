# Developer Guide

Everything you need to run HackHub locally and contribute.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker Desktop | 4.x+ | Runs the full stack |
| Java | 21 | Backend development |
| Node.js | 20+ | Frontend development |
| Maven | 3.9 (bundled via `mvnw`) | Backend builds |

## Quick Start (Docker Compose)

```bash
# 1. Clone and enter the repo
git clone https://github.com/HackHub-wtf/app.git && cd app

# 2. Configure environment
cp .env.example .env
./scripts/generate-jwt-keys.sh   # writes JWT_PRIVATE_KEY + JWT_PUBLIC_KEY into .env

# 3. Start the stack
docker compose up -d

# 4. First-run setup (WordPress-style installer)
./scripts/install.sh

# 5. Open the app
open http://localhost
```

## Manual Dev Mode (hot reload)

Requires Postgres + MinIO running:
```bash
docker compose up -d postgres minio
```

**Backend** (port 8080):
```bash
cd hackhub-api
cp src/main/resources/application.yml src/main/resources/application-local.yml
# edit application-local.yml for local DB URL if needed
./mvnw spring-boot:run
```

**Frontend** (port 5173):
```bash
cd hackhub-app
npm install
cp .env.example .env.local
# set VITE_API_BASE_URL=http://localhost:8080
npm run dev
```

## Port Map

| Port | Service |
|------|---------|
| 80 | React app (nginx, production build) |
| 5173 | React app (Vite dev server) |
| 8080 | Spring Boot API |
| 8081 | Spring Boot actuator (health, metrics) |
| 5432 | PostgreSQL |
| 9000 | MinIO S3 API |
| 9001 | MinIO web console |

## Seed Data

```bash
# First-run wizard (creates admin, optional demo data)
./scripts/install.sh --demo

# Dev seed only (adds demo org, hackathon, 5 users)
./scripts/seed-dev.sh

# Full reset (drops all data, restarts stack)
./scripts/reset.sh
```

## Database

Schema managed by Flyway. Migrations in `hackhub-api/src/main/resources/db/migration/`.

On startup the API runs all pending migrations automatically (`spring.flyway.enabled=true`).

Adding a migration:
```bash
# Name format: V{next_number}__{description}.sql
touch hackhub-api/src/main/resources/db/migration/V009__my_change.sql
```

Never modify an existing migration — always add a new one.

## Tests

```bash
# Frontend (Vitest + jsdom)
cd hackhub-app
npm test                     # run all tests
npm run build                # type check + bundle (fails on type errors)

# Backend (JUnit 5 + Mockito, JaCoCo coverage gate at 78%)
cd hackhub-api
./mvnw test -DskipSpotlessCheck          # unit tests
./mvnw verify -DskipSpotlessCheck        # unit + JaCoCo report
./mvnw test -DskipSpotlessCheck -Pintegration   # includes TestContainers IT
```

## CI/CD

GitHub Actions runs on every push to `main` and all PRs:
- `ci.yml` — lint, test, coverage upload to Codecov
- `build.yml` — Docker image build check

See `.github/workflows/` for details.

## Architecture Decisions

See `docs/architecture/` for Mermaid diagrams covering:
- Data model (ERD)
- Auth flow
- Multi-tenancy model
- Real-time (STOMP/WebSocket)
- Hackathon lifecycle state machine

Key decisions:
- **Spring Boot** — Clean Architecture layers, type-safe JPA, built-in security
- **Flyway** — versioned migrations, never ORM-managed schema
- **STOMP over Socket.io** — native Spring WebSocket, no extra server
- **MinIO** — S3-compatible, self-hostable file storage
- **Mantine 8** — comprehensive component library, accessible, Tailwind-compatible theming

## Troubleshooting

**JWT key format errors on startup:**
```bash
./scripts/generate-jwt-keys.sh  # regenerates keys in .env
docker compose restart api
```

**Flyway migration conflict (`Found more than one migration`):**
Check that no two files share the same version number in `db/migration/`.

**CORS errors in browser:**
Verify `APP_CORS_ALLOWED_ORIGINS` in `.env` includes your frontend origin
(e.g. `http://localhost:5173,http://localhost`).

**Port 8080 already in use:**
```bash
lsof -ti:8080 | xargs kill -9
docker compose restart api
```
