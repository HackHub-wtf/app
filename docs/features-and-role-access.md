# HackHub — Features and Role Access

Production source of truth for all feature permissions, role definitions, authorization requirements, and known security gaps. Backend enforcement takes precedence over anything in the frontend; frontend visibility rules are UX hints only.

---

## 1. Purpose

This document defines:

- Who can do what, and at which layer (DB / API / frontend)
- Which rules are backend-enforced vs frontend-only hints
- Known security gaps that are not yet patched
- The required test coverage to prevent regressions

Every decision made in `src/utils/permissions.ts`, `@PreAuthorize` annotations, and PostgreSQL RLS policies must trace back to a rule in this document.

---

## 2. Security Principles

1. **Defence in depth.** Authorization is checked at three layers: PostgreSQL RLS, Spring Security `@PreAuthorize`, and frontend permission utilities. Losing any one layer must not expose data.
2. **Backend is authoritative.** Frontend visibility checks are UX hints. Never trust a client-supplied role claim for a write operation.
3. **Principle of least privilege.** A new user starts with zero privileges beyond reading their own profile. Access is additive through org and hackathon membership.
4. **No role escalation via registration.** Public registration produces a `user` (participant) account only. Elevated roles require admin bootstrapping or explicit org assignment.
5. **Session integrity.** Access tokens are memory-only. Refresh tokens are httpOnly cookies managed by the server. Admin operations must not affect the admin's own session.
6. **Tenant isolation.** All data is scoped to an organisation. PostgreSQL RLS enforces this at the row level via `app.current_user_id` session variable.

---

## 3. Platform Roles

Platform roles are stored on `profiles.role`. They are set at account creation and cannot be changed by the user.

| Role | Description | How created |
|------|-------------|-------------|
| `admin` | Platform superadmin. Full read/write access to all organisations, hackathons, users, teams, ideas, and scores. Bypasses all tenant-scoped RLS. | DB seed, bootstrap script, or direct SQL only. Not creatable via any API endpoint. |
| `manager` | Can create organisations and manage their own orgs and hackathons. Cannot access `/api/v1/admin/*` endpoints or see other orgs. Scoped entirely through org membership — this is NOT a global elevated role. | Public registration (self-declared) or admin promotion. |
| `user` | Default role. No platform privileges. All access flows through contextual roles (org membership, team membership). | Public registration (`POST /api/v1/auth/register`). |

**Important:** `manager` at the platform level only gates org creation. Within an org, whether a manager can do something depends on their `organization_members.role`, not `profiles.role`.

---

## 4. Contextual Roles

Contextual roles are membership roles, stored in join tables. They do not appear on `profiles`.

### Org-level roles (`organization_members.role`)

| Role | Description | Who assigns |
|------|-------------|-------------|
| `owner` | Created the org. Can update all org settings, invite managers/members/judges, manage hackathons, delete the org. | System (on org creation). |
| `manager` | Assigned by owner or admin. Can update org settings, invite members and judges (NOT managers or owners), manage hackathons within the org. | Org owner or platform admin. |
| `member` | Joined the org. Can view org hackathons, create/join teams, submit ideas, vote, and chat. | Self-register (if `join_policy = self_register`) or invitation. |
| `judge` | Assigned to the org, then explicitly assigned to a specific hackathon. Can score ideas in assigned hackathons only. Cannot configure hackathons or see other orgs. | Org owner or org manager. |

### Hackathon-level roles

Hackathons do not have their own membership table separate from orgs. Hackathon access is derived from org membership. The exception is judges, who are additionally tracked in `hackathon_judges`.

### Team-level roles (`team_members.role`)

| Role | Description | Who assigns |
|------|-------------|-------------|
| `leader` | Created the team. Can edit team name/description, manage members, submit the final project, and disband the team. | System (on team creation). |
| `member` | Joined the team. Can participate in team chat, contribute to ideas, and leave the team. | Team join (open teams) or team leader invitation. |

---

## 5. Authentication and Sessions

### Unauthenticated access

Only these routes are accessible without a valid session:

