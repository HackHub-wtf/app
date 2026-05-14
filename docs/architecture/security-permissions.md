# HackHub — Backend-First Security & Permissions

## 1. Backend-First Security Model

**The backend is the only authoritative source for authorization decisions.**

Every access-control check must be enforced by the API before any data is returned or any mutation is applied. The frontend may hide UI elements for usability, but hiding is never security — a caller with curl or Postman must receive the same enforcement as the browser.

Rule: **if a backend check does not exist, the permission does not exist.**

---

## 2. Authentication vs Authorization

| Concept | Meaning | Where enforced |
|---------|---------|----------------|
| **Authentication** | Proves who you are — valid JWT signed with RS256 | `JwtAuthFilter` on every request |
| **Authorization** | Proves you can do this — role + context check | `@PreAuthorize` + use-case layer |

These are separate gates. A valid JWT does not imply permission. Every endpoint applies both.

### Token model

```
POST /api/v1/auth/login → { accessToken }  +  Set-Cookie: refresh_token (httpOnly)

Authorization: Bearer <accessToken>   ← every subsequent request
POST /api/v1/auth/refresh             ← rotates access token via httpOnly cookie
```

- **Access token**: memory-only in the frontend (`tokenStore`). TTL = 900 s. Never `localStorage`.
- **Refresh token**: `HttpOnly; Secure; SameSite=Strict` cookie. TTL = 7 days.
- **Logout**: clears the refresh token from the server and from the cookie.
- **Admin user creation**: must use `credentials: 'omit'` to prevent the new-user `Set-Cookie` from overwriting the admin's refresh token.

---

## 3. Deny-by-Default Policy

All endpoints require authentication unless explicitly listed as public:

| Public endpoints (no auth required) |
|--------------------------------------|
| `POST /api/v1/auth/login` |
| `POST /api/v1/auth/register` |
| `POST /api/v1/auth/refresh` |
| `GET  /api/v1/invitations/:token` |
| `GET  /api/v1/hackathons/:id/leaderboard` |

Everything else returns `401` for unauthenticated requests and `403` for authenticated requests that lack the required permission.

---

## 4. Role and Context Validation

### Platform roles (in JWT `roles` claim)

| Role | Granted by | Scope |
|------|-----------|-------|
| `ROLE_ADMIN` | DB seed / bootstrap only | Platform-wide |
| `ROLE_MANAGER` | Admin via `PATCH /admin/users/:id/role` | Platform role; management authority comes from org membership |
| `ROLE_USER` | Public registration | No inherent authority |

**Critical**: Public registration (`POST /api/v1/auth/register`) must never produce `ROLE_ADMIN` or `ROLE_MANAGER`. Promotion to admin must never be available through the normal UI.

### Contextual roles (resolved at request time, never in JWT)

| Contextual role | Source table | Resolved by |
|----------------|-------------|-------------|
| Org owner | `organization_members.role = 'owner'` | `@orgSecurity.isOrgOwnerOrManager()` |
| Org manager | `organization_members.role = 'manager'` | `@orgSecurity.isOrgOwnerOrManager()` |
| Org member | any row in `organization_members` | `@orgSecurity.isOrgMember()` |
| Panel judge | row in `hackathon_judges` | `@hackathonSecurity.isJudgeOrOrgManager()` |
| Team leader | `team_members.role = 'leader'` | `@teamSecurity.isLeaderOrAdmin()` |
| Team member | any row in `team_members` | use-case layer |

### Security beans

```java
// Org-level checks
@orgSecurity.isOrgOwnerOrManager(orgId, authentication)  // owner OR manager
@orgSecurity.isOrgMember(orgId, authentication)           // any membership

// Hackathon-level checks (resolves through hackathon → org)
@hackathonSecurity.isOwnerOrOrgManager(hackathonId, authentication)
@hackathonSecurity.isJudgeOrOrgManager(hackathonId, authentication)

// Team-level checks
@teamSecurity.isLeaderOrAdmin(teamId, authentication)
```

All beans query the database. They never trust frontend-supplied role claims.

---

## 5. Cross-Org Isolation

Cross-org data leakage is a critical security boundary.

### Enforced rules

