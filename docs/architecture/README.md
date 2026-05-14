# Architecture Overview

HackHub is a self-hosted hackathon management platform built on a React 19 frontend and a Spring Boot 3.3 REST API, backed by PostgreSQL and MinIO. The system manages the full lifecycle from organisation setup through team formation, idea submission, voting, and judging.

## Clean Architecture (Backend)

The Spring Boot API follows Clean Architecture. Dependencies flow inward: outer layers depend on inner layers; inner layers never depend on outer ones.

```
presentation  →  application  →  domain  ←  infrastructure
```

| Layer | Package | Responsibility |
|---|---|---|
| Domain | `wtf.hackhub.domain` | Entities, value objects, domain events — zero framework imports |
| Application | `wtf.hackhub.application` | Use cases (one class each), ports (interfaces) |
| Infrastructure | `wtf.hackhub.infrastructure` | JPA repos, MinIO client, WebSocket config, JWT filter |
| Presentation | `wtf.hackhub.presentation` | REST controllers, STOMP handlers, DTOs, error mapping |

## C4 Context Diagram

```mermaid
graph TB
    Browser["Browser\n(React 19 SPA)"]
    API["Spring Boot 3.3\nREST API :8080"]
    WS["Spring WebSocket\nSTOMP /ws"]
    PG["PostgreSQL 16\n:5432"]
    MN["MinIO\nS3-compatible :9000"]

    Browser -->|"HTTP/REST\nAuthorization: Bearer"| API
    Browser -->|"SockJS + STOMP"| WS
    API -->|"JDBC / JPA"| PG
    API -->|"S3 SDK"| MN
    WS -->|"reads SecurityContext"| API
```

## Backend Component Diagram

```mermaid
graph TB
    subgraph Presentation
        RC[REST Controllers]
        SH[STOMP Handlers]
        EM[Error Mapping]
    end

    subgraph Application
        UC[Use Cases]
        PO[Ports / Interfaces]
    end

    subgraph Domain
        EN[Entities]
        VO[Value Objects]
        DE[Domain Events]
    end

    subgraph Infrastructure
        JR[JPA Repositories]
        JF[JWT Filter]
        MC[MinIO Client]
        WC[WebSocket Config]
    end

    RC --> UC
    SH --> UC
    UC --> PO
    PO --> JR
    PO --> MC
    JR --> EN
    EN --> VO
    EN --> DE
    JF --> UC
    WC --> SH
```

## Frontend Component Diagram

```mermaid
graph TB
    subgraph React["React SPA"]
        Pages[Pages]
        Comps[Components]
        Hooks[Hooks]
    end

    subgraph State["State & Data"]
        ZS[Zustand Stores\nauthStore / hackathonStore]
        TQ[TanStack Query\nserver cache]
        AC[apiClient\nfetch wrapper]
        TS[tokenStore\nin-memory JWT]
    end

    subgraph Realtime["Real-time"]
        RC[RealtimeContext\nSTOMP client]
    end

    Pages --> Comps
    Pages --> Hooks
    Hooks --> ZS
    Hooks --> TQ
    TQ --> AC
    AC --> TS
    RC --> TS
    Comps --> RC
```

## Data Flow

```
React component
  → TanStack Query hook
    → apiClient.get/post (injects Bearer token)
      → Spring REST controller
        → Application use case
          → Domain logic
            → JPA repository → PostgreSQL
```

Real-time path:

```
React component
  → useRealtime() → RealtimeContext (STOMP client)
    → /topic/team.{id}.chat  or  /topic/hackathon.{id}.updates
      ← Spring WebSocket STOMP handler
```

## Multi-Tenancy

All data is scoped to an **Organisation**. An Organisation owns many Hackathons; each Hackathon owns Teams and Ideas. PostgreSQL row-level isolation is enforced via `organization_id` foreign keys and RLS policies on every tenant-scoped table. See [multi-tenancy.md](multi-tenancy.md) for the role hierarchy and policy details.

## ADR Index

| # | Title | Status |
|---|---|---|
| [0001](../specs/ADR-001-platform-migration.md) | Platform Migration — Supabase SPA to Self-Hosted Spring Boot | accepted |
| [0002](0002-stomp-over-socket-io.md) | STOMP/WebSocket over Socket.io | accepted |
| [0003](0003-minio-for-file-storage.md) | MinIO over Supabase Storage | accepted |
