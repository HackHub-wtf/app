---
adr: "0001"
title: "Platform Migration — Supabase SPA to Self-Hosted Spring Boot Monorepo"
status: accepted
date: "2026-05-12"
implemented: "2026-05-13"
supersedes: null
superseded_by: null
deciders:
  - Engineering Lead
  - Backend Lead
  - Frontend Lead
  - Infrastructure Lead
---

# ADR-0001 — Platform Migration: Supabase SPA to Self-Hosted Spring Boot Monorepo

## 1. Context

HackHub is currently a single-page application deployed on Cloudflare Pages. The backend is entirely provided by Supabase (PostgreSQL, Auth, Realtime, Storage). Business logic is distributed across the frontend: service classes in `src/services/`, RLS policies on the database, and the Supabase anon key is embedded in the browser bundle.

**Forcing conditions:**

- The Supabase free tier is exhausted. Paid Supabase tiers cost $25–$599/month depending on usage, with no path to on-premise hosting that preserves the same developer experience.
- All database queries execute client-side via the Supabase JS SDK with an anon key. Row-Level Security is the only enforcement layer; any policy misconfiguration exposes data directly to the internet.
- The platform must be deployable on-premise for enterprise and self-hosted customers. Supabase's self-hosted offering requires managing multiple Docker services (GoTrue, PostgREST, Realtime, Storage, Kong) — operational complexity without corresponding control.
- Socket.io is in use for real-time chat, but the Supabase Realtime channel runs in parallel for database subscriptions. Two real-time transports with overlapping responsibilities create maintenance surface.
- There is no API layer. Adding rate limiting, request validation, audit logging, or server-side authorization requires either abusing Supabase Edge Functions or bolting on a separate service.

**What this ADR decides:** replace the Supabase backend with a Spring Boot 3.x API, adopt a BusinessRepo monorepo layout, move all business logic server-side, and migrate storage to MinIO. The React frontend is retained unchanged in structure.

---

## 2. Goals / Non-Goals

**Goals:**

- Eliminate Supabase as a runtime dependency. No calls from the browser to Supabase endpoints in production.
- Provide a fully self-hosted deployment path: `docker compose up` brings the entire stack.
- Move all business logic and authorization enforcement to the API layer. The database is not accessible from the browser.
- Replace the anon-key client pattern with stateless JWT (access + refresh) issued by the Spring Security layer.
- Unify real-time transport to Spring WebSocket (STOMP), removing the Socket.io server.
- Establish a BusinessRepo structure: one repository, bounded domains, no cross-domain coupling, Clean Architecture enforced per layer.
- Produce reproducible database schema management via Flyway versioned migrations.
- Reduce monthly infrastructure cost to near-zero for self-hosted deployments.

**Non-Goals:**

- Rewriting the React frontend component structure. Pages, hooks, and Zustand stores are retained; only the data-fetching and WebSocket transport layers change.
- Implementing multi-tenancy or SaaS billing in this migration. That is a separate initiative.
- Migrating to a different frontend framework or build tool.
- Adding a Redis caching layer. Deferred until load testing demonstrates the need.
- OAuth social login providers beyond what Spring Security OAuth2 supports out of the box. Social login is a follow-on ADR.
- Kubernetes deployment manifests. Docker Compose covers the initial target environment.

---

## 3. Proposal

### 3.1 Repository Structure (BusinessRepo)

```
hackhub/
  /app          — Vite + React 19 + TypeScript (unchanged component structure)
  /api          — Spring Boot 3.3 backend (Clean Architecture)
  /infra        — Docker Compose, environment templates
  /tests        — Integration tests (TestContainers) + E2E (Playwright)
  /docs         — Architecture docs, runbooks, OpenAPI specs
  Makefile      — Standardized CI/CD targets
  docker-compose.yml
```

**BusinessRepo enforcement rules that apply here:**

- `/api` owns the `hackhub` domain. No other module imports its domain model.
- `/app` communicates with `/api` via HTTP REST and STOMP WebSocket only. No shared types package at this stage; OpenAPI-generated TypeScript client is the contract boundary.
- `/infra` contains no business logic. It wires services together.
- `/tests` depends on published contracts (OpenAPI, event schemas), not on internal implementation.

