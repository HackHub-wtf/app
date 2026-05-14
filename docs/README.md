# HackHub Docs

Everything you need to understand, run, and extend HackHub.

---

## Architecture

System design, data model, auth, realtime, and ADRs.

| Doc | What it covers |
|-----|---------------|
| [Auth Flow](architecture/auth-flow.md) | JWT RS256 access + refresh token lifecycle |
| [Data Model](architecture/data-model.md) | Entity relationships and key constraints |
| [Hackathon Lifecycle](architecture/hackathon-lifecycle.md) | Status machine: draft → open → running → completed |
| [Multi-Tenancy](architecture/multi-tenancy.md) | Org isolation, cross-org access rules |
| [Realtime](architecture/realtime.md) | STOMP over SockJS — team chat and live updates |
| [Security & Permissions](architecture/security-permissions.md) | Backend-first auth model, role matrix, hardening checklist |
| [API Changes](architecture/api-changes.md) | Recent additions and breaking changes |
| **ADRs** | |
| [ADR-0002: STOMP over Socket.io](architecture/0002-stomp-over-socket-io.md) | Why we replaced Socket.io with Spring WebSocket |
| [ADR-0003: MinIO for Storage](architecture/0003-minio-for-file-storage.md) | File storage decision |
| [ADR-0004: Judging Modes](architecture/0004-judging-modes.md) | Community vs panel vs blended scoring |

---

## Features

Role access matrix and product behavior specs.

| Doc | What it covers |
|-----|---------------|
| [Features & Role Access](features/features-and-role-access.md) | What each role (admin, manager, participant) can do |

---

## Runbooks

Operational procedures.

| Doc | What it covers |
|-----|---------------|
| [Deploy](runbooks/deploy.md) | Docker Compose deploy, rollback, health checks, production checklist |

---

## Definition of Done

| Doc | What it covers |
|-----|---------------|
| [Definition of Done](dod/definition-of-done.md) | Quality gates for shipping features |

---

## Specs

Technical specs and migration plans.

| Doc | What it covers |
|-----|---------------|
| [Migration Plan](specs/MIGRATION-PLAN.md) | Supabase → Spring Boot migration |
| [ADR-001: Platform Migration](specs/ADR-001-platform-migration.md) | Decision record for the migration |

---

## Design

Visual identity, wireframes, and component research.

See [design/README.md](design/README.md).

---

## Session Notes

Engineering decision log from working sessions.

- [2026-05-13 — Production Hardening](sessions/2026-05-13-production-hardening.md)
