# Migration Plan: Supabase SPA → Spring Boot BusinessRepo

**Status:** Draft  
**Date:** 2026-05-12  
**Author:** Engineering Lead  
**Reference ADR:** [ADR-001-platform-migration.md](./ADR-001-platform-migration.md)  
**Total estimate:** ~22 developer-days (single engineer proficient in Spring Boot)

---

## Summary Table

| Phase | Description | Estimate | Depends On | Risk |
|-------|-------------|----------|-----------|------|
| 0 | Repo Restructure | 0.5 d | — | Low |
| 1 | Infrastructure + DB Foundation | 3 d | 0 | Medium |
| 2 | Auth (JWT RS256) | 3 d | 1 | High |
| 3 | Organizations | 1.5 d | 2 | Low |
| 4 | Hackathons | 2 d | 2, 3 | Low |
| 5 | Teams | 2 d | 4 | Low |
| 6 | Ideas + Voting | 3 d | 5 | Medium |
| 7 | File Storage (MinIO) | 2 d | 1 | Medium |
| 8 | Notifications | 1 d | 2 | Low |
| 9 | Real-time (WebSocket/STOMP) | 3 d | 2, 5, 8 | High |
| 10 | Admin | 1 d | 3, 4, 5 | Low |
| 11 | RLS (Defense-in-Depth) | 1.5 d | 1 | Medium |
| 12 | Production Hardening | 2 d | All prior | Medium |
| 13 | Makefile + CI/CD | 1 d | 12 | Low |
| 14 | Cleanup + Validation | 1 d | All | Low |

---

## What Stays the Same

This section exists to bound the scope clearly. These items are **not touched** during the migration:

| Category | Items |
|----------|-------|
| Page components (15) | Login, Register, Dashboard, Hackathons, CreateHackathon, HackathonDetail, HackathonEdit, Teams, Ideas, ProjectShowcase, Profile, OrganizationSetup, AdminUsers, AdminOrganizations |
| UI library | All Mantine components, theming, layout system |
| Routing | React Router 7 routes and navigation structure in `App.tsx` |
| State shapes | `AuthUser`, `AuthState`, `HackathonStore` Zustand interfaces — same shape, different data source |
| Query keys | TanStack Query `queryKey` definitions and cache invalidation patterns |
| Zod schemas | All form validation schemas |
| PermissionService | `src/utils/permissions.ts` RBAC UX logic — `isAdmin`, `canManageHackathon`, `canEditTeam`, etc. (Note: the two async methods that call Supabase directly become synchronous checks against JWT claims; see Phase 2.) |
| Build tool | Vite 7, TypeScript strict mode, ESLint config |
| Husky hooks | Pre-commit lint checks |
| Domain model | Tables, columns, and relationships are preserved — Flyway migrations replicate the Supabase schema verbatim |

---

## Critical Path

The following sequence must be completed before parallel work can begin. Nothing in the API is testable until Phase 1 is done. The frontend cannot be ported until the OpenAPI contract is published from Phase 2 onwards.

```
Phase 0 → Phase 1 → Phase 2 → (Phase 3–10 can parallelize) → Phase 11 → Phase 12 → Phase 13 → Phase 14
```

Specifically:

1. **Phase 1 must be first.** PostgreSQL container + Flyway migrations are the foundation every other phase builds on. No phase can be integration-tested without a running database.
2. **Phase 2 (Auth) blocks everything.** Every endpoint requires a JWT. No use case can be end-to-end tested until `POST /api/v1/auth/login` works and returns a valid token.
3. **Phase 9 (Real-time) depends on Phase 2, 5, and 8.** The STOMP `ChannelInterceptor` validates JWTs (Phase 2), team-membership guards (Phase 5 entities), and notification publishing (Phase 8 entities).
4. **Phase 12 (Hardening) must precede Phase 13 (CI/CD).** Docker images must exist before the CI pipeline can build and push them.
5. **Phase 14 (Cleanup) is last.** Deleting `supabase.ts` and removing the SDK before all services are ported breaks the running app.

---

## Phase 0: Repo Restructure

**Estimate:** 0.5 days  
**Depends on:** Nothing

### Goal

Establish the BusinessRepo directory layout without touching any existing code. The current `app/` directory remains as-is. New top-level directories are scaffolded as empty skeletons.

### Artifacts Produced

```
hackhub/
  api/          (empty — Spring Boot project goes here in Phase 1)
  app/          (existing — no changes)
  infra/        (empty — Docker Compose goes here in Phase 1)
  tests/        (empty — integration + E2E tests go here in Phases 1+)
  docs/         (existing — already present)
  Makefile      (skeleton with target stubs)
  .gitignore    (update to exclude api/target/, infra/.env)
```

**Makefile skeleton targets (stubs only — filled in as phases complete):**

```makefile
.PHONY: up down build test-all test-api test-app test-e2e lint migrate seed

up:
	@echo "Not yet implemented"

down:
	@echo "Not yet implemented"
# ... etc
```

### Key Decisions

- `app/` does **not** move. Paths in CI, Cloudflare Pages config, and `package.json` scripts remain valid throughout the migration. The old system stays running.
- A single root `.gitignore` covers both JVM artifacts (`api/target/`) and Node artifacts (`app/node_modules/`).

### Risks

- None significant. This is directory creation only.

---

## Phase 1: Infrastructure + DB Foundation

**Estimate:** 3 days  
**Depends on:** Phase 0

### Goal

A `docker compose up` brings up PostgreSQL 16, MinIO, and pgAdmin (dev only). Flyway migrations run on startup and produce a schema identical to the current Supabase production database. The Spring Boot project compiles and starts with an empty API surface.

### Artifacts Produced

**`infra/docker-compose.yml` (dev):**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: hackhub
      POSTGRES_USER: hackhub
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hackhub"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  pgadmin:
    image: dpage/pgadmin4:latest
    profiles: ["dev"]
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@local.dev
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      db:
        condition: service_healthy

volumes:
  pg_data:
  minio_data:
```

**Spring Boot Maven scaffold (`api/pom.xml`) key dependencies:**

| Dependency | Version |
|------------|---------|
| `spring-boot-starter-web` | 3.3.x |
| `spring-boot-starter-security` | 3.3.x |
| `spring-boot-starter-data-jpa` | 3.3.x |
| `spring-boot-starter-websocket` | 3.3.x |
| `spring-boot-starter-validation` | 3.3.x |
| `spring-boot-starter-actuator` | 3.3.x |
| `flyway-core` | 10.x |
| `postgresql` (JDBC driver) | 42.7.x |
| `io.minio:minio` | 8.5.x |
| `org.springdoc:springdoc-openapi-starter-webmvc-ui` | 2.5.x |
| `io.jsonwebtoken:jjwt-api` + `jjwt-impl` + `jjwt-jackson` | 0.12.x |
| `org.testcontainers:postgresql` + `minio` | 1.19.x |
| `org.mapstruct:mapstruct` | 1.6.x |

**Clean Architecture package structure:**

```
api/src/main/java/wtf/hackhub/
  domain/
    model/          — Plain Java record/class entities (no Spring annotations)
    repository/     — Repository interfaces (ports, no Spring Data imports)
    service/        — Domain services (pure domain logic)
  application/
    usecase/        — One class per use case (e.g., CreateTeamUseCase)
    port/
      in/           — Input ports (command/query interfaces)
      out/          — Output ports (delegate to infrastructure)
  infrastructure/
    persistence/    — JPA @Entity classes, Spring Data repos, Flyway migrations
    messaging/      — WebSocket event publishers
    storage/        — MinIO adapter
    security/       — JwtProvider, JwtAuthFilter, UserDetailsService
  presentation/
    rest/           — @RestController classes (thin delegates)
    websocket/      — @MessageMapping handlers
    dto/            — Request/response DTOs, MapStruct mappers