### 3.2 Backend: Spring Boot 3.3 + Java 21

**Technology versions:**

| Component | Version | Justification |
|---|---|---|
| Java | 21 (LTS) | Virtual threads (Project Loom) available; supported until 2031 |
| Spring Boot | 3.3.x | Spring Framework 6.1, native compilation support, WebSocket 6.x |
| Spring Security | 6.3.x | Bundled with Boot 3.3; OAuth2 Resource Server, JWT support |
| Spring Data JPA | 3.3.x | Bundled; JPA for typed queries, raw JDBC for bulk operations |
| PostgreSQL JDBC | 42.7.x | Direct connection; no connection pool abstraction needed at this scale |
| HikariCP | 5.1.x | Bundled with Boot; connection pool |
| Flyway | 10.x | Schema versioning; SQL-first migrations |
| Spring WebSocket | 6.1.x | STOMP broker relay or in-memory broker |
| MinIO Java SDK | 8.5.x | S3-compatible; same API surface as AWS S3 if cloud migration needed |
| SpringDoc OpenAPI | 2.5.x | OpenAPI 3.1 spec generation from annotations |
| Testcontainers | 1.19.x | PostgreSQL + MinIO containers for integration tests |

**Clean Architecture layer mapping:**

```
/api
  /domain
    /model          — Entities, value objects, domain events (no framework imports)
    /repository     — Repository interfaces (ports)
    /service        — Domain services
  /application
    /usecase        — Use case interactors (one class per use case)
    /port
      /in           — Input port interfaces (command/query)
      /out          — Output port interfaces (delegates to infra)
  /infrastructure
    /persistence    — JPA entities, Spring Data repositories, Flyway
    /messaging      — WebSocket event publishers
    /storage        — MinIO adapter
    /security       — JWT filter, UserDetailsService impl
  /presentation
    /rest           — @RestController classes (thin; delegate to use cases)
    /websocket      — @MessageMapping handlers
    /dto            — Request/response DTOs, MapStruct mappers
```

**SOLID compliance:**

- **SRP:** Each use case class handles exactly one operation. `CreateTeamUseCase` does not also handle member addition.
- **OCP:** New resource types extend via new use case classes and new controller endpoints. Existing classes are not modified.
- **LSP:** Repository interfaces define contracts; JPA and JDBC implementations honor those contracts without covariant return changes.
- **ISP:** Separate `TeamReadPort` and `TeamWritePort` interfaces. Controllers that only read teams do not depend on write operations.
- **DIP:** Domain and application layers depend on port interfaces. Infrastructure implementations are injected by Spring's DI container. No `import org.springframework` in domain classes.

### 3.3 Authentication: Spring Security 6 with Stateless JWT

**Token design:**

- Access token: JWT, RS256, 15-minute expiry. Claims: `sub` (user UUID), `email`, `roles` (array: `ADMIN`, `MANAGER`, `PARTICIPANT`), `org_id`.
- Refresh token: opaque UUID stored in `refresh_tokens` table, 7-day expiry, single-use with rotation.
- No session state on the server. `SecurityContextHolder` populated per-request from the JWT filter.

**RBAC enforcement:**

- Method-level `@PreAuthorize` annotations on use case classes, not on controllers.
- Database-level: PostgreSQL RLS policies remain as defense-in-depth, enforced via a `SET app.current_user_id` session variable set by the JDBC connection before each query.
- Role hierarchy: `ADMIN > MANAGER > PARTICIPANT`.

**Endpoints:**

```
POST /api/auth/login          — credentials → access + refresh tokens
POST /api/auth/refresh        — refresh token → new access + refresh tokens
POST /api/auth/logout         — invalidates refresh token
POST /api/auth/register       — creates profile + participant role
```

### 3.4 Real-time: Spring WebSocket (STOMP)

Replace Socket.io server and Supabase Realtime with a single STOMP broker.

**Connection flow:**

1. Client connects to `ws://api/ws` with `Authorization: Bearer <access_token>` in the STOMP `CONNECT` frame.
2. Spring Security validates the JWT in `ChannelInterceptor` before the CONNECT is accepted.
3. Client subscribes to `/topic/hackathon/{id}`, `/topic/team/{id}`, `/user/queue/notifications`.
4. Server publishes to these destinations via `SimpMessagingTemplate`.