| Rule | Mechanism |
|------|-----------|
| Non-admin `GET /hackathons` returns only org-scoped hackathons | `GetHackathonsUseCase.listForUser()` — queries `organization_members` for caller's org set |
| Hackathon creation requires org membership | `@orgSecurity.isOrgOwnerOrManager(req.organizationId)` |
| Hackathon config/status/criteria changes require org scope | `@hackathonSecurity.isOwnerOrOrgManager(hackathonId)` |
| Team creation validates org membership (if hackathon has an org) | `CreateTeamUseCase` — `orgMemberRepository.existsByOrganizationIdAndUserId()` |
| Team join validates org membership | `JoinTeamUseCase` — `orgMemberRepository.existsByOrganizationIdAndUserId()` |
| Idea submission validates: user is org member, user is on team, team is in hackathon | `SubmitIdeaUseCase` — three separate checks |
| Org settings update requires owner or manager | `UpdateOrganizationSettingsUseCase` — role check |
| Judge assignment requires org manager or admin | `@hackathonSecurity.isOwnerOrOrgManager()` |

### What must never happen

- A manager must never see or modify another org's hackathons.
- A participant must never see hackathons from orgs they do not belong to.
- Cross-org team joining must return `403`.
- Cross-org idea submission must return `403`.
- List endpoints must never return all records to non-admins.

---

## 6. API Authorization Requirements

### Admin endpoints — `ROLE_ADMIN` only

```
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/role
GET    /api/v1/admin/organizations
PATCH  /api/v1/admin/organizations/:id
DELETE /api/v1/admin/organizations/:id
```

All guarded by class-level `@PreAuthorize("hasRole('ADMIN')")`.

### Hackathon management

```
POST   /api/v1/hackathons                         ADMIN | MANAGER + org owner/manager
PUT    /api/v1/hackathons/:id                     ADMIN | hackathon's org owner/manager
PATCH  /api/v1/hackathons/:id/status              ADMIN | hackathon's org owner/manager
PATCH  /api/v1/hackathons/:id/config              ADMIN | hackathon's org owner/manager
POST   /api/v1/hackathons/:id/voting-criteria     ADMIN | hackathon's org owner/manager
DELETE /api/v1/hackathons/:id/voting-criteria/:c  ADMIN | hackathon's org owner/manager
```

### Judging

```
POST   /api/v1/hackathons/:id/judging/judges       ADMIN | org owner/manager
DELETE /api/v1/hackathons/:id/judging/judges/:uid  ADMIN | org owner/manager
POST   /api/v1/hackathons/:id/judging/scores       ADMIN | org manager | assigned judge
```

Scoring: score must be 1–10. Score is tied to the authenticated user (`@AuthenticationPrincipal`) — never from the request body.

### Organization settings

```
PATCH /api/v1/organizations/:id/settings          ADMIN | org owner | org manager
```

Both `visibility` and `joinPolicy` are required. Validated by `UpdateOrganizationSettingsUseCase`.

### Invitations — role escalation rules

```
POST   /api/v1/organizations/:id/invitations       (ADMIN | MANAGER) AND org owner/manager
GET    /api/v1/organizations/:id/invitations       (ADMIN | MANAGER) AND org owner/manager
DELETE /api/v1/organizations/:id/invitations/:inv  (ADMIN | MANAGER) AND org owner/manager
```

Backend enforces role ceiling:
- Org owner can invite: `manager`, `member`
- Org manager can invite: `member` only → `manager` returns `403`
- Others: `403`

### Teams

```
POST   /api/v1/hackathons/:id/teams        authenticated + org membership (if org-scoped hackathon)
DELETE /api/v1/teams/:id                   ADMIN | team leader
PUT    /api/v1/teams/:id                   ADMIN | team leader
POST   /api/v1/teams/:id/members           authenticated + org membership + not already on a team
```

One team per hackathon per user — enforced in both `CreateTeamUseCase` and `JoinTeamUseCase`.

### Ideas

```
POST /api/v1/hackathons/:id/ideas    authenticated + org member + team member + team in hackathon
PUT  /api/v1/ideas/:id               ADMIN | submitter
DELETE /api/v1/ideas/:id             ADMIN | submitter
```

---

## 7. Storage Authorization Requirements

**Current state: NOT production-ready.** Any authenticated user can upload to any bucket.

**Required production state:**

| Bucket | Required permission |
|--------|-------------------|
| `hackhub-avatars` | self (own profile) or admin/org manager |
| `hackhub-team-files` | team member |
| `hackhub-team-avatars` | team leader or admin |
| `hackhub-hackathon-assets` | hackathon's org owner/manager or admin |
| `hackhub-project-attachments` | team member (submission permission) |