```

**Flyway migrations — consolidating 19 Supabase migrations into 6 clean versions:**

The 19 existing migrations break down as follows:
- `20250129000001_initial_schema.sql` — core tables (profiles, hackathons, teams, ideas, votes, comments, chat, notifications) + all RLS policies
- `20250731155748_enable_realtime.sql` — Supabase-specific realtime publication (not ported)
- `20250731170000_setup_file_storage.sql` — `file_metadata` table + storage bucket policies
- `20250731180000_flexible_voting_system.sql` — `voting_criteria`, `idea_scores`, `total_score`/`vote_count` columns on ideas, score calculation trigger
- `20250801000001_add_project_fields_to_ideas.sql` — `repository_url`, `demo_url`, `project_attachments` columns on ideas
- `20250801210001_add_organizations.sql` — `organizations`, `organization_members` tables, FK columns on profiles/hackathons
- `20250801215820` through `20250802005959` — 13 RLS policy patches (infinite recursion fixes, profile insert policy fixes, org policy fixes)

Target Flyway migrations:

| Migration | Content | Source |
|-----------|---------|--------|
| `V001__core_schema.sql` | `profiles`, `hackathons`, `teams`, `team_members`, `ideas`, `idea_votes`, `comments`, `chat_messages`, `notifications`. Add `repository_url`, `demo_url`, `project_attachments` columns on `ideas`. Add `total_score`, `vote_count` columns on `ideas`. Add `organization_id` FK on `profiles` and `hackathons`. `update_updated_at_column()` trigger function. `update_idea_votes_count()` trigger. All `updated_at` triggers. | initial_schema + project_fields + ideas columns from voting migration |
| `V002__organizations.sql` | `organizations`, `organization_members` tables, indexes, `updated_at` trigger | organizations migration |
| `V003__voting_system.sql` | `voting_criteria`, `idea_scores` tables, `calculate_idea_scores()` function, `trigger_recalculate_idea_scores()`, score triggers, seed query migrating existing votes | flexible_voting migration |
| `V004__file_storage.sql` | `file_metadata` table, indexes | file_storage migration (storage bucket policies are not Flyway — they are application-level MinIO SDK setup) |
| `V005__rls_policies.sql` | All RLS `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` statements for all tables. Incorporates the final corrected policies from the 13 patch migrations, not the intermediate broken versions. The `auth.uid()` pattern is replaced with `current_setting('app.current_user_id', true)::uuid` since Supabase Auth is gone. | Synthesized from all 19 migrations — take the final state, not the intermediate |
| `V006__indexes.sql` | All performance indexes from initial schema + organizations + voting + file_metadata | All migrations |

> **Note on V005:** Do not copy the RLS policies from the initial migration or from any intermediate patch — they all contain Supabase-specific `auth.uid()` references and several were explicitly broken (infinite recursion, wrong policy targets). Write V005 fresh from the final intended state, using `current_setting('app.current_user_id', true)::uuid` as the principal identity lookup.

> **Note on Supabase triggers:** The `on_auth_user_created` trigger on `auth.users` and the `handle_new_user()` function are Supabase-specific and must **not** be ported to Flyway. Profile creation is handled by `RegisterUseCase` in Phase 2.

### Key Decisions

- No `R__` repeatable migrations in Flyway. Seed data lives in `api/src/main/resources/db/seed/` and is applied only via `make seed`.
- `flyway.outOfOrder=false` enforced. Any out-of-order migration in CI fails the build.
- pgAdmin runs under the `dev` Docker Compose profile. `docker compose up` does not start it; `docker compose --profile dev up` does.
- The Spring Boot app service is defined in `docker-compose.yml` but not built in Phase 1. The `api:` service entry is stubbed and excluded from the default `up` target until Phase 2 has a working jar.

### Verification Checkpoint

```bash
docker compose up db minio
# Flyway runs V001–V006
# psql -U hackhub -d hackhub -c '\dt' shows 13 tables
# No errors in docker compose logs db
```

### Risks

- **Flyway V005 synthesis is the hardest part of this phase.** The 13 RLS patch migrations represent a series of fixes to the initial broken policies. The correct approach is to read the final working policies from the running Supabase production database (`pg_dump --schema-only` filtered to `CREATE POLICY`) rather than attempting to reconstruct them from the migration files. Budget half a day for this specifically.
- The `calculate_idea_scores()` PL/pgSQL function uses `SECURITY DEFINER`. In the new model, this function runs as the table owner (the `hackhub` PostgreSQL user), which is correct. Verify it is not referencing any Supabase-specific schema.

---

## Phase 2: Auth

**Estimate:** 3 days  
**Depends on:** Phase 1

### Goal

Stateless JWT authentication with RS256. The browser stores the access token in memory; the refresh token is in an `httpOnly` cookie. `authStore.ts` is rewritten to call `POST /api/v1/auth/*` instead of `supabase.auth.*`.

### Artifacts Produced

**Backend:**

- `scripts/generate-rsa-keys.sh` — generates `private.pem` / `public.pem` for RS256 signing. Keys are mounted into the container via environment variables, never baked into the image.
- `JwtProvider` — issues access tokens (15-min, RS256, claims: `sub`, `email`, `roles`, `org_id`) and validates them.
- `RefreshToken` JPA entity — `id` (UUID), `token_hash` (SHA-256 of the opaque token, not the token itself), `user_id`, `expires_at`, `used` (boolean). Single-use rotation: when a refresh token is consumed, `used = true` and a new one is issued. If a `used = true` token is presented again, all refresh tokens for that user are invalidated immediately.
- `JwtAuthFilter extends OncePerRequestFilter` — extracts Bearer token, validates signature, sets `SecurityContextHolder`.
- Use cases: `RegisterUseCase`, `LoginUseCase`, `RefreshTokenUseCase`, `LogoutUseCase`.
- `AuthController`:
  - `POST /api/v1/auth/register` — creates profile with `role=PARTICIPANT`, returns access token + sets `httpOnly` refresh cookie
  - `POST /api/v1/auth/login` — credentials → access token + sets `httpOnly` refresh cookie
  - `POST /api/v1/auth/refresh` — reads `httpOnly` cookie → new access + new refresh token
  - `POST /api/v1/auth/logout` — invalidates refresh token, clears cookie
- `ProfileController`:
  - `GET /api/v1/profiles/me` — returns current user profile
  - `PUT /api/v1/profiles/me` — updates name, avatar, skills

**Frontend (rewrite `authStore.ts`):**

The `AuthState` interface shape does **not** change. The store's action implementations change their transport:

| Before | After |
|--------|-------|
| `supabase.auth.signInWithPassword()` | `POST /api/v1/auth/login` |
| `supabase.auth.signUp()` + `ProfileService.createProfile()` | `POST /api/v1/auth/register` |
| `supabase.auth.signOut()` | `POST /api/v1/auth/logout` |
| `supabase.auth.getSession()` | Read access token from memory; call `GET /api/v1/profiles/me` to hydrate profile |
| `supabase.auth.onAuthStateChange()` | Axios response interceptor: on `401`, attempt refresh; on refresh failure, call `logout()` |

The `initialize()` method in `authStore.ts` currently checks `supabase.auth.getSession()` and then calls `ProfileService.getCurrentProfile()`. The replacement: on app boot, if an access token exists in memory, call `GET /api/v1/profiles/me`. If it returns `401`, call `POST /api/v1/auth/refresh` using the `httpOnly` cookie. If refresh also fails, set `user: null`.

**`src/lib/apiClient.ts` (new file, replaces `src/lib/supabase.ts`):**

```typescript
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // sends httpOnly refresh cookie
})

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, attempt refresh once, then logout
let isRefreshing = false
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry && !isRefreshing) {
      error.config._retry = true
      isRefreshing = true
      try {
        await useAuthStore.getState().refresh()
        isRefreshing = false
        return apiClient(error.config)
      } catch {
        isRefreshing = false
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)
```

> The `AuthUser` type in `authStore.ts` gains one field: `accessToken: string | null`. This field is not persisted to localStorage. It is stored only in Zustand memory.

**PermissionService note:** Two methods currently call Supabase directly — `canManageHackathon()` and `canManageOrganizationUsers()`. These become synchronous: the JWT claims include `roles` and `org_id`. These methods are updated to accept the decoded token claims as an argument rather than issuing async database queries.

### Key Decisions

- Access token in memory only (Zustand state). Not in `localStorage` to prevent XSS token theft.
- Refresh token in `httpOnly`, `SameSite=Strict` cookie. Not accessible to JavaScript.
- The `refresh_tokens` table stores `token_hash` (SHA-256), not the token plaintext. If the table is compromised, the tokens are not directly usable.
- `RegisterUseCase` creates the `profiles` row explicitly. The Supabase `on_auth_user_created` trigger on `auth.users` is not ported.

### Verification Checkpoint

```bash
# POST /api/v1/auth/register returns 201, access token in body, Set-Cookie refresh token
# POST /api/v1/auth/login returns 200, same
# GET /api/v1/profiles/me with access token returns 200 with profile JSON
# POST /api/v1/auth/refresh returns 200, new access token, new refresh cookie
# POST /api/v1/auth/logout returns 204, refresh cookie cleared
# GET /api/v1/profiles/me with expired access token returns 401
```

### Risks

- **RS256 key management.** Private key in Docker secrets or an environment variable injected at deploy time. A leaked private key allows token forgery until the key is rotated. Key rotation procedure must be documented before Phase 12.
- **Frontend session hydration on page refresh.** The access token lives in memory. On a browser refresh, memory is cleared. The app must call `POST /api/v1/auth/refresh` on boot to restore the session from the `httpOnly` cookie. This is the replacement for `supabase.auth.getSession()`. Budget time to test this flow carefully.

---

## Phase 3: Organizations

**Estimate:** 1.5 days  
**Depends on:** Phase 2

### Goal

Full CRUD for organizations and membership management. The `OrganizationSetup` page and `organizationService.ts` (if it exists — currently embedded in `organizations.ts` utility) are ported.

### Artifacts Produced

**Backend:**

- Domain entities: `Organization`, `OrganizationMember` (role: `OWNER`, `MANAGER`, `MEMBER`)
- Use cases: `CreateOrgUseCase`, `GetOrgUseCase`, `UpdateOrgUseCase`, `JoinOrgUseCase`, `ManageMembersUseCase`
- REST endpoints:
  - `POST /api/v1/organizations`
  - `GET /api/v1/organizations/{id}`
  - `PUT /api/v1/organizations/{id}` — `@PreAuthorize("hasAnyRole('ADMIN') or @orgSecurity.isOwnerOrManager(#id, authentication)")`
  - `GET /api/v1/organizations/{id}/members`
  - `POST /api/v1/organizations/{id}/members`
  - `PUT /api/v1/organizations/{id}/members/{userId}`
  - `DELETE /api/v1/organizations/{id}/members/{userId}`

**Frontend:**

- Port `src/utils/organizations.ts` — replace any Supabase calls with `apiClient` calls.
- `OrganizationSetup.tsx` page — no structural change; only the service calls change.

### Key Decisions

- Organization membership check is a reusable Spring Security expression method `@orgSecurity` bean, not inline in every `@PreAuthorize`. This prevents copy-paste authorization logic.
- `organization_id` in JWT claims is set on login and reflects the user's current primary organization. A user in multiple organizations would require a separate "switch organization" endpoint — deferred; current data model has one `organization_id` per profile.

### Risks

- Low. The organization domain is isolated and has no real-time components.

---

## Phase 4: Hackathons

**Estimate:** 2 days  
**Depends on:** Phase 2, Phase 3

### Goal

Hackathon CRUD, status machine enforcement, and registration by `registrationKey`. The `hackathonService.ts` service and `hackathonStore.ts` fetch methods are ported.

### Artifacts Produced

**Backend:**

- `Hackathon` domain entity. Status machine: `DRAFT → OPEN → RUNNING → COMPLETED`. Transitions are enforced in `StatusTransitionUseCase` — invalid transitions throw a domain exception, not a generic 500.
- Use cases: `CreateHackathonUseCase`, `UpdateHackathonUseCase`, `DeleteHackathonUseCase`, `GetHackathonsUseCase` (paginated), `GetHackathonUseCase`, `JoinHackathonUseCase` (validates `registrationKey`), `TransitionHackathonStatusUseCase`
- REST endpoints:
  - `GET /api/v1/hackathons?page=0&size=20&status=OPEN` — paginated, filterable by status
  - `POST /api/v1/hackathons` — `@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")`
  - `GET /api/v1/hackathons/{id}`
  - `PUT /api/v1/hackathons/{id}`
  - `DELETE /api/v1/hackathons/{id}` — `@PreAuthorize("hasRole('ADMIN') or @hackathonSecurity.isCreator(#id, authentication)")`
  - `POST /api/v1/hackathons/{id}/join` — body: `{ registrationKey: "..." }`
  - `POST /api/v1/hackathons/{id}/status` — body: `{ status: "OPEN" }`

**Frontend:**

- Port `hackathonService.ts` — all `supabase.from('hackathons')` calls become `apiClient.get/post/put/delete('/api/v1/hackathons...')`.
- Port `hackathonStore.ts` `fetchHackathons()` and `fetchHackathon()` methods.
- The `Hackathons.tsx`, `HackathonDetail.tsx`, `HackathonEdit.tsx`, `CreateHackathon.tsx` page components are **not changed**.

### Key Decisions

- Pagination on `GET /api/v1/hackathons` uses Spring Data's `Pageable` with `Page<HackathonSummaryDto>`. The frontend currently fetches all hackathons at once — TanStack Query's `useInfiniteQuery` or a simple `page=0&size=100` call is acceptable for MVP scale.
- `registrationKey` is generated server-side as a UUID on hackathon creation. The client never supplies it; it is returned in the create response and displayed to managers.

### Risks

- The frontend `hackathonStore.ts` currently stores hackathons in Zustand and also uses TanStack Query in some components. Ensure both paths are ported consistently. Read `hackathonStore.ts` before starting this phase to confirm the store/query split.

---

## Phase 5: Teams

**Estimate:** 2 days  
**Depends on:** Phase 4

### Goal

Team CRUD, member management, and team membership checks used by Phase 9 (STOMP authorization). `teamService.ts` is ported.

### Artifacts Produced

**Backend:**

- `Team`, `TeamMember` domain entities (role: `LEADER`, `MEMBER`)
- Use cases: `CreateTeamUseCase` (creates team + adds creator as `LEADER` in one transaction), `UpdateTeamUseCase`, `DeleteTeamUseCase`, `JoinTeamUseCase`, `LeaveTeamUseCase`, `AddTeamMemberUseCase`, `RemoveTeamMemberUseCase`, `UpdateTeamMemberRoleUseCase`, `GetTeamsUseCase`, `GetTeamUseCase`, `GetUserTeamsUseCase`, `IsTeamMemberUseCase`
- REST endpoints:
  - `GET /api/v1/hackathons/{hackathonId}/teams`
  - `POST /api/v1/hackathons/{hackathonId}/teams`
  - `GET /api/v1/teams/{id}` — returns `TeamWithMembersDto` (profiles embedded)
  - `PUT /api/v1/teams/{id}`
  - `DELETE /api/v1/teams/{id}`
  - `GET /api/v1/teams/{id}/members`
  - `POST /api/v1/teams/{id}/members` — add member
  - `DELETE /api/v1/teams/{id}/members/{userId}` — remove member
  - `PUT /api/v1/teams/{id}/members/{userId}` — update role
  - `GET /api/v1/users/me/teams` — current user's teams across hackathons

**Frontend:**

- Port `teamService.ts` entirely. The `TeamWithMembers` interface shape is preserved; the backend DTO matches it.
- `Teams.tsx` page — no structural change.

### Key Decisions

- `CreateTeamUseCase` wraps team insert + team_member insert in a single `@Transactional` method. The current Supabase service has a bug: if `addTeamMember()` fails after `createTeam()`, the team exists without a leader. The use case eliminates this race condition.
- The `isTeamMember` query is exposed as a utility method on `TeamMemberRepository` and used by the STOMP `ChannelInterceptor` in Phase 9.

### Risks

- Low. The team domain is well-bounded and has no external integrations beyond Phase 9.

---

## Phase 6: Ideas + Voting

**Estimate:** 3 days  
**Depends on:** Phase 5

### Goal

Idea submission, commenting, weighted voting (per `voting_criteria`), and criteria-based scoring. The voting feature is currently partially disabled in `ideaService.ts` (see `voteIdea()` which throws immediately and the `user_has_voted: false` hardcoding). This migration fully re-enables voting via the server-side `idea_scores` path.

### Artifacts Produced

**Backend:**

- Domain entities: `Idea`, `IdeaVote`, `Comment`, `VotingCriteria`, `IdeaScore`
- Use cases:
  - `GetIdeasUseCase`, `GetIdeaUseCase`, `SubmitIdeaUseCase`, `UpdateIdeaUseCase`, `DeleteIdeaUseCase`
  - `AddCommentUseCase`, `UpdateCommentUseCase`, `DeleteCommentUseCase`
  - `ScoreIdeaUseCase` — upserts an `IdeaScore` for `(idea_id, user_id, criteria_id)`. After upsert, calls `calculateWeightedScore()` domain service.
  - `GetUserScoresUseCase` — returns the current user's scores for all criteria on a given idea
  - `ManageVotingCriteriaUseCase` — `@PreAuthorize` enforces that only the hackathon creator or an org manager can modify criteria. Validates that all criteria weights sum to 100.
  - `GetVotingCriteriaUseCase`
- REST endpoints:
  - `GET /api/v1/hackathons/{id}/ideas`
  - `POST /api/v1/hackathons/{id}/ideas`
  - `GET /api/v1/ideas/{id}`
  - `PUT /api/v1/ideas/{id}`
  - `DELETE /api/v1/ideas/{id}`
  - `POST /api/v1/ideas/{id}/scores` — body: `{ criteriaId, score }` (upsert)
  - `GET /api/v1/ideas/{id}/scores/me` — current user's scores for this idea
  - `POST /api/v1/ideas/{id}/comments`
  - `PUT /api/v1/ideas/{id}/comments/{commentId}`
  - `DELETE /api/v1/ideas/{id}/comments/{commentId}`
  - `GET /api/v1/hackathons/{id}/voting-criteria`
  - `POST /api/v1/hackathons/{id}/voting-criteria`
  - `PUT /api/v1/hackathons/{id}/voting-criteria/{criteriaId}`
  - `DELETE /api/v1/hackathons/{id}/voting-criteria/{criteriaId}`

**Frontend:**

- Port `ideaService.ts` — remove the disabled voting stub, implement scoring via `POST /api/v1/ideas/{id}/scores`.
- Port `votingService.ts`.
- `FlexibleVotingInterface.tsx` and `VotingCriteriaManager.tsx` components — no structural changes.
- `Ideas.tsx` page — no structural change.

### Key Decisions

- Weighted score calculation moves from a PostgreSQL trigger (`calculate_idea_scores()` PL/pgSQL function) to a Java domain service `IdeaScoreCalculator`. The Flyway V003 migration keeps the existing trigger for data integrity, but the Spring use case also updates `total_score` and `vote_count` after any score upsert. Both paths produce the same result. The trigger is a fallback for direct DB writes during migration only.
- The `project_attachments` column on `ideas` is currently stored as a JSON string (`JSON.stringify()` in `ideaService.ts`). The backend deserializes this to a `List<String>` and returns it as a proper JSON array. The frontend must be updated to stop serializing before sending.

### Risks

- **Voting was disabled in the current codebase.** The `idea_votes` table exists but the service method throws. The `idea_scores` path (flexible voting) also appears not fully wired. This means there is no working voting feature to replicate — the backend implementation must be verified against the UI expectations in `FlexibleVotingInterface.tsx` rather than against existing service behavior.
- Weight validation: `ManageVotingCriteriaUseCase` must enforce that the sum of all `weight` values for a hackathon equals exactly 100 after any add/update/delete. This is a domain invariant not currently enforced client-side in a reliable way.

---

## Phase 7: File Storage (MinIO)

**Estimate:** 2 days  
**Depends on:** Phase 1 (MinIO container), Phase 2 (auth)

### Goal

All file uploads go through the API. The browser never uploads directly to storage. MinIO replaces the 5 Supabase storage buckets. `storageService.ts` and `fileService.ts` are ported.

### Storage Bucket Mapping

| Supabase Bucket | MinIO Bucket | Access |
|----------------|-------------|--------|
| `team-files` | `team-files` | Private |
| `hackathon-assets` | `hackathon-assets` | Private |
| `avatars` | `avatars` | Private |
| `team-avatars` | `team-avatars` | Private |
| `idea-attachments` | `idea-attachments` | Private |

All buckets are private. No public-read bucket policy. File reads always go through a presigned URL endpoint.

### Artifacts Produced

**Backend:**

- `StoragePort` interface (output port): `uploadObject()`, `deleteObject()`, `generatePresignedUrl()`
- `MinioStorageAdapter implements StoragePort` — MinIO Java SDK implementation
- `BucketInitializer @Component` — checks and creates all 5 buckets on application startup using `MinioClient.bucketExists()` + `MinioClient.makeBucket()`
- `FileUploadUseCase`:
  - Accepts `MultipartFile`
  - Validates MIME type via Apache Tika (`Tika.detect(InputStream)`) against allowlist: `image/*`, `application/pdf`, `application/zip`, `text/*`, `application/msword`, `application/vnd.openxmlformats-*`
  - Validates file size ≤ 50 MB
  - Generates UUID-based object key (never uses original filename as the key)
  - Streams to MinIO
  - Writes metadata row to `file_metadata` table
  - Returns `{ objectKey, presignedUrl }` (presigned URL expires in 1 hour)
- `GetPresignedUrlUseCase` — validates the requesting user is authorized to access the file (via `file_metadata` `team_id` + `TeamMemberRepository.isTeamMember()`), then calls `StoragePort.generatePresignedUrl()`
- `DeleteFileUseCase` — deletes from MinIO + removes `file_metadata` row
- REST endpoints:
  - `POST /api/v1/storage/upload/{bucket}` — multipart, returns `{ objectKey, url }`
  - `GET /api/v1/storage/url/{bucket}/{objectKey}` — returns `{ url }` (1-hour presigned)
  - `DELETE /api/v1/storage/{bucket}/{objectKey}`

**Frontend:**

- Port `storageService.ts` — replace `supabase.storage.from(bucket).upload()` with `apiClient.post('/api/v1/storage/upload/{bucket}', formData)`
- Replace `supabase.storage.from(bucket).getPublicUrl()` / `createSignedUrl()` with `apiClient.get('/api/v1/storage/url/{bucket}/{key}')`
- Port `fileService.ts`
- `TeamFileManager.tsx`, `ProjectAttachments.tsx` — no structural changes

### Key Decisions

- `spring.servlet.multipart.max-file-size=50MB` and `max-request-size=52MB` set in `application.yml`. The Supabase bucket had a 10 MB limit; the API raises this to 50 MB.
- MIME sniffing via Apache Tika is mandatory. Declared `Content-Type` header is not trusted. A `.exe` renamed to `.png` is rejected.
- Object keys are UUIDs. Original filenames are stored only in the `file_metadata` table's `original_name` column.
- Rate limiting on upload endpoint: 10 requests/minute per authenticated user (Resilience4j `@RateLimiter` annotation on use case).

### Risks

- **Stream vs. buffer.** The current Supabase SDK uploads via the browser directly to storage. The new path proxies through the API. For a 50 MB file, the API must stream directly to MinIO without loading the file into heap. Use `MinioClient.putObject()` with `PutObjectArgs.builder().stream(inputStream, -1, 10_485_760)` to enable streaming with unknown size.
- **Concurrent uploads + MinIO startup.** In Docker Compose, the API container starts and `BucketInitializer` runs before MinIO is fully ready. Add `depends_on: minio: condition: service_healthy` in `docker-compose.yml` and a MinIO healthcheck.

---

## Phase 8: Notifications

**Estimate:** 1 day  
**Depends on:** Phase 2

### Goal

Notification persistence and CRUD. Real-time delivery of new notifications is handled in Phase 9 via STOMP `/user/queue/notifications`.

### Artifacts Produced

**Backend:**

- `Notification` JPA entity (matches existing `notifications` table schema)
- Use cases: `GetNotificationsUseCase`, `MarkNotificationReadUseCase`, `DeleteNotificationUseCase`, `CreateNotificationUseCase` (internal — not exposed as a REST endpoint; called by other use cases)
- `NotificationPublisher` — wraps `SimpMessagingTemplate`; called from any use case that needs to push a real-time notification. Defined here; wired to the STOMP broker in Phase 9.
- REST endpoints:
  - `GET /api/v1/notifications` — current user's notifications, sorted by `created_at DESC`
  - `PATCH /api/v1/notifications/{id}/read`
  - `DELETE /api/v1/notifications/{id}`

**Frontend:**

- Port `notificationService.ts`
- `NotificationCenter.tsx` — no structural change

### Risks

- Low. The notification domain has no complex logic.

---

## Phase 9: Real-time (WebSocket/STOMP)

**Estimate:** 3 days  
**Depends on:** Phase 2, Phase 5, Phase 8

### Goal

Replace the dual real-time transport (Supabase Realtime channels + Socket.io) with a single Spring WebSocket STOMP broker. `RealtimeContext.tsx` is rewritten. The interface contract exposed to components does not change.

### Current State Analysis

`RealtimeContext.tsx` currently:
- Uses `supabase.channel()` for broadcast events (team invites, notifications)
- Uses `supabase.channel().on('postgres_changes', ...)` for database row change subscriptions (teams, team_members, idea_votes, chat_messages, file_metadata)
- Exposes: `subscribeToChannel`, `unsubscribeFromChannel`, `broadcastEvent`, `subscribeToNotifications`, `subscribeToTeamUpdates`, `subscribeToIdeaVotes`, `subscribeToTeamChat`, `subscribeToTeamFiles`

**None of the subscription methods are replaced with polling.** All become STOMP topic subscriptions.

### STOMP Topic Mapping

| Current Supabase Channel | New STOMP Destination | Publisher |
|--------------------------|----------------------|-----------|
| `notifications:{userId}` broadcast | `/user/queue/notifications` | `NotificationPublisher` |
| `team:{teamId}` broadcast + postgres_changes on `teams`, `team_members` | `/topic/team.{id}.updates` | `TeamEventPublisher` |
| `idea:{ideaId}` postgres_changes on `idea_votes` | `/topic/idea.{id}.votes` | `IdeaEventPublisher` |
| `team_chat:{teamId}` postgres_changes on `chat_messages` | `/topic/team.{id}.chat` | `ChatMessagePublisher` |
| `team_files:{teamId}` postgres_changes on `file_metadata` | `/topic/team.{id}.files` | `FileEventPublisher` |

### Artifacts Produced

**Backend:**

- `WebSocketConfig implements WebSocketMessageBrokerConfigurer`:
  - `configureMessageBroker`: in-memory broker with destinations `/topic` and `/queue`; application destination prefix `/app`
  - `registerStompEndpoints`: `/ws` with SockJS fallback
- `JwtChannelInterceptor implements ChannelInterceptor`:
  - `preSend()`: on `CONNECT` command, extract JWT from `Authorization` header in STOMP headers. Validate. On failure, throw `MessageDeliveryException` — connection rejected before it opens.
  - On `SUBSCRIBE` to `/topic/team.{id}.chat` or similar team-scoped topics, call `IsTeamMemberUseCase` to verify the subscribing user is a member of that team. Reject if not.
- `@MessageMapping` handlers:
  - `ChatMessageHandler`: `/app/team.{id}.chat.send` → persists message via `ChatService`, publishes to `/topic/team.{id}.chat`
- Event publishers (`SimpMessagingTemplate`):
  - `ChatMessagePublisher` — called from `ChatService` after message persisted
  - `TeamEventPublisher` — called from `CreateTeamUseCase`, `UpdateTeamUseCase`, member use cases
  - `IdeaEventPublisher` — called from `ScoreIdeaUseCase`
  - `NotificationPublisher` — called from `CreateNotificationUseCase`
  - `FileEventPublisher` — called from `FileUploadUseCase`, `DeleteFileUseCase`

**Frontend (rewrite `RealtimeContext.tsx`):**

The rewrite replaces all Supabase channel calls with `@stomp/stompjs`. The exported context interface (`RealtimeContext.types.ts`) **does not change** — same method signatures, same `RealtimePayload` type.

```typescript
// Internal implementation changes; public interface is unchanged
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// Connection in useEffect:
const client = new Client({
  webSocketFactory: () => new SockJS(`${VITE_API_BASE_URL}/ws`),
  connectHeaders: { Authorization: `Bearer ${accessToken}` },
  onConnect: () => setIsConnected(true),
  onDisconnect: () => setIsConnected(false),
})
client.activate()
```

Subscription mapping:

```typescript
// subscribeToTeamChat(teamId, callback) becomes:
client.subscribe(`/topic/team.${teamId}.chat`, (frame) => {
  callback({ event: frame.headers['event-type'], payload: JSON.parse(frame.body) })
})

// subscribeToNotifications() becomes:
client.subscribe('/user/queue/notifications', (frame) => {
  // same notification display logic as before
})
```

New npm dependencies to add to `app/package.json`:
- `@stomp/stompjs`
- `sockjs-client`

Remove from `app/package.json`:
- `socket.io-client` (was used by `useSocket.ts` — verify if still referenced anywhere)

### Key Decisions

- In-memory STOMP broker. No RabbitMQ relay at this stage. Horizontal scaling is blocked by this choice — if multiple API instances are needed, add a RabbitMQ relay in a future phase as a configuration-only change.
- The `useSocket.ts` hook is removed after Phase 9. It wraps Socket.io directly. The `RealtimeContext` is the sole real-time abstraction.
- STOMP `CONNECT` is rejected if the JWT is expired. The frontend client handles this by calling `POST /api/v1/auth/refresh`, getting a new access token, and reconnecting with the new token. The `@stomp/stompjs` `Client` supports a `reconnectDelay` that can be configured to trigger this flow.

### Risks

- **Highest complexity phase.** STOMP topic authorization (validating team membership on subscribe) requires the `JwtChannelInterceptor` to load user data from the database on every subscribe command. At scale this is a potential bottleneck, but for a single-node deployment it is acceptable. Cache team membership lookups in a Caffeine in-memory cache with a 60-second TTL to mitigate.
- **SockJS fallback.** Some reverse proxies (Cloudflare, certain Nginx configurations) do not proxy WebSocket connections correctly. Test WebSocket upgrade through the production Nginx container before go-live.
- **Token expiry during a long STOMP session.** If the access token expires during an open STOMP connection, the next subscription attempt will be rejected. The `JwtChannelInterceptor` should check token expiry on every `SUBSCRIBE` command, not just on `CONNECT`.

---

## Phase 10: Admin

**Estimate:** 1 day  
**Depends on:** Phase 3, Phase 4, Phase 5

### Goal

Admin-only endpoints for user and organization management. The `AdminUsers.tsx` and `AdminOrganizations.tsx` pages are already structured correctly — only the service calls change.

### Artifacts Produced

**Backend:**

- Use cases: `ListUsersUseCase`, `GetUserUseCase`, `UpdateUserRoleUseCase`, `ListOrganizationsUseCase`
- REST endpoints (all `@PreAuthorize("hasRole('ADMIN')")`):
  - `GET /api/v1/admin/users?page=0&size=50`
  - `GET /api/v1/admin/users/{id}`
  - `PUT /api/v1/admin/users/{id}/role` — body: `{ role: "MANAGER" }`
  - `GET /api/v1/admin/organizations`

**Frontend:**

- Port the service calls in `AdminUsers.tsx` and `AdminOrganizations.tsx` — they currently inline Supabase calls directly in the component rather than delegating to a service class. Replace with `apiClient` calls.

### Key Decisions

- Admin endpoints are on a separate URL prefix `/api/v1/admin/`. Spring Security's filter chain applies `hasRole('ADMIN')` to all `/api/v1/admin/**` paths at the security configuration level, in addition to the `@PreAuthorize` annotations on individual use cases. Defense-in-depth.

### Risks

- Low. Admin pages are used by one role and have no real-time components.

---

## Phase 11: RLS (Defense-in-Depth)

**Estimate:** 1.5 days  
**Depends on:** Phase 1 (Flyway migrations)

### Goal

PostgreSQL RLS policies are active on all tables as a backstop. The primary authorization enforcement is Spring Security (`@PreAuthorize`, `JwtAuthFilter`). RLS ensures that even if a Spring Security check is accidentally bypassed, the database will refuse the query.

### Mechanism

Spring Security cannot set a PostgreSQL session variable automatically. The bridge is a JDBC `ConnectionCustomizer` (or Hibernate `StatementInspector`) that runs `SET LOCAL app.current_user_id = '<user_uuid>'` before each transaction using the current `SecurityContextHolder` principal.

The Flyway V005 migration's RLS policies use `current_setting('app.current_user_id', true)::uuid` instead of Supabase's `auth.uid()`. The second argument `true` means the function returns `NULL` (rather than throwing) if the setting is not defined — which is the correct behavior for public read policies.

**Implementation:**

```java
@Component
public class RlsUserIdSetter implements TransactionSynchronization {
  // Called at the start of each transaction
  // SET LOCAL app.current_user_id = '<authenticated user UUID>'
  // SET LOCAL is scoped to the current transaction — it is cleared automatically on commit/rollback
}
```

### Verification

```bash
# Directly in psql, without setting app.current_user_id:
SET SESSION app.current_user_id = '00000000-0000-0000-0000-000000000000';
SELECT * FROM chat_messages WHERE team_id = '<some_team_uuid>';
# Should return 0 rows if the user is not a member of that team
```

### Key Decisions

- RLS is **not** relied upon as the sole authorization layer. If the session variable is not set (e.g., a background job), all RLS policies that require a user context return no rows — this is intentional and safe.
- Background jobs (e.g., a scheduled cleanup task) run under a dedicated service account with a separate database role that bypasses RLS where necessary, explicitly, not accidentally.

### Risks

- **Flyway V005 must be tested against a real PostgreSQL instance.** The session variable approach differs from Supabase's `auth.uid()`. Any policy that uses a subquery referencing `organization_members` (as several do in the 13 patch migrations) must be verified for infinite recursion — the same issue that drove 13 patch migrations in Supabase.

---

## Phase 12: Production Hardening

**Estimate:** 2 days  
**Depends on:** All prior phases complete and verified

### Goal

Production-ready Docker images, locked-down configuration, Actuator on a management port, CORS scoped to explicit origins.

### Artifacts Produced

**Multi-stage `api/Dockerfile`:**

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY . .
RUN ./mvnw -q package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=builder /build/target/hackhub-api-*.jar app.jar
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-Xms512m", "-Xmx1g", "-XX:+UseG1GC", "-jar", "app.jar"]
```

**`app/Dockerfile` (Nginx + React build):**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`app/nginx.conf`:** SPA routing (all routes → `index.html`), gzip enabled, security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).

**Production `infra/docker-compose.prod.yml`** (overrides dev compose):
- No `pgadmin` service
- Resource limits: API `cpus: 1.0, memory: 1.5g`; DB `cpus: 0.5, memory: 512m`; MinIO `cpus: 0.5, memory: 512m`
- `restart: unless-stopped` on all services
- Health checks on all services
- No host port bindings for `db` and `minio` (internal network only)

**`application.yml` production settings:**

```yaml
management:
  server:
    port: 8081
  endpoints:
    web:
      exposure:
        include: health,prometheus
      base-path: /actuator
  endpoint:
    health:
      show-details: never

spring:
  mvc:
    problemdetails:
      enabled: true

logging:
  level:
    root: WARN
    wtf.hackhub: INFO
```

**CORS configuration:**

```java
@Configuration
public class CorsConfig {
  @Value("${app.cors.allowed-origins}")
  private List<String> allowedOrigins; // Set via environment variable

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    // Only allowedOrigins, not "*"
    // Credentials: true (for httpOnly cookie)
    // Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
    // Headers: Authorization, Content-Type
  }
}
```

### Key Decisions

- `management.server.port=8081` is not exposed via Nginx. Only `8080` (API) is public. The Nginx upstream proxies only to port `8080`.
- JVM flags `-Xms512m -Xmx1g` are conservative for a 4 GB RAM host running the full stack. Monitor heap utilization for 48 hours after go-live and adjust.
- Stack traces are **never** returned in API error responses. The global `@ControllerAdvice` returns RFC 7807 `ProblemDetail` with `title`, `status`, `detail` only.

### Risks

- Flyway migration lock on multi-instance startup (see ADR Section 5.4). The production deployment must ensure only one API replica runs Flyway. Use `spring.flyway.enabled=true` on exactly one instance; set `spring.flyway.enabled=false` on any additional replicas started simultaneously. For single-instance deployments, this is not a concern.

---

## Phase 13: Makefile + CI/CD

**Estimate:** 1 day  
**Depends on:** Phase 12

### Goal

A root `Makefile` with all standard targets. GitHub Actions pipeline updated to replace the Cloudflare Pages deploy with Docker build + push + integration test run.

### Makefile Targets

```makefile
.PHONY: up down build test-all test-api test-app test-e2e lint migrate seed

up:
	docker compose --profile dev up -d

down:
	docker compose --profile dev down -v

build:
	docker compose build

test-all: test-api test-app test-e2e

test-api:
	cd api && ./mvnw test

test-app:
	cd app && npm run lint

test-e2e:
	cd tests && npx playwright test

lint:
	cd app && npm run lint
	cd api && ./mvnw checkstyle:check

migrate:
	docker compose run --rm api java -jar app.jar --spring.flyway.enabled=true --spring.profiles.active=migrate

seed:
	docker compose run --rm api java -jar app.jar --app.seed.enabled=true --spring.profiles.active=seed

spec:
	curl -s http://localhost:8080/v3/api-docs/yaml -o docs/openapi.yaml
```

### GitHub Actions Changes

**Remove:**
- Cloudflare Pages deploy action
- Supabase migration run action (if present)

**Add:**
- `docker build` + `docker push` (to registry) for `api` and `app` images
- `make test-all` in CI — Testcontainers spins up PostgreSQL + MinIO for integration tests
- `make lint` for both Java (Checkstyle) and TypeScript (ESLint)

**Remove from `app/package.json`:**
- `@supabase/supabase-js`
- `@supabase/storage-js`
- `socket.io-client`

**Add to `app/package.json`:**
- `@stomp/stompjs`
- `sockjs-client`
- `axios`

**Add ESLint rule** to detect remaining Supabase imports after migration:

```js
// .eslintrc — custom rule or no-restricted-imports
"no-restricted-imports": ["error", {
  "patterns": ["@supabase/*", "supabase"]
}]
```

### Risks

- Testcontainers in CI adds 30–60 seconds to build time. This is acceptable.
- The ESLint `no-restricted-imports` rule on `@supabase/*` will fail the build if any `supabase` import remains after Phase 14. This is intentional — it is the automated safety net for the cleanup phase.

---

## Phase 14: Cleanup + Validation

**Estimate:** 1 day  
**Depends on:** All prior phases

### Goal

Remove all Supabase artifacts from the codebase. Run the full E2E Playwright suite against the Docker Compose stack. Confirm `make test-all` is green.

### Artifacts Removed

```
app/supabase/                      — entire directory
app/migrations/                    — entire directory (if present)
app/src/lib/supabase.ts            — deleted
app/src/hooks/useSocket.ts         — deleted (Socket.io hook, replaced by RealtimeContext)
```

### Environment Variable Replacements

| Remove | Add |
|--------|-----|
| `VITE_SUPABASE_URL` | `VITE_API_BASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | (no replacement — JWT replaces anon key) |
| `SUPABASE_LOCAL_URL` | (no replacement) |
| `SUPABASE_LOCAL_ANON_KEY` | (no replacement) |

**`app/.env.example` updated:** Remove all `SUPABASE_*` entries. Add `VITE_API_BASE_URL=http://localhost:8080`.

### Playwright E2E Suite (`tests/e2e/`)

Minimum scenario coverage required before marking cleanup complete:

| Scenario | Pages Covered |
|----------|--------------|
| Register + login + logout | Login, Register |
| Create hackathon | CreateHackathon, Hackathons |
| Join hackathon by registration key | HackathonDetail |
| Create team, join team | Teams |
| Submit idea, add comment | Ideas |
| Upload file to team | Teams (TeamFileManager) |
| Score idea (voting criteria) | Ideas (FlexibleVotingInterface) |
| Admin user role change | AdminUsers |
| Real-time chat message | Teams (TeamChat) |

### Documentation Updates

- `app/CLAUDE.md`: Update Tech Stack table (remove Supabase, add Spring Boot REST endpoint base URL pattern)
- `docs/` architecture documents: Update any diagram that shows Supabase as a component

### Final Verification

```bash
make build          # All images build cleanly
make up             # Stack starts, all health checks pass
make test-all       # Unit + integration + E2E all green
make lint           # Zero ESLint errors, zero Checkstyle violations
# Confirm: grep -r "supabase" app/src/ returns no results
```

---

## Risks (Global)

### R1 — Java experience gap (High)

**Description:** If the current team is TypeScript-only, Spring Boot / Java 21 expertise does not exist. This is not a technical risk — it is an organizational one. A single engineer new to the JVM stack will take 2–3x longer on Phases 2, 4–10, and 9 specifically.

**Mitigation:** A minimum of one engineer with production Spring Boot experience must own the `/api` module. If not available in-house, contract this specifically for the migration. The frontend work (Phases 2 frontend portion, 9 frontend, 13–14) can be done by any TypeScript engineer.

### R2 — RLS policy synthesis (Medium)

**Description:** The 13 RLS patch migrations in Supabase represent a history of broken policies and incremental fixes. Synthesizing the final correct state into Flyway V005 requires either dumping the live Supabase schema or very careful reading of all 13 migration files. Getting this wrong in Phase 1 means RLS is either overly restrictive (blocks legitimate queries) or too permissive (allows data leaks).

**Mitigation:** Before Phase 1 starts, run `pg_dump --schema-only` on the Supabase production database and extract only `CREATE POLICY` statements. Use those verbatim as the starting point for V005, then replace `auth.uid()` with `current_setting('app.current_user_id', true)::uuid`. Do not attempt to reconstruct policies from migration files.

### R3 — Session hydration on page refresh (Medium)

**Description:** Moving the access token from Supabase's SDK-managed storage (which persists across page reloads) to in-memory Zustand state means every page refresh triggers a token refresh round-trip. If this round-trip fails (network error, expired refresh token), the user is logged out unexpectedly.

**Mitigation:** Implement a loading state in `authStore.ts` `initialize()` that shows a full-page spinner until the token refresh completes or fails. Do not render authenticated routes until `initialized: true`. Test explicitly: open app, wait for session, hard-refresh browser, verify session is restored.

### R4 — Real-time migration completeness (Medium)

**Description:** `RealtimeContext.tsx` uses both broadcast channels and `postgres_changes` subscriptions. The `postgres_changes` subscriptions (on `teams`, `team_members`, `idea_votes`, `chat_messages`, `file_metadata`) mean that any database mutation — even those made directly outside the API — would trigger a real-time update. After migration, real-time updates are only published when the Spring API handles the mutation. Direct database writes (from scripts, seed data, admin psql sessions) will not trigger real-time events.

**Mitigation:** This is an intentional and acceptable trade-off. Document it. Ensure all admin and seed operations go through the API or accept that real-time will not fire for them.

### R5 — Voting feature state (Medium)

**Description:** The current `voteIdea()` method in `ideaService.ts` deliberately throws an error and is documented as disabled. The `user_has_voted` field is hardcoded to `false`. The voting feature is non-functional in the current system. This means there is no existing voting behavior to replicate or validate against — the Phase 6 implementation is effectively a new feature, not a port.

**Mitigation:** Treat voting as a new feature in Phase 6. Review `FlexibleVotingInterface.tsx` and `VotingCriteriaManager.tsx` component expectations carefully to understand the required API contract before writing the use cases.

### R6 — Docker Compose WebSocket proxying (Low-Medium)

**Description:** STOMP over SockJS requires WebSocket upgrade headers to pass through Nginx correctly. Misconfigured Nginx `proxy_pass` blocks WebSocket connections silently — the client falls back to SockJS long-polling, which works but is slower and masks the configuration problem.

**Mitigation:** Include the following in the Nginx config and test WebSocket upgrade explicitly before production deploy:

```nginx
location /ws {
    proxy_pass http://api:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
}
```

### R7 — Flyway migration lock on parallel startup (Low)

**Description:** If two API instances start simultaneously and both try to acquire the Flyway migration lock, one will wait. In a fresh deployment with a long-running migration, this wait could exceed the container health check timeout, causing the second instance to be marked unhealthy.

**Mitigation:** For the initial deployment, run a single instance. The Flyway lock timeout defaults to 60 seconds — acceptable for the migration volume here (6 small migrations). Document in the deployment runbook that Flyway migrations must complete on the primary instance before secondary instances are started.

---

## Appendix: Frontend Service Migration Cheat Sheet

Each service file maps to a set of REST endpoints. Use this during Phases 3–10 to track port completion.

| Service File | Supabase Table(s) | Replacement Endpoints | Phase |
|---|---|---|---|
| `authStore.ts` | `auth.users`, `profiles` | `POST /api/v1/auth/*`, `GET/PUT /api/v1/profiles/me` | 2 |
| `profileService.ts` | `profiles` | `GET/PUT /api/v1/profiles/me`, `GET /api/v1/profiles/{id}` | 2 |
| `organizations.ts` (utility) | `organizations`, `organization_members` | `/api/v1/organizations/*` | 3 |
| `hackathonService.ts` | `hackathons` | `/api/v1/hackathons/*` | 4 |
| `hackathonStore.ts` (fetch methods) | `hackathons` | `/api/v1/hackathons/*` | 4 |
| `teamService.ts` | `teams`, `team_members` | `/api/v1/hackathons/{id}/teams`, `/api/v1/teams/*` | 5 |
| `ideaService.ts` | `ideas`, `idea_votes`, `idea_scores`, `comments` | `/api/v1/hackathons/{id}/ideas`, `/api/v1/ideas/*` | 6 |
| `votingService.ts` | `voting_criteria`, `idea_scores` | `/api/v1/hackathons/{id}/voting-criteria`, `/api/v1/ideas/{id}/scores` | 6 |
| `storageService.ts` | Supabase Storage (5 buckets) | `/api/v1/storage/*` | 7 |
| `fileService.ts` | `file_metadata` | `/api/v1/storage/*` | 7 |
| `notificationService.ts` | `notifications` | `/api/v1/notifications/*` | 8 |
| `realtimeService.ts` | Supabase Realtime channels | STOMP topics (Phase 9) | 9 |
| `chatService.ts` | `chat_messages` | `/api/v1/teams/{id}/messages` + STOMP | 9 |
| `videoCallService.ts` | (currently uses WebRTC signaling) | Out of scope for this migration — retain as-is | — |
| `RealtimeContext.tsx` | Supabase channels, Socket.io | STOMP / `@stomp/stompjs` | 9 |
