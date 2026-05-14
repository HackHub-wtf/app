# Features and Role Access

## Role overview

| Role | Can do |
|------|--------|
| `ADMIN` | Everything. Creates orgs, creates users in any org, manages all hackathons. |
| `MANAGER` | Manages hackathons and teams within their own org. Creates users scoped to their org. Cannot create orgs. |
| `PARTICIPANT` | Joins hackathons. Creates and joins teams. Submits project work via their team. Votes. |

## User Management

### Creating users

| Who | How | organizationId |
|-----|-----|----------------|
| Admin | `POST /api/v1/admin/users` | Required for non-admin users. Admin specifies which org the new user joins. |
| Manager | `POST /api/v1/admin/users` | Ignored — backend uses the manager's own org automatically. |

When a manager is created, they join the target org as `OWNER`. When a participant is created, they join as `MEMBER`.

### Creating organizations

Only `ROLE_ADMIN` can create organizations (`POST /api/v1/organizations`). Managers cannot create organizations.

## Hackathon access

| Role | What they see |
|------|---------------|
| Admin | All hackathons |
| Manager | Only hackathons in their organization (`GET /hackathons` is org-scoped) |
| Participant | Hackathons they are registered for |

## Teams and project submission

Teams are the primary unit for project work. There is no standalone "Ideas" concept exposed to users.

- Participants submit their project through their team.
- The `/ideas` and `/hackathons/:id/ideas` routes redirect to the team views.
- The backend retains an `ideas` table as an implementation detail (team project records), but users interact with teams, not ideas directly.

## Real-time features

Real-time updates (team chat, hackathon status changes) use STOMP over SockJS (`/ws`). The JWT access token is sent on the STOMP `CONNECT` frame, not as a query parameter.

## Notifications

Notifications are fetched from the real API at `GET /api/v1/notifications`. No mock or hardcoded notification data is used.
