# Security and Permissions

## Core principle

Authorization lives in the backend. The frontend hides or disables UI elements based on role as a UX courtesy only. Any action the UI exposes is re-validated server-side before it executes. Do not rely on the frontend to enforce access control.

## Roles

| Role | Scope |
|------|-------|
| `ROLE_ADMIN` | Full platform access. Creates organizations, creates users in any org, manages everything. |
| `ROLE_MANAGER` | Scoped to their own organization. Creates users within their org. Cannot create organizations. |
| `ROLE_PARTICIPANT` | Standard participant. Joins hackathons and teams. No admin or manager privileges. |

## User creation: `POST /api/v1/admin/users`

Creates a new user and associates them with an organization.

**Request body**

```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "password": "...",
  "role": "PARTICIPANT",
  "organizationId": "uuid"
}
```

**Authorization rules**

- Requires `ROLE_ADMIN` or `ROLE_MANAGER`.
- When called by an `ADMIN`: `organizationId` is required for non-admin users. The user is added to that org with `OWNER` role if the new user is a manager, or `MEMBER` role if a participant.
- When called by a `MANAGER`: `organizationId` in the request body is ignored. The backend auto-resolves it from the manager's own organization. The manager cannot assign users to a different org.

**Org membership role mapping**

| New user role | Org membership role assigned |
|---------------|------------------------------|
| `MANAGER` | `OWNER` |
| `PARTICIPANT` | `MEMBER` |

## Organization creation: `POST /api/v1/organizations`

Requires `ROLE_ADMIN`. Managers can no longer create organizations.

## Manager data scoping

- `GET /api/v1/hackathons` returns only hackathons belonging to the manager's organization.
- `GET /api/v1/organizations/my` returns only organizations the manager belongs to.

## Security hardening checklist

| Check | Status |
|-------|--------|
| All endpoints re-validate role server-side | Required |
| Sensitive endpoints require `Authorization: Bearer <token>` | Required |
| `POST /api/v1/organizations` restricted to `ROLE_ADMIN` | Done |
| Manager's `organizationId` auto-resolved server-side (not from request body) | Done |
| Frontend UI gating is UX-only, not a security control | Policy |
| Admin user creation uses `credentials: 'omit'` on register endpoint | N/A — new endpoint, not the public register endpoint |