Until context-scoped storage is implemented, storage endpoints are a known production gap.

---

## 8. WebSocket / Chat Authorization Requirements

**Current state: Partial.** HTTP endpoint has no `@PreAuthorize`. STOMP connection is authenticated but message-level scope is not fully enforced.

**Required production state:**

- `GET /api/v1/teams/:id/messages` — add `@PreAuthorize` requiring team membership.
- STOMP send (`/app/team.{id}.chat`) — verify sender is team member before broadcasting.
- STOMP subscribe (`/topic/team.{id}`) — verify subscriber is team member at connection time.
- Non-team members must receive `403` or be silently ignored.

---

## 9. Leaderboard / Scoring Authority

The backend is the single authority for all score calculations. The frontend only displays results.

```
Community score:  calculated from idea_votes table
Panel score:      average of judge_scores per idea
Blended score:    (panelWeight / 100) × panelScore + ((100 - panelWeight) / 100) × communityScore
Rank:             ORDER BY blendedScore DESC, THEN voteCount DESC (tiebreaker: earlier submission)
```

- `GET /api/v1/hackathons/:id/judging/scores/summary` — backend-calculated ranks, never computed on client.
- `GET /api/v1/hackathons/:id/leaderboard` — public endpoint returning backend-calculated results.
- Frontend must never sort or reorder leaderboard data. Display order must match backend response order.

---

## 10. Audit Logging Recommendations

Every `403` response should produce a `WARN` log entry containing:

```
userId=<uuid>  method=<POST|GET|...>  path=<endpoint>  reason=<short description>
```

Recommended reasons:

| Reason | Trigger |
|--------|---------|
| `missing-role` | JWT lacks required platform role |
| `not-org-member` | User is not a member of the relevant org |
| `not-org-manager` | User is a member but not owner/manager |
| `not-team-member` | User is not on the relevant team |
| `not-assigned-judge` | User is not assigned as judge for this hackathon |
| `cross-org-attempt` | User tried to access another org's resource |
| `role-escalation` | Invitation attempted to assign a role >= inviter's role |

These logs enable detection of probing, misconfigured clients, and authorization bypass attempts.

---

## 11. Production Hardening Checklist

### Authentication
- [x] Access token in memory only (never localStorage)
- [x] Refresh token is `HttpOnly; Secure; SameSite=Strict`
- [x] Admin user creation uses `credentials: 'omit'`
- [x] JWT validated with RS256 on every request
- [x] Expired tokens return `401`
- [ ] Refresh token rotation (single-use) — not confirmed implemented
- [ ] Token revocation list or short TTL enforcement after logout

### Authorization
- [x] All admin endpoints have class-level `@PreAuthorize("hasRole('ADMIN')")`
- [x] Hackathon management endpoints have `@PreAuthorize` with org scope
- [x] Judging endpoints have `@PreAuthorize`
- [x] Invitation endpoints have `@PreAuthorize` with role-escalation check
- [x] Org settings allow owner + manager (not just owner)
- [x] One team per hackathon per user enforced in backend
- [x] Team join requires org membership (backend check)
- [x] Idea submission requires org membership + team membership (backend check)
- [ ] Chat `GET /teams/:id/messages` needs `@PreAuthorize`
- [ ] STOMP message handlers need team membership validation
- [ ] `GET /organizations/:id` should enforce membership for non-admins
- [ ] `GET /profiles/:id` should scope to shared org/team context

### Data scoping
- [x] `GET /hackathons` is org-scoped for non-admins (backend query)
- [x] `GET /organizations/my` returns only joined orgs
- [x] Manager "Manage Members" loads org members, not all platform users
- [ ] `GET /judging/scores` needs org scoping for managers
- [ ] `GET /admin/organizations` should not be accessible to managers

### Input validation
- [x] Score range 1–10 enforced
- [x] Invitation role ceiling enforced
- [x] Team name uniqueness per hackathon enforced
- [x] Hackathon status transitions validated (draft→open→running→completed only)
- [x] Criteria weight ≥ 1 enforced
- [ ] File upload type/size validation not implemented
- [ ] URL safety validation for submission links not implemented

### Infrastructure
- [ ] File storage is authenticated-only (not context-scoped) — production gap
- [ ] HTTPS required in production (Nginx/Caddy termination)
- [ ] Rate limiting on auth endpoints not implemented
- [ ] CORS policy should be tightened for production deployment
- [ ] Secrets (JWT keys, DB passwords) must be injected via environment, never in source