**In-memory broker** is sufficient for single-node deployment. If horizontal scaling is required later, a RabbitMQ relay is a configuration change, not a code change.

**Frontend changes:** replace Socket.io client with `@stomp/stompjs`. The `RealtimeContext` wraps the STOMP client with the same interface contract the components currently consume.

### 3.5 File Storage: MinIO

MinIO runs as a Docker service. The Spring backend uses the MinIO Java SDK (S3-compatible API).

**Upload flow:**

1. Client sends multipart POST to `/api/files/upload` with JWT.
2. `FileUploadUseCase` validates: MIME type allowlist (image/*, application/pdf, application/zip), max size 50 MB, virus scan stub (toggleable).
3. Backend streams directly to MinIO. Presigned URL is returned for subsequent reads.
4. File metadata (bucket, object key, uploader, hackathon context) stored in `file_attachments` table.

No client-side direct-to-storage uploads. All uploads are proxied through the API.

### 3.6 Database: PostgreSQL with Flyway

**Flyway migration strategy:**

- Baseline migration `V1__baseline_schema.sql` captures the current Supabase schema verbatim. This is generated from `pg_dump --schema-only` of the production database before cutover.
- Subsequent migrations follow `V{n}__{description}.sql` naming.
- No `R__` repeatable migrations in production. Repeatable scripts are restricted to local seed data (`db/seed/`).
- `flyway.outOfOrder=false` enforced. Migrations applied in strict version order.
- Schema changes requiring zero-downtime (adding nullable columns, new indexes `CONCURRENTLY`) are split across two migrations: one to add, one to enforce the constraint.
- Flyway baseline is run once against an existing database; all subsequent environments apply migrations from V1.

**Connection pool:** HikariCP with `maximumPoolSize=20`, `connectionTimeout=3000ms`, `idleTimeout=600000ms`.

**ORM policy:** Spring Data JPA for standard CRUD and relationships. Raw `JdbcTemplate` or `NamedParameterJdbcTemplate` for bulk inserts, reporting queries, and any query where JPA generates cartesian products.

### 3.7 Docker Compose (Local + On-Premise)

```yaml
services:
  db:        postgres:16-alpine
  api:       hackhub/api:latest   (port 8080)
  app:       hackhub/app:latest   (port 5173 dev, Nginx in prod)
  minio:     minio/minio:latest   (port 9000, console 9001)
```

**Makefile targets:**

```
make dev          — docker compose up with hot reload
make build        — build all images
make test         — run unit + integration tests
make migrate      — run Flyway migrations against configured DB
make seed         — apply seed data (dev only)
make lint         — ESLint (app) + Checkstyle (api)
make spec         — generate OpenAPI spec from running API container
```

### 3.8 Frontend Changes (Minimal)

The component tree, Mantine UI, Zustand stores, and React Query usage are unchanged. Changes are isolated to:

1. `src/lib/supabase.ts` — removed. Replace with `src/lib/apiClient.ts` (Axios instance with JWT interceptor and refresh logic).
2. `src/contexts/RealtimeContext.tsx` — swap Socket.io client for `@stomp/stompjs`. Interface contract unchanged.
3. `src/store/authStore.ts` — replace Supabase auth calls with `POST /api/auth/*` endpoints.
4. `src/services/*.ts` — replace `supabase.from(...).select(...)` calls with React Query `queryFn` calls to REST endpoints.
5. Environment variables: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` replaced by `VITE_API_BASE_URL`.

No new build tooling. No new state management library. No component rewrites.

---

## 4. Alternatives Considered

| Option | Pros | Cons | Why Rejected |
|---|---|---|---|
| Supabase Pro ($25/mo) | Zero migration effort; known operational model | Vendor lock-in continues; no on-premise path; DB logic stays client-side; security posture unchanged | Does not address on-premise requirement or security posture |
| Supabase self-hosted (Docker) | Familiar API; no frontend changes | Requires managing GoTrue + PostgREST + Realtime + Storage + Kong — 5 services for what 1 Spring Boot jar provides; limited configurability; still exposes anon key pattern | Operational complexity exceeds benefit; security model unchanged |
| Node.js / Express backend | Frontend team knows JavaScript; single language | Weaker typing guarantees in runtime; no mature enterprise security framework; Spring Security's JWT + RBAC support is significantly more complete | Language consistency is not a sufficient reason to accept a weaker security and architecture foundation |
| Hasura (GraphQL) | Auto-generated API from schema; real-time built in | GraphQL over-fetching risk; still requires a sidecar for business logic; vendor dependency; no on-premise path without Hasura Enterprise | Adds a new abstraction layer without solving the business-logic-server-side requirement |
| NestJS backend | TypeScript consistency; decorator-based DI; good ecosystem | Slower startup than Spring; weaker JWT/OAuth2 support out of the box; fewer engineers with production NestJS experience on team | Spring Security 6 + Java 21 provides a more battle-tested security foundation for this use case |
| Retain Socket.io, add Spring REST only | Incremental; frontend real-time code unchanged | Two backend languages (Node socket server + JVM API); coordinated deploy requirement; violates BusinessRepo single-owner principle | Cross-technology coordination for a single domain violates BusinessRepo rules |

---

## 5. Trade-offs and Risks

### 5.1 Migration Complexity

**Risk:** Supabase RLS policies are the current authorization layer. Moving to server-side enforcement requires auditing every policy and translating it to `@PreAuthorize` annotations plus JDBC session variables. Any gap is a privilege escalation vulnerability.

**Mitigation:** Retain RLS policies on the database as defense-in-depth during and after migration. They are not removed in Phase 1. The API layer becomes the primary enforcement; RLS is the backstop.

**Risk:** The Supabase JS client is used in 7+ service files with direct query construction. Each query must be mapped to a REST endpoint. If any query is missed during migration, that feature silently breaks.

**Mitigation:** Feature flag the API client swap. Both `supabase.ts` and `apiClient.ts` can coexist during migration. A build-time lint rule flags any remaining `supabase` imports after the cutover date.

### 5.2 Operational Shift

**Risk:** The team has zero operational experience with Spring Boot in production. JVM tuning, GC behavior under load, heap sizing, and thread pool configuration are not in the current on-call runbook.

**Mitigation:** Java 21 virtual threads (`--enable-preview` not needed; GA in 21) reduce the need for manual thread pool tuning for I/O-bound workloads. Start with conservative defaults: `-Xms512m -Xmx1g`, G1GC. Add JVM metrics to Prometheus from day one.

**Risk:** Flyway migrations are irreversible in production. A bad migration requires a restore from backup.

**Mitigation:** All migrations tested against a Testcontainers PostgreSQL instance in CI before merge. Migrations that require data transformation are preceded by a backup step in the deployment runbook. `flyway repair` procedure documented.

### 5.3 STRIDE Threat Analysis

**Trust boundaries in the new architecture:**

1. Internet → Nginx (TLS termination)
2. Nginx → Spring Boot API (internal network)
3. Spring Boot API → PostgreSQL (internal network, authenticated)
4. Spring Boot API → MinIO (internal network, service credentials)
5. Browser → Spring WebSocket (STOMP over WSS, JWT in CONNECT frame)

#### API Layer

**S — Spoofing**
- Risk: Forged JWT tokens if the signing key leaks. Likelihood: Low. Impact: Critical.
- Mitigation: RS256 (asymmetric); private key in Docker secret / environment variable, never in code or image. Key rotation procedure in runbook. Short access token expiry (15 min).

**T — Tampering**
- Risk: JWT payload modification. Likelihood: Low (RS256 signature). Impact: High.
- Mitigation: RS256 signature validation on every request. Any tampered token fails signature check and returns 401.
- Risk: SQL injection via malformed request payloads. Likelihood: Medium (new API surface). Impact: Critical.
- Mitigation: Spring Data JPA uses parameterized queries by default. All `JdbcTemplate` usage uses named parameters. Input validation via Jakarta Bean Validation (`@Valid`) on all DTOs. Zod validation retained on the frontend as a first-pass filter.

**R — Repudiation**
- Risk: Users deny performing destructive actions (deleting ideas, modifying votes). Likelihood: Medium. Impact: Medium.
- Mitigation: Structured audit log table (`audit_events`: actor_id, action, resource_type, resource_id, timestamp, ip_address). Written in a separate transaction to prevent rollback from erasing the record. Log shipped to append-only storage.

**I — Information Disclosure**
- Risk: Spring Boot actuator endpoints expose heap dumps, environment variables, or internal metrics to the internet. Likelihood: High (default actuator config). Impact: Critical.
- Mitigation: Actuator restricted to internal network only (`management.server.port=8081`, not exposed via Nginx). Only `/health` and `/prometheus` endpoints enabled.
- Risk: Stack traces returned in API error responses. Likelihood: High without explicit configuration. Impact: Medium.
- Mitigation: Global `@ControllerAdvice` exception handler returns RFC 7807 Problem Details with no stack trace in production. `spring.mvc.problemdetails.enabled=true`.
- Risk: The database is unreachable from the browser (unlike current Supabase model). This eliminates the entire class of "client queries the DB directly" information disclosure.

**D — Denial of Service**
- Risk: Large file uploads exhaust API memory or disk. Likelihood: Medium. Impact: High.
- Mitigation: `spring.servlet.multipart.max-file-size=50MB`, `max-request-size=52MB`. Files streamed to MinIO, not held in memory. Rate limiting on `/api/files/upload`: 10 requests/minute per user (Spring's `@RateLimiter` or Resilience4j).
- Risk: WebSocket connection exhaustion. Likelihood: Low. Impact: High.
- Mitigation: Connection limit per authenticated user (1 active STOMP connection). Unauthenticated STOMP connections rejected immediately in `ChannelInterceptor`.

**E — Elevation of Privilege**
- Risk: A `PARTICIPANT` user calls an endpoint that requires `MANAGER` role by guessing the URL. Likelihood: Medium. Impact: High.
- Mitigation: `@PreAuthorize("hasRole('MANAGER')")` on all write use cases. Spring Security denies access before the use case executes. RLS on the database denies the query even if the API check is bypassed. Defense-in-depth.
- Risk: Refresh token theft allows session hijacking beyond the 15-minute access token window. Likelihood: Low. Impact: High.
- Mitigation: Refresh tokens are single-use with rotation. Theft detection: if a consumed refresh token is presented again, all sessions for that user are invalidated immediately.

#### WebSocket Layer

**S — Spoofing**
- Risk: Unauthenticated STOMP connection subscribes to private team channels. Likelihood: Medium. Impact: High.
- Mitigation: JWT validated in `ChannelInterceptor.preSend()` on every CONNECT frame. Subscription destination validated against the authenticated user's team memberships.

**T — Tampering**
- Risk: Client sends a STOMP message to a destination it is not authorized to publish to. Likelihood: Medium. Impact: Medium.
- Mitigation: `@PreAuthorize` on `@MessageMapping` handlers. Server-side destination validation before any message is forwarded.

#### MinIO / File Storage

**I — Information Disclosure**
- Risk: Presigned URLs shared or guessed, exposing private files. Likelihood: Low. Impact: Medium.
- Mitigation: Presigned URLs expire in 1 hour. Bucket policy set to private (no public access). File metadata in DB associates each file with a hackathon; API validates the requesting user belongs to that hackathon before generating the presigned URL.

**E — Elevation of Privilege**
- Risk: MIME type spoofing allows upload of a `.exe` disguised as `.png`. Likelihood: Medium. Impact: High.
- Mitigation: Server-side MIME sniffing (`Apache Tika`) in addition to declared Content-Type. File extension allowlist enforced independently. Files stored with random UUIDs as object keys, not original filenames.

### 5.4 Second-Order Effects

- **Java on the team:** If the current team is TypeScript-only, hiring or upskilling is required. This is the most significant organizational risk.
- **Two-language monorepo:** JavaScript toolchain (`node_modules`, ESLint, Vite) and JVM toolchain (`mvnw`, Checkstyle, JaCoCo) in the same repo. The Makefile abstracts this but CI pipeline complexity doubles.
- **Flyway lock contention:** Flyway acquires a table lock on startup. Multiple API replicas starting simultaneously will queue on the Flyway migration lock. Only one replica should run migrations; others wait. This is a deployment sequencing requirement.
- **TestContainers in CI:** PostgreSQL + MinIO containers in CI add 30–60 seconds to build time. This is acceptable given the reduction in production incidents from integration-tested migrations.

---

## 6. Impact

**FinOps:**

Current state: Supabase Pro ($25–$599/month depending on tier) + Cloudflare Pages (free for static).

Target state (self-hosted, single VM):
- PostgreSQL: included in Docker Compose, no additional cost.
- MinIO: open-source, self-hosted. Storage cost is the host VM's disk.
- Spring Boot API: runs on the same VM as the database for small deployments.
- Minimum viable VM: 2 vCPU, 4 GB RAM (~$20/month on any cloud provider, or $0 on-premise).
- Total monthly cost for self-hosted: VM cost only ($0–$40 depending on host).

Cloud deployment (if chosen): A single 2-core / 4 GB instance running all Docker Compose services costs ~$30–50/month on a mid-tier cloud provider — comparable to or cheaper than Supabase Pro, with full control.

Scaling cost driver: PostgreSQL connection count. HikariCP pool of 20 connections is sufficient for hundreds of concurrent users. Beyond that, PgBouncer is added as a Docker service — a configuration change, not a re-architecture.

**SRE:**

- **Failure modes:** Database down → API returns 503. MinIO down → file operations fail, rest of platform functional. WebSocket broker down → real-time updates stop, REST API continues.
- **Blast radius:** A JVM OOM crash takes down the API. Frontend degrades gracefully if the API is unreachable (React Query retry + offline indicators). Database remains intact.
- **Observability:** Spring Boot Actuator + Micrometer → Prometheus → Grafana. Minimum dashboards: JVM heap, HTTP request rate/latency/error rate, DB connection pool utilization, active WebSocket sessions.
- **Recovery procedure:** `docker compose restart api` for crash recovery. Database recovery: PostgreSQL streaming replication (one replica) + daily `pg_dump` to off-site storage. Documented RTO: < 5 minutes for API restart; < 30 minutes for database restore from backup.
- **Runbooks required:** JVM heap dump analysis, Flyway repair procedure, MinIO disk full response, JWT key rotation, refresh token invalidation (user compromise).

**Security:**

- Eliminates the browser-accessible Supabase anon key. This removes the largest current attack surface.
- RLS policies are retained as defense-in-depth but are no longer the primary authorization layer.
- JWT RS256 signing keys require a secrets management procedure. Docker secrets or environment variable injection from a vault; never baked into the image.
- Attack surface increases by: adding an HTTP API (mitigated by OWASP controls), adding a WebSocket endpoint (mitigated by JWT channel interceptor), adding MinIO presigned URL generation (mitigated by expiry and authorization checks).

**Team:**

- Requires at least one engineer with production Spring Boot / Java 21 experience to own the `/api` module.
- Frontend team changes are minimal; React Query query functions change their target from Supabase to REST endpoints. TypeScript types change but the pattern does not.
- New on-call scope: JVM process monitoring, Docker Compose service health, Flyway migration state. Training required before go-live.
- Skill gap: Java 21 virtual threads, Spring Security filter chain configuration, Flyway migration authoring. Plan for 1 sprint of ramp-up before parallel development begins.

---

## 7. Decision

The platform migrates from the Supabase-backed SPA model to a self-hosted Spring Boot 3.3 / Java 21 backend using a BusinessRepo structure. The primary driver is the exhaustion of the Supabase free tier and the requirement for on-premise deployability, which Supabase cannot satisfy without managing five separate services. The secondary driver is security: moving business logic and all database access server-side eliminates the anon-key exposure that currently makes database access controls a frontend concern. The React frontend is retained structurally; only the data transport layer changes. Flyway manages schema evolution. MinIO replaces Supabase Storage. Spring WebSocket (STOMP) replaces the dual Socket.io + Supabase Realtime transport. The migration is phased to allow the existing system to remain in production while the new backend is validated.

Status: **proposed**

---

## 8. Next Steps

### Phase 1 — Foundation (Weeks 1–3)

- [ ] **Infra Lead:** Create `hackhub/` BusinessRepo. Move `HackHub-wtf/app/` to `hackhub/app/`. Initialize `hackhub/api/`, `hackhub/infra/`, `hackhub/tests/`, `hackhub/docs/`. Write root `Makefile` with `dev`, `build`, `test`, `migrate`, `lint` targets.
- [ ] **Backend Lead:** Scaffold Spring Boot 3.3 project with Clean Architecture directory structure. Configure Spring Security 6 with RS256 JWT filter. Implement `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/register`.
- [ ] **Infra Lead:** Write `docker-compose.yml` with PostgreSQL 16, MinIO, and the API service. Verify `docker compose up` reaches a healthy state.
- [ ] **Backend Lead:** Generate `V1__baseline_schema.sql` from current Supabase production schema via `pg_dump`. Apply via Flyway. Verify all tables and indexes are created correctly.
- [ ] **Backend Lead:** Configure Spring Boot Actuator + Micrometer. Expose `/actuator/health` and `/actuator/prometheus` on management port only. Wire to a local Prometheus + Grafana Compose service.

### Phase 2 — Core Domain API (Weeks 4–7)

- [ ] **Backend Lead:** Implement domain model: `Organization`, `Profile`, `Hackathon`, `Team`, `TeamMember`, `Idea`, `IdeaVote`, `Comment`, `VotingCriteria`. Map to JPA entities. Write repository interfaces and Spring Data implementations.
- [ ] **Backend Lead:** Implement use cases and REST endpoints for: Organizations, Profiles, Hackathons (CRUD + state transitions), Teams (CRUD + member management). Apply `@PreAuthorize` on all write operations. Write integration tests with Testcontainers.
- [ ] **Backend Lead:** Implement use cases and REST endpoints for: Ideas, Votes, Comments, VotingCriteria, Notifications. Integration tests for each.
- [ ] **Backend Lead:** Implement file upload endpoint. Integrate MinIO Java SDK. Enforce MIME type validation via Apache Tika. Return presigned read URLs.
- [ ] **Backend Lead:** Generate OpenAPI 3.1 spec via SpringDoc. Commit to `hackhub/docs/openapi.yaml`. This is the frontend contract.

### Phase 3 — Real-time Migration (Week 8)

- [ ] **Backend Lead:** Configure Spring WebSocket with STOMP. Implement `ChannelInterceptor` for JWT validation on CONNECT. Define topic destinations: `/topic/hackathon/{id}`, `/topic/team/{id}`, `/user/queue/notifications`.
- [ ] **Frontend Lead:** Replace `@stomp/stompjs` for Socket.io client in `RealtimeContext.tsx`. Keep the same interface contract (emit, on, subscribe). Update frontend auth flow: `authStore.ts` calls `/api/auth/*` instead of Supabase auth.

### Phase 4 — Frontend Data Layer Migration (Weeks 9–11)

- [ ] **Frontend Lead:** Implement `src/lib/apiClient.ts`: Axios instance with JWT access token in `Authorization` header and automatic refresh on 401.
- [ ] **Frontend Lead:** Migrate `src/services/teamService.ts`, `ideaService.ts`, `chatService.ts`, `fileService.ts`, `notificationService.ts` from Supabase SDK calls to REST endpoint calls using the OpenAPI-generated TypeScript client.
- [ ] **Frontend Lead:** Add ESLint rule to flag `import.*supabase` after migration. Remove `src/lib/supabase.ts` and Supabase SDK dependency from `package.json`.
- [ ] **QA / Frontend Lead:** Run Playwright E2E suite (`hackhub/tests/e2e/`) against the full Docker Compose stack. All existing scenarios must pass.

### Phase 5 — Cutover and Decommission (Week 12)

- [ ] **Infra Lead:** Deploy Docker Compose stack to production host. Apply Flyway baseline against production PostgreSQL. Verify API health check.
- [ ] **Infra Lead:** Update DNS / Cloudflare routing to point to the new stack. Keep Cloudflare Pages deployment live for 72-hour rollback window.
- [ ] **All:** Monitor error rates, API latency P99, WebSocket connection count, and JVM heap for 48 hours post-cutover.
- [ ] **Infra Lead:** Decommission Supabase project after 14-day observation period. Cancel Supabase subscription.
- [ ] **Engineering Lead:** Mark this ADR `accepted`. Update `docs/architecture/README.md` index.
- [ ] **Engineering Lead:** Schedule ADR-0002 for JWT key rotation policy and secrets management procedure.