- `GET /` (landing page)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /invite/:token` (invitation landing — reads token metadata only, does not join)

All other routes require a valid `Authorization: Bearer <accessToken>` header.

### Token storage

| Token | Storage | TTL |
|-------|---------|-----|
| Access token | In-memory (`tokenStore`) — never `localStorage`, never a cookie | 900 s (15 min) |
| Refresh token | httpOnly `Set-Cookie` header (server-managed) | 604 800 s (7 days) |

### Registration rules

- `POST /api/v1/auth/register` creates a `profiles.role = 'user'` account.
- No org is created. No elevated role is assigned.
- The response includes an access token and sets the refresh cookie — no second login required.
- **Admin accounts cannot be created via any API endpoint.** They must be bootstrapped via DB seed or direct SQL.

### Admin session isolation

When an admin creates a new user via the admin panel (`POST /api/v1/admin/users`), the response must not overwrite the admin's own access token or refresh cookie. The endpoint creates the user and returns the new user's profile — it does not perform a login on behalf of the new user.

---

## 6. Organization Features

### Create org

```
POST /api/v1/organizations
```

| Check | Layer | Rule |
|-------|-------|------|
| Authenticated | Spring Security | Required |
| `profiles.role` is `admin` or `manager` | `@PreAuthorize` | `user`-role accounts cannot create orgs |

After creation, the creator is automatically inserted into `organization_members` with `role = owner`.

### List orgs

```
GET /api/v1/organizations
```

| Role | Behaviour |
|------|-----------|
| `admin` | Returns all orgs on the platform, including legacy (no-member) orgs |
| All others | Returns only orgs where the caller appears in `organization_members` |

**Backend-enforced** via RLS `tenant_isolation` policy on `organizations`.

### Get single org

```
GET /api/v1/organizations/:id
```

- **Known gap:** Does not enforce membership. Any authenticated user who knows the org `id` can fetch the org record regardless of membership. See Section 22.

### Update org settings

```
PATCH /api/v1/organizations/:id/settings
```

Note: the endpoint is `/settings`, not the base `/organizations/:id`. Requests to `PATCH /organizations/:id` without the `/settings` suffix will 404.

Settings require **both** `visibility` and `joinPolicy` fields in the request body — partial updates are not supported.

| Role | Can update |
|------|-----------|
| `admin` | Yes |
| Org `owner` | Yes |
| Org `manager` | Yes |
| Org `member` | No — 403 |
| `judge` | No — 403 |

**Backend-enforced** via `@PreAuthorize` checking `organization_members.role` for the calling user.

### Delete org

```
DELETE /api/v1/organizations/:id
```

| Role | Can delete |
|------|-----------|
| `admin` | Yes |
| Org `owner` | Yes |
| All others | No — 403 |

---

## 7. Invitation Features

### Create invitation

```
POST /api/v1/organizations/:id/invitations
```

| Role | Can invite whom |
|------|----------------|
| `admin` | Any role, any org |
| Org `owner` | `manager`, `member`, `judge` |
| Org `manager` | `member`, `judge` only — NOT `manager` or `owner` |
| Org `member` | No — 403 |

The response contains `{ token, inviteUrl }`. The URL is shared out-of-band. Tokens have a configurable TTL and are single-use (`used_at` is set on first use).

### Accept invitation

```
POST /api/v1/organizations/join { slug, token? }
```

- Verifies token validity: `expires_at` in the future, `used_at IS NULL`.
- Inserts the caller into `organization_members` with the role encoded in the token.
- Marks `used_at = now()` to prevent replay.
- The `/invite/:token` frontend route reads token metadata to display a confirmation page before the user commits to joining.

---

## 8. Hackathon Features

### Create hackathon

```
POST /api/v1/hackathons
```

| Role | Can create |
|------|-----------|
| `admin` | Yes — can create under any org |
| Org `owner` | Yes — own org only |
| Org `manager` | Yes — own org only |
| Org `member` | No — 403 |
| `judge` | No — 403 |

### List hackathons

```
GET /api/v1/hackathons
```

| Role | Behaviour |
|------|-----------|
| `admin` | All hackathons on the platform, including those in orgs the admin doesn't belong to, and legacy hackathons with no org |
| All others | Only hackathons belonging to orgs where the caller is a member |

**Backend-enforced** via RLS.

### Get hackathon

```
GET /api/v1/hackathons/:id
```

Access controlled by org membership via RLS. Non-members cannot fetch org-private hackathons.

### Update hackathon config

```
PATCH /api/v1/hackathons/:id
PATCH /api/v1/hackathons/:id/config    (judging_mode, panel_weight, visibility, join_policy)
```

| Role | Can update |
|------|-----------|
| `admin` | Yes |
| Org `owner` of that hackathon's org | Yes |
| Org `manager` of that hackathon's org | Yes |
| All others | No — 403 |

### Status transitions

```
PATCH /api/v1/hackathons/:id/status { status }
```

Transitions are strictly forward: `draft → open → running → completed`. No backward transitions. Invalid transitions return `409 Conflict`.

| From | To | Triggered by |
|------|----|--------------|
| `draft` | `open` | Org manager, org owner, admin |
| `open` | `running` | Org manager, org owner, admin |
| `running` | `completed` | Org manager, org owner, admin |

**Backend-enforced.** The state machine is validated in `HackathonService.transitionStatus()`.

### Judging modes

Set via `PATCH /api/v1/hackathons/:id/config`.

| Mode | How scores are calculated |
|------|--------------------------|
| `community` | Community votes (`idea_votes.vote_count`) normalised to 1–10 |
| `panel` | Weighted average of `judge_scores` per criterion per assigned judge |
| `blended` | `(panelScore × panelWeight + communityScore × (100 − panelWeight)) / 100` |

`panelWeight` must be in range 30–70 when mode is `blended`. Stored as `hackathons.panel_weight`.

---

## 9. Team Features

### Create team

```
POST /api/v1/hackathons/:id/teams
```

Requires: authenticated user, org membership for that hackathon's org, hackathon in `open` or `running` status, user not already on a team in that hackathon.

**One team per user per hackathon is enforced at the backend** — duplicate join returns `409 Conflict`.

### Join team

```
POST /api/v1/teams/:id/members
```

Requirements (all enforced at backend):
- Authenticated
- Org member of the hackathon's org
- Team `is_open = true`
- Team not at `max_team_size` capacity
- User not already on any team in that hackathon

**Known gap:** Org membership is not currently validated before allowing a user to join a team. See Section 22.

### Leave team

```
DELETE /api/v1/teams/:id/members/:userId
```

- Team `member`: can leave at any time.
- Team `leader`: cannot leave while other members remain in the team. Must remove all members first or transfer leadership.

### Delete team

```
DELETE /api/v1/teams/:id
```

| Role | Can delete |
|------|-----------|
| `admin` | Yes |
| Team `leader` | Yes |
| Org `owner` / `manager` | Yes |
| All others | No — 403 |

### Update team

```
PATCH /api/v1/teams/:id
```

| Role | Can update |
|------|-----------|
| Team `leader` | Yes |
| `admin` | Yes |
| Org `owner` / `manager` | Yes |
| Team `member` | No — 403 |

---

## 10. Idea Features

### Create idea

```
POST /api/v1/hackathons/:id/ideas
```

Requirements:
- Authenticated
- User belongs to a team in this hackathon
- Team belongs to this hackathon

**Known gap:** Org membership is not validated at idea creation. See Section 22.

### Update idea

```
PATCH /api/v1/ideas/:id
```

| Role | Can update |
|------|-----------|
| Idea submitter (`ideas.created_by`) | Yes |
| `admin` | Yes |
| Org `manager` of that idea's org | Yes |
| All others | No — 403 |

### Delete idea

```
DELETE /api/v1/ideas/:id
```

Same rules as update.

### View ideas

- Org members can see ideas in their org's hackathons.
- Non-members cannot view ideas (RLS enforced).
- Ideas in `draft` status are visible only to the submitting team and org managers/admin.

### Comment on idea

```
POST /api/v1/ideas/:id/comments
```

- Requires org membership.
- Non-members cannot comment.

### Vote on idea

```
POST /api/v1/ideas/:id/votes
```

- Requires org membership.
- One vote per user per idea (unique constraint on `idea_votes(idea_id, user_id)`).
- Non-members cannot vote.

---

## 11. Voting Features

Community voting is available when `hackathons.judging_mode` is `community` or `blended`.

```
POST   /api/v1/ideas/:id/votes      (cast vote)
DELETE /api/v1/ideas/:id/votes      (retract vote)
GET    /api/v1/hackathons/:id/votes (list votes for hackathon)
```

| Rule | Layer |
|------|-------|
| One vote per user per idea | DB unique constraint + backend validation |
| Voter must be org member | Backend `@PreAuthorize` |
| Voting open during `running` and `completed` status | Backend status check |

Frontend hides voting controls from non-members and outside the valid hackathon phases, but **backend enforces all rules**.

---

## 12. Final Submission Features

Final submissions are a polished deliverable separate from the evolving idea record. One submission per team per hackathon (`unique(hackathon_id, team_id)`).

```
POST   /api/v1/hackathons/:id/submissions        (create)
PATCH  /api/v1/hackathons/:id/submissions/:subId (update)
GET    /api/v1/hackathons/:id/submissions         (list — admin/manager view)
GET    /api/v1/hackathons/:id/submissions/:subId  (get single)
```

| Rule | Layer |
|------|-------|
| Submitter must be team `leader` | Backend `@PreAuthorize` |
| One submission per team | DB unique constraint |
| Submission tied to a specific idea | `final_submissions.idea_id` FK |
| Admin and org manager can view all submissions | Backend role check |

Supported attachment types: `pptx`, `video`, `youtube`, `github`, `bitbucket`, `url`.

---

## 13. Judging Features

Panel judging is available when `hackathons.judging_mode` is `panel` or `blended`.

### Assign judge

```
POST /api/v1/hackathons/:id/judging/judges { userId }
```

| Role | Can assign |
|------|-----------|
| `admin` | Yes |
| Org `owner` | Yes |
| Org `manager` | Yes |
| All others | No — 403 |

The assigned user must already be an org member. Org membership alone does not make someone a judge — they must be explicitly added to `hackathon_judges`.

### Submit score

```
POST /api/v1/hackathons/:id/judging/scores { ideaId, criterionId, score, comment? }
```

| Rule | Layer |
|------|-------|
| Caller must be in `hackathon_judges` for this hackathon | Backend `@PreAuthorize` |
| Score is 1–10 integer | Backend validation |
| `judge_id` is taken from authenticated user — not the request body | Backend (prevents impersonation) |
| One score per judge per criterion per idea | DB unique constraint on `judge_scores(hackathon_id, idea_id, judge_id, criterion_id)` |

**Known gap:** `GET /judging/scores` does not enforce org scoping for managers — a manager from org A could potentially read scores from org B if they know the hackathon ID. See Section 22.

### Leaderboard

```
GET /api/v1/hackathons/:id/scores/summary
```

- Backend calculates the blended score using the hackathon's `judging_mode` and `panel_weight`.
- Frontend is display-only — does not perform any score calculation.
- Available to all org members during and after the hackathon.

---

## 14. Profile Features

### Get own profile

```
GET /api/v1/profiles/me
```

Available to any authenticated user. Returns the calling user's own profile.

### Get profile by ID

```
GET /api/v1/profiles/:id
```

**Known gap:** Any authenticated user can fetch any profile by ID. This enables user enumeration. See Section 22.

### Update profile

```
PATCH /api/v1/profiles/me
```

Users can only update their own profile. Admins can update any profile via `PATCH /api/v1/admin/users/:id`.

---

## 15. Notification Features

```
GET    /api/v1/notifications         (list — own notifications only)
PATCH  /api/v1/notifications/:id     (mark read)
DELETE /api/v1/notifications/:id     (delete)
```

- Notifications are scoped to `notifications.user_id` matching the authenticated user.
- Backend enforced via RLS: `user_id = current_setting('app.current_user_id')`.
- No cross-user notification access.

---

## 16. Chat Features

```
GET  /api/v1/teams/:id/messages       (list messages)
POST /api/v1/teams/:id/messages       (send message)
```

Real-time delivery via Spring WebSocket (STOMP) over `/ws`. Messages are also persisted to `chat_messages`.

| Rule | Layer |
|------|-------|
| Sender must be a team member | Backend `@PreAuthorize` on POST |
| Message type: `text`, `file`, `system` | Backend validation |

**Known gap:** `GET /api/v1/teams/:id/messages` does not have a `@PreAuthorize` annotation. Any authenticated user who knows the team ID can read chat history. See Section 22.

---

## 17. File Storage Features

```
POST /api/v1/storage/upload/:bucketKey   (upload file)
GET  /api/v1/storage/:bucketKey/:fileKey (download / get URL)
```

Files are stored in MinIO (S3-compatible). `bucketKey` maps to a configured MinIO bucket (e.g. `avatars`, `attachments`, `banners`).

| Rule | Layer |
|------|-------|
| Must be authenticated | Spring Security |
| Context scoping (e.g. only upload to your team's bucket) | Not currently enforced — see Section 22 |

**Known gap:** The upload endpoint is authenticated-only, not context-scoped. Any authenticated user can upload to any bucket key. See Section 22.

---

## 18. Backend Authorization Requirements

Every API endpoint must have all applicable checks from this list. Missing any check is a security defect.

| Check | How enforced |
|-------|-------------|
| Request is authenticated | Spring Security filter chain — JWT RS256 validation |
| Caller's org membership | `@PreAuthorize("@orgSecurity.isMember(#orgId, authentication)")` |
| Caller's org role (owner/manager) | `@PreAuthorize("@orgSecurity.hasRole(#orgId, 'owner', 'manager', authentication)")` |
| Caller is hackathon judge | `@PreAuthorize("@judgingSecurity.isAssigned(#hackathonId, authentication)")` |
| Caller is team leader | `@PreAuthorize("@teamSecurity.isLeader(#teamId, authentication)")` |
| Caller is team member | `@PreAuthorize("@teamSecurity.isMember(#teamId, authentication)")` |
| Platform admin | `@PreAuthorize("hasRole('admin')")` |
| Resource belongs to caller's org | RLS policy via `app.current_user_id` session variable |
| Judge score `judge_id` | Always set from `authentication.principal.id` — never from request body |

---

## 19. Frontend Visibility Requirements

Frontend permission checks are in `src/utils/permissions.ts`. They gate UI rendering only — they do not replace backend enforcement.

| UI element | Condition to show |
|------------|------------------|
| "Create Org" button | `profiles.role === 'admin' || profiles.role === 'manager'` |
| "Create Hackathon" button | Admin, or org `owner`/`manager` of current org |
| Hackathon config / status controls | Admin, or org `owner`/`manager` of that hackathon's org |
| "Edit Team" controls | Team `leader`, admin, or org manager |
| "Leave Team" button | Team member (hidden for `leader` while members remain) |
| Vote button | Org member, hackathon in `running` state, user not already voted |
| Score input panel | User in `hackathon_judges` for this hackathon |
| "Assign Judges" control | Admin, org `owner`, org `manager` |
| "Submit Project" button | Team `leader` only |
| Leaderboard | All org members (read-only) |
| Admin panel (`/admin/*`) | `profiles.role === 'admin'` only |
| Org settings page | Org `owner`, org `manager`, admin |
| Chat input | Team member only |
| Chat history | Team member only (also see gap in Section 22) |
| Notification list | Own notifications only |

---

## 20. Data Scoping Rules

| Resource | Scoped to | Enforced by |
|----------|-----------|-------------|
| Orgs | Only orgs where caller is a member (except admin) | RLS |
| Hackathons | Only hackathons in caller's orgs (except admin) | RLS |
| Teams | Only teams in caller's orgs | RLS |
| Ideas | Only ideas in caller's org hackathons; draft ideas restricted to team + managers | RLS + `@PreAuthorize` |
| `idea_votes` | Only for ideas in caller's org hackathons | RLS |
| `judge_scores` | Only for hackathons caller is assigned to as judge | RLS |
| Chat messages | Only for teams where caller is a member | RLS (gap: GET endpoint not annotated) |
| Notifications | Own only | RLS |
| Profiles | Own profile only via `/me`; any profile by ID via `/:id` (gap) | RLS on own data |
| File storage | Authenticated only; no context scoping (gap) | Spring Security |

---

## 21. Role Summary Matrix

`Y` = allowed, `N` = denied, `O` = own resources only, `*` = with conditions.

| Feature | Admin | Manager (own org) | Org Owner | Org Manager | Org Member | Panel Judge | Team Leader | Team Member |
|---------|-------|--------------------|-----------|-------------|------------|-------------|-------------|-------------|
| Create org | Y | Y | — | — | N | N | — | — |
| View all orgs | Y | N | N | N | N | N | N | N |
| View own orgs | Y | Y | Y | Y | Y | Y | Y | Y |
| Update org settings | Y | N | Y | Y | N | N | N | N |
| Delete org | Y | N | Y | N | N | N | N | N |
| Invite org manager | Y | N | Y | N | N | N | N | N |
| Invite org member / judge | Y | N | Y | Y | N | N | N | N |
| Create hackathon | Y | Y* | Y | Y | N | N | N | N |
| View hackathons (own org) | Y | Y | Y | Y | Y | Y | Y | Y |
| View all hackathons | Y | N | N | N | N | N | N | N |
| Configure hackathon | Y | N | Y | Y | N | N | N | N |
| Transition hackathon status | Y | N | Y | Y | N | N | N | N |
| Assign judges | Y | N | Y | Y | N | N | N | N |
| Create team | Y | Y | Y | Y | Y | N | — | — |
| Edit team | Y | Y | Y | Y | N | N | Y | N |
| Delete team | Y | Y | Y | Y | N | N | Y | N |
| Join team | Y | Y | Y | Y | Y* | N | — | — |
| Leave team | Y | Y | Y | Y | Y | Y | Y* | Y |
| Remove team member | Y | Y | Y | Y | N | N | Y | N |
| Submit idea | Y | N | N | N | Y* | N | Y* | Y* |
| Update idea | Y | Y | Y | Y | O | N | O | O |
| Delete idea | Y | Y | Y | Y | O | N | O | O |
| View ideas | Y | Y | Y | Y | Y | Y | Y | Y |
| Comment on idea | Y | Y | Y | Y | Y | N | Y | Y |
| Vote on idea | Y | N | N | N | Y* | N | Y* | Y* |
| Submit final project | Y | N | N | N | N | N | Y | N |
| Score idea (panel) | Y | N | N | N | N | Y | N | N |
| View leaderboard | Y | Y | Y | Y | Y | Y | Y | Y |
| Read chat | Y | N | N | N | N | N | Y | Y |
| Send chat | Y | N | N | N | N | N | Y | Y |
| Upload file | Y | Y | Y | Y | Y | Y | Y | Y |
| View notifications (own) | Y | Y | Y | Y | Y | Y | Y | Y |
| View any profile by ID | Y | Y* | Y* | Y* | Y* | Y* | Y* | Y* |
| Admin panel access | Y | N | N | N | N | N | N | N |

Notes on conditions:
- Manager (own org): can create hackathons only in orgs they are a member of with `owner`/`manager` org role.
- Join team: requires hackathon in valid phase, team open, not already on a team, org member.
- Submit/vote idea: requires active hackathon, team membership. Org membership not currently validated at backend (gap).
- Leave team (team leader): blocked while members remain.
- View any profile by ID: currently open to all authenticated users — this is a known gap, not intended.

---

## 22. Known Security Gaps

These are confirmed defects that have not yet been patched. Each entry includes the affected endpoint, the nature of the gap, and the intended fix.

### Gap 1 — Idea creation does not validate org membership

**Endpoint:** `POST /api/v1/hackathons/:id/ideas`

**Gap:** The handler checks that the caller belongs to a team in the hackathon, but does not separately verify that the caller is an org member. A user who was removed from the org but retains team membership could still submit ideas.

**Intended fix:** Add `@orgSecurity.isMember(hackathon.organizationId, authentication)` check before team membership check.

---

### Gap 2 — Team join does not validate org membership

**Endpoint:** `POST /api/v1/teams/:id/members`

**Gap:** The handler checks team capacity and existing team membership but does not verify that the caller is an org member. A user with a direct link to a team ID could join without being in the org.

**Intended fix:** Resolve the team's hackathon, resolve the hackathon's org, then validate org membership before allowing the join.

---

### Gap 3 — `GET /judging/scores` lacks org scoping for managers

**Endpoint:** `GET /api/v1/hackathons/:id/judging/scores`

**Gap:** The endpoint returns scores for any hackathon ID the caller supplies. An org manager from org A can read judge scores for org B's hackathon if they know the hackathon ID.

**Intended fix:** Add org-membership validation — caller must be an org member of the hackathon's org, or be an admin.

---

### Gap 4 — Org settings endpoint path mismatch

**Endpoint:** `PATCH /api/v1/organizations/:id/settings` (correct)

**Gap:** Documentation in some places refers to `PATCH /organizations/:id` as the settings endpoint. Requests to the base path without `/settings` will 404 or hit the wrong handler. This is a documentation/client confusion risk, not a security vulnerability, but incorrect usage could result in silent no-ops.

**Intended fix:** Ensure all client code and documentation consistently use the `/settings` suffix. Add a deprecated redirect or a clear 400 response at the base PATCH path.

---

### Gap 5 — Chat GET endpoint has no `@PreAuthorize` annotation

**Endpoint:** `GET /api/v1/teams/:id/messages`

**Gap:** Any authenticated user who knows a team ID can read the full chat history of that team. The POST endpoint is protected, but the GET is not.

**Intended fix:** Add `@PreAuthorize("@teamSecurity.isMember(#teamId, authentication)")` to the GET handler.

---

### Gap 6 — File upload is authenticated-only, not context-scoped

**Endpoint:** `POST /api/v1/storage/upload/:bucketKey`

**Gap:** Any authenticated user can upload to any `bucketKey` (e.g. `banners`, `avatars`, `attachments`). There is no check that the user has a contextual relationship to the resource type they are uploading for.

**Intended fix:** Add context validation per bucket key — e.g. uploading to `attachments` requires team membership for the target entity; uploading to `banners` requires org manager or admin role.

---

### Gap 7 — Profile enumeration via `GET /profiles/:id`

**Endpoint:** `GET /api/v1/profiles/:id`

**Gap:** Any authenticated user can fetch any other user's profile by UUID. This enables enumeration of user identities, emails, and skill data across the platform with no org-scoping.

**Intended fix:** Restrict to: own profile, profiles of users who share an org with the caller, and admin access. Alternatively, use `/profiles/me` as the primary endpoint and only expose limited public fields for org members.

---

### Gap 8 — `GET /organizations/:id` does not enforce membership

**Endpoint:** `GET /api/v1/organizations/:id`

**Gap:** Any authenticated user who knows an org UUID can fetch the full org record, regardless of membership. This bypasses the `closed` visibility setting.

**Intended fix:** Enforce: if `organizations.visibility = 'closed'`, only return the org to authenticated members. If `visibility = 'open'`, limited public fields are acceptable. Admin always has access.

---

## 23. Required Tests

The following tests are required to prevent regressions on the above rules. Tests that do not yet exist are marked `[ ]`.

### Authentication and registration

- [x] `POST /auth/register` creates a `user`-role profile, not `manager` or `admin`
- [x] Admin accounts cannot be created via any API endpoint
- [x] `POST /auth/login` returns access token in body and refresh token in httpOnly cookie
- [x] Expired access token triggers silent refresh via httpOnly cookie
- [x] Failed refresh clears session and dispatches `auth:session-expired`
- [ ] Admin creating a user via admin panel does not overwrite admin's own session tokens

### Org permissions

- [x] `user`-role profile cannot create an org
- [x] `manager`-role profile can create an org
- [x] Org `member` cannot update org settings
- [ ] Org `manager` cannot invite another `manager` (must return 403)
- [ ] `GET /organizations/:id` returns 403 for non-member when `visibility = 'closed'` (gap fix)

### Hackathon permissions

- [x] Org `member` cannot create a hackathon
- [x] Org `manager` can transition hackathon from `draft` to `open`
- [x] Status transition `open → draft` returns 409
- [x] Non-admin cannot see hackathons outside their org

### Team permissions

- [x] User cannot join two teams in the same hackathon (409)
- [x] Team `leader` cannot leave while members remain (400)
- [ ] Non-org-member cannot join a team (gap fix — currently not enforced)
- [ ] `DELETE /teams/:id` returns 403 for team `member` who is not the leader

### Idea permissions

- [ ] Non-org-member cannot submit an idea even with team membership (gap fix)
- [x] Non-team-member cannot submit an idea
- [x] Non-member cannot vote on an idea
- [x] Non-member cannot comment on an idea
- [x] Two votes on the same idea by the same user return 409

### Judging permissions

- [x] Non-assigned user cannot submit `judge_scores` for a hackathon
- [x] Judge `score` field is taken from authentication context, not request body
- [x] Duplicate score for same judge/criterion/idea returns 409
- [ ] `GET /judging/scores` returns 403 for manager of a different org (gap fix)

### Chat permissions

- [x] Team `member` can send and receive messages
- [ ] Non-team-member cannot read chat history via `GET /teams/:id/messages` (gap fix)

### File storage

- [ ] Authenticated user without org manager role cannot upload to `banners` bucket (gap fix)
- [ ] Unauthenticated request to upload returns 401

### Profile

- [ ] `GET /profiles/:id` for a user in a different org returns 404 or limited fields (gap fix)

### Final submissions

- [x] Only team `leader` can create a final submission
- [x] Two submissions by the same team in the same hackathon return 409
