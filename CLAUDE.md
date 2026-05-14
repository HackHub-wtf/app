# HackHub

A self-hosted hackathon management platform. Manages the full lifecycle: registration → team formation → idea submission → judging. Designed for on-premise deployment — single `docker compose up` brings the full stack.

## BusinessRepo Structure

```
HackHub-wtf/
├── app/          # Vite + React 19 + TypeScript frontend
├── api/          # Spring Boot 3.3 + Java 21 backend
├── infra/        # Docker Compose, K8s manifests
├── tests/        # Integration tests (TestContainers), E2E (Playwright)
├── docs/         # Architecture, ADRs, runbooks, API specs
├── Makefile      # Standardised targets: build, test, lint, up, down
└── docker-compose.yml
```

Each directory is a bounded concern. No cross-directory imports. CI/CD calls Makefile targets only.

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend framework | React | 19.x | Component UI |
| Frontend language | TypeScript | 5.8.x | Strict mode |
| Build tool | Vite | 7.x | Dev server, production bundle |
| UI library | Mantine | 8.2.x | Components, theming |
| State | Zustand | 5.x | Global client state |
| Forms | React Hook Form + Zod | 7.x / 4.x | Validation |
| Data fetching | TanStack Query | 5.x | Server state cache |
| Routing | React Router | 7.x | Client-side routing |
| Backend | Spring Boot | 3.3.x | REST API, WebSocket, security |
| Backend language | Java | 21 | |
| Database | PostgreSQL | 16 | Primary store |
| ORM | Spring Data JPA + Flyway | — | Schema migrations, queries |
| Auth | Spring Security 6 | JWT RS256 | Stateless access + refresh tokens |
| Real-time | Spring WebSocket (STOMP) | — | Chat, live updates |
| File storage | MinIO | latest | S3-compatible, Docker-hosted |
| Container | Docker Compose | — | Local dev + on-prem deployment |

## Quick Start

```bash
# Bring up the full stack
docker compose up -d

# Frontend only (dev mode)
cd app && npm install && npm run dev

# Backend only (dev mode — requires running Postgres + MinIO)
cd api && mvn spring-boot:run

# Run all tests
make test-all

# Build for production
make build
```

## Architecture Overview

Clean Architecture in `/api`. Dependency flow: `presentation → application → domain ← infrastructure`.

```
api/src/main/java/wtf/hackhub/
├── domain/          # Entities, value objects, domain events — no framework imports
├── application/     # Use cases, ports (interfaces) — one class per use case
├── infrastructure/  # JPA repos, MinIO client, WebSocket config, JWT filter
└── presentation/    # REST controllers, STOMP handlers, DTOs, error mapping
```

Frontend (`/app/src/`) retains existing structure. Supabase SDK removed; all data access goes through Spring REST API.

### Data Flow

```
React component
  → TanStack Query hook
    → fetch() against /api/v1/...
      → Spring controller
        → Application use case
          → Domain logic
            → JPA repository → PostgreSQL
```

Real-time:
```
React STOMP client (sockjs-client + @stomp/stompjs)
  ↔ Spring WebSocket endpoint (/ws)
    → STOMP topic subscriptions per team/hackathon
```

### Auth Flow

```
POST /api/v1/auth/login → { accessToken, refreshToken }
All subsequent requests: Authorization: Bearer <accessToken>
Spring Security JwtAuthFilter → validates RS256 → populates SecurityContext
Refresh: POST /api/v1/auth/refresh → new accessToken
```

## Domain Model

| Entity | Key relationships |
|--------|------------------|
| Organization | has many Members (profiles) |
| Profile | belongs to Organization; roles: admin / manager / participant |
| Hackathon | owned by Organization; statuses: draft → open → running → completed |
| Team | belongs to Hackathon; has TeamMembers (leader / member) |
| Idea | belongs to Hackathon + Team; has Votes, Comments, Scores |
| VotingCriteria | belongs to Hackathon; weighted scoring (weights sum to 100) |
| ChatMessage | belongs to Team |
| Notification | belongs to Profile |

## Makefile Targets

| Target | Description |
|--------|-------------|
| `make up` | docker compose up -d (Postgres + MinIO + app) |
| `make down` | docker compose down |
| `make build` | Build both frontend and backend |
| `make test-all` | Run all test layers (unit, integration, E2E) |
| `make test-api` | Backend unit + integration tests (Maven) |
| `make test-app` | Frontend unit tests (Vitest) |
| `make test-e2e` | Playwright E2E suite |
| `make lint` | ESLint (frontend) + Checkstyle (backend) |
| `make migrate` | Run Flyway migrations |
| `make seed` | Seed development data |

## Environment Variables

### Frontend (`app/.env.local`)
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Spring Boot API base (default: `http://localhost:8080`) |
| `VITE_WS_URL` | WebSocket endpoint (default: `http://localhost:8080/ws`) |
| `VITE_APP_NAME` | Display name |
| `VITE_APP_ENVIRONMENT` | `development` or `production` |

### Backend (`api/src/main/resources/application.yml`)
| Variable | Description |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` / `_PASSWORD` | DB credentials |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | RS256 key pair (PEM) |
| `JWT_ACCESS_TOKEN_EXPIRY` | Access token TTL (default: 900s) |
| `JWT_REFRESH_TOKEN_EXPIRY` | Refresh token TTL (default: 604800s) |
| `MINIO_ENDPOINT` / `_ACCESS_KEY` / `_SECRET_KEY` | MinIO config |
| `MINIO_BUCKET_*` | Bucket names per storage type |

## Deployment

Target: Docker Compose on any Linux host with Docker Engine installed.

```
infra/
├── docker-compose.yml        # Production compose (all services)
├── docker-compose.dev.yml    # Dev overrides (volume mounts, hot reload)
├── postgres/
│   └── init.sql              # DB init (Flyway handles schema)
└── minio/
    └── init.sh               # Bucket creation on first run
```

## Conventions

- Commit messages: imperative, plain English. No "implement", "enhance", "ensure", "leverage".
- Java: constructor injection, no `@Autowired` on fields, one use case per class.
- TypeScript: strict mode, no `any`, explicit return types on all exported functions.
- No cross-layer imports: domain never imports Spring; React components never hit DB directly.
- All schema changes via Flyway versioned migrations in `api/src/main/resources/db/migration/`.

## Skill Usage Guide

| Skill | Invoke When |
|-------|-------------|
| springboot | Spring Boot API, use cases, security, WebSocket handlers |
| postgresql-patterns | Schema design, Flyway migrations, query optimization, RLS |
| docker-patterns | Docker Compose, container config, MinIO setup |
| react | React components, hooks, lifecycle |
| typescript | TypeScript strict mode, type safety |
| mantine | Mantine component library, theming |
| tanstack-query | TanStack Query v5, server state, caching |
| zustand | Zustand stores |
| react-hook-form | Form state, React Hook Form + Zod |
| zod | Zod schemas, runtime validation |
| react-router | React Router v7, routing |
| vite | Vite build config, bundling |
| threat-modeling | STRIDE analysis, trust boundaries |
| mermaid-diagrams | Architecture diagrams |
| tdd-workflow | TDD red-green-refactor cycle |
