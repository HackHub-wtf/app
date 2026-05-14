# API Changes

Recent additions and breaking changes to the Spring Boot API consumed by this frontend.

---

## `POST /api/v1/admin/users` — new

Creates a user and associates them with an organization in one call.

**Required role:** `ROLE_ADMIN` or `ROLE_MANAGER`

**Request body**

```json
{
  "email": "string",
  "name": "string",
  "password": "string",
  "role": "ADMIN | MANAGER | PARTICIPANT",
  "organizationId": "uuid"
}
```

**Behavior**

- Admin callers: `organizationId` is used as given. Required when `role` is not `ADMIN`.
- Manager callers: `organizationId` in the body is ignored. The backend resolves it from the manager's own organization.
- The new user is added to the org with `OWNER` membership if their role is `MANAGER`, or `MEMBER` if `PARTICIPANT`.

**Frontend impact:** The admin user-creation form must collect `organizationId` when the logged-in user is an admin and the new user's role is not admin. The field should be hidden (or auto-set) when the logged-in user is a manager.

---

## `POST /api/v1/organizations` — restricted

**Changed:** Now requires `ROLE_ADMIN`. Previously accessible to managers.

**Frontend impact:** Hide the "Create organization" affordance for manager-role users.

---

## `PATCH /api/v1/hackathons/{id}` — fixed

Manager 403 errors on hackathon edit are resolved. Managers can now patch hackathons that belong to their organization.

**Frontend impact:** No change needed. The fix is backend-only.

---

## WebSocket `/ws` — STOMP over SockJS

Real-time connection uses STOMP over SockJS at the `/ws` endpoint. The JWT access token must be sent in the `CONNECT` frame header, not as a URL query parameter.

```typescript
// STOMP CONNECT headers
{
  Authorization: `Bearer ${tokenStore.getAccessToken()}`
}
```

**Frontend impact:** `RealtimeContext.tsx` must pass the token in STOMP connect headers. Do not append the token to the `/ws` URL.

---

## Bug fixes with no API surface change

These were fixed without changing the API contract:

| Issue | Fix |
|-------|-----|
| `HackathonNotAcceptingTeamsException` returned 500 | Now mapped to 409 in `GlobalExceptionHandler` |
| `HackathonForTeamNotFoundException` returned 500 | Now mapped to 404 in `GlobalExceptionHandler` |
