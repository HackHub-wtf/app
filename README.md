# HackHub

<p align="center">
  <img src="hackhub-app/src/assets/green_banner.svg" alt="HackHub" width="480" />
</p>

<p align="center">
  <img src="https://github.com/HackHub-wtf/app/actions/workflows/ci.yml/badge.svg" alt="CI" />
  <img src="https://codecov.io/gh/HackHub-wtf/app/branch/main/graph/badge.svg" alt="Coverage" />
</p>

Self-hosted hackathon management platform. Runs entirely with `docker compose up` — no cloud accounts required.

Manages the full lifecycle: **registration → team formation → project submission → voting → judging**.

---

## Screenshots

<table>
  <tr>
    <td><img src="hackhub-app/screenshots/user/user_dashboard.png" alt="Dashboard" /></td>
    <td><img src="hackhub-app/screenshots/user/user_hackathons.png" alt="Hackathons" /></td>
  </tr>
  <tr>
    <td><img src="hackhub-app/screenshots/manager/manager_hackathon_detail.png" alt="Hackathon Detail" /></td>
    <td><img src="hackhub-app/screenshots/manager/manager_create_new_hackathon.png" alt="Create Hackathon" /></td>
  </tr>
</table>

---

## Features

- Multi-tenant org management (open/closed visibility, invite-only or self-register)
- Full hackathon lifecycle: draft → open → running → completed
- Team formation — teams are the unit of judging and project submission
- **Panel judging, community voting, or blended mode** (configurable per hackathon with weight slider)
- Final project submissions: PPTX, video, YouTube, GitHub/Bitbucket links
- Judging panel: assign org members as judges per hackathon
- Real-time chat (STOMP/WebSocket), file storage (MinIO), notifications
- PostgreSQL RLS for cross-tenant isolation

### Role model

All authorization lives in the backend. Frontend hides UI elements for UX only.

| Role | How to get it | What they can do |
|------|--------------|-----------------|
| **Admin** | DB seed / bootstrap only | Full platform access — manage all orgs, users, hackathons |
| **Manager** | Admin promotes a user | Create hackathons in their org, invite judges, manage their org's members |
| **Participant** | Public registration | Join hackathons, create/join teams, submit projects, vote |

Detailed permission matrix: [docs/features/features-and-role-access.md](docs/features/features-and-role-access.md)

---

## Quick start

**Prerequisites:** Docker Engine 24+, `openssl`

```bash
# 1. Clone and enter the repo
git clone https://github.com/HackHub-wtf/HackHub-wtf.git
cd HackHub-wtf

# 2. Generate JWT signing keys and write them to .env
cp .env.example .env
./scripts/generate-jwt-keys.sh >> .env

# 3. Start the full stack
docker compose up -d

# 4. Seed development data (admin account + sample hackathon)
make seed

# 5. Open the app
open http://localhost           # React frontend
open http://localhost:8080/swagger-ui/index.html  # API docs
open http://localhost:9001      # MinIO console (hackhub / hackhub_secret)
open http://localhost:5050      # pgAdmin (add service: postgres:5432)
```

Demo accounts (created by `make seed --demo`):

| Email | Password | Role |
|---|---|---|
| admin@hackhub.wtf | Admin1234! | Platform admin |
| manager@hackhub.wtf | Manager1234! | Org manager |
| alice@example.com | Alice1234! | Participant |
| bob@example.com | Bob12345! | Participant |
| carol@example.com | Carol123! | Participant |

Hackathon registration key is printed at the end of `make seed`.

---

## Architecture

```
HackHub-wtf/
├── app/          React 19 + TypeScript + Vite + Mantine frontend
├── api/          Spring Boot 3.3 + Java 21 REST API
├── infra/        Docker Compose configs, Nginx, MinIO init
├── tests/        Playwright E2E tests
├── docs/         ADRs, architecture docs, stories
├── scripts/      Key generation, seed scripts
└── Makefile      Standardised targets (build, test, lint, migrate, seed)
```

### Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Mantine 8 |
| State | Zustand + TanStack Query |
| Backend | Spring Boot 3.3, Java 21, Clean Architecture |
| Auth | JWT RS256 — stateless access token + httpOnly refresh cookie |
| Database | PostgreSQL 16 with Flyway migrations |
| Real-time | Spring WebSocket + STOMP (`@stomp/stompjs`) |
| File storage | MinIO (S3-compatible, Docker-hosted) |
| Container | Docker Compose — single `docker compose up` deploys everything |

### Data flow

```
Browser → React (TanStack Query) → fetch() → Spring Controller
                                              → Application Use Case
                                              → Domain
                                              → JPA Repository → PostgreSQL
```

### Real-time

```
Browser STOMP client ↔ Spring WebSocket /ws
  /topic/team.{id}.chat          — team chat messages
  /topic/hackathon.{id}.updates  — hackathon status events
  /user/queue/notifications       — per-user push
```

See [ADR-0002](docs/architecture/0002-stomp-over-socket-io.md) for the decision.

### Auth flow

```
POST /api/v1/auth/login  →  { accessToken }  +  Set-Cookie: refresh_token (httpOnly)
Authorization: Bearer <accessToken>  on every subsequent request
POST /api/v1/auth/refresh  →  new accessToken  (rotate refresh token)
```

---

## Development

### Run the full stack in Docker

```bash
docker compose up -d          # Postgres, MinIO, API, frontend
make logs service=api         # Tail API logs
```

### Run services locally (hot reload)

```bash
# Infrastructure only
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Backend (Spring Boot hot reload)
cd api && mvn spring-boot:run

# Frontend (Vite dev server)
cd app && npm run dev          # http://localhost:5173
```

### Database

```bash
make migrate          # Run pending Flyway migrations
make migrate-info     # Show migration status
make seed             # Create admin account + sample hackathon
```

### Tests

```bash
make test-api         # 160+ unit tests + JaCoCo ≥60% coverage gate
make test-app         # 20 Vitest frontend tests
make test-e2e         # Playwright E2E (requires make up first)
make test-all         # All three suites
```

Run integration tests with a real Postgres (requires Docker):

```bash
cd api && mvn test -Pintegration
```

### Lint and format

```bash
make lint             # Spotless (Java) + ESLint (TypeScript)
cd api && mvn spotless:apply   # Auto-format Java
cd app && npm run lint         # TypeScript + ESLint
```

---

## API documentation

Swagger UI is served at `/swagger-ui/index.html` when the API is running. All endpoints require a Bearer token except `/api/v1/auth/register`, `/api/v1/auth/login`, and `/api/v1/auth/refresh`.

---

## Production deployment

```bash
# Build images and start in production mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Required environment variables for production:**
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` — RS256 key pair (generate with `scripts/generate-jwt-keys.sh`)
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` — MinIO credentials
- `APP_CORS_ALLOWED_ORIGINS` — comma-separated list of allowed frontend origins

See `.env.example` for a full list.

---

## Architecture decisions

| ADR | Decision | Status |
|---|---|---|
| [ADR-0001](docs/specs/ADR-001-platform-migration.md) | Migrated from Supabase SPA to self-hosted Spring Boot monorepo | Accepted |
| [ADR-0002](docs/architecture/0002-stomp-over-socket-io.md) | STOMP/WebSocket over Socket.io | Accepted |
| [ADR-0003](docs/architecture/0003-minio-for-file-storage.md) | MinIO over Supabase Storage | Accepted |
| [ADR-0004](docs/architecture/0004-judging-modes.md) | Blended panel+community judging with per-hackathon weight | Accepted |

---

## License

AGPLv3 — see [LICENSE](LICENSE)
