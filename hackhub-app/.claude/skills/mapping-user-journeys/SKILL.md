---
name: mapping-user-journeys
description: Maps in-app journeys and identifies friction points in code
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Mapping User Journeys Skill

This skill traces how users move through HackHub — from login to idea submission, team creation to voting — by reading routes, components, services, and state transitions. It surfaces friction points: missing loading states, broken error boundaries, permission gaps, dead-end navigation, and data-flow bottlenecks.

## Quick Start

To map a journey, identify the entry point (a page or user action) and trace forward through:

1. `src/App.tsx` — route definitions and protected route wrappers
2. `src/pages/` — page components and their data dependencies
3. `src/services/` — service calls triggered during the journey
4. `src/store/` — Zustand state touched along the path
5. `src/utils/permissions.ts` — RBAC gates that can block progress

```
/mapping-user-journeys "participant registers and submits an idea"
```

## Key Concepts

**Journey entry points** — `src/pages/Login.tsx`, `src/pages/Home.tsx`, direct URL navigation via React Router 7.x routes in `src/App.tsx`.

**Role gates** — `PermissionService` in `src/utils/permissions.ts` controls what each role (admin, manager, participant) can reach. A friction point exists when a user hits a gate without a clear explanation or redirect.

**Data readiness** — TanStack Query `isLoading` / `error` states in page components. Missing guards cause blank renders or crashes when data hasn't arrived.

**Real-time transitions** — `RealtimeContext` and `useSocket` coordinate state updates across clients. Friction appears when optimistic updates in `useMutation` are not rolled back correctly on error.

**State handoff** — `authStore` and `hackathonStore` (Zustand) must be initialized before pages that depend on them render. Check `initialize()` call order in `src/main.tsx`.

## Common Patterns

**Tracing a route to its data**
```
App.tsx route → Page component → useQuery(queryFn: ServiceMethod) → Supabase table
```
Grep for the page name in `App.tsx`, read the page file, find `useQuery` / `useMutation` calls, follow to the service, check the Supabase query for missing filters or unhandled errors.

**Finding missing loading/error states**
Grep pages and components for `useQuery` without adjacent `isLoading` or `error` handling — these are crash-on-empty friction points.

**Spotting permission dead-ends**
Grep `permissions.ts` for `hasRole` / `canManageTeam` / `canVote` calls, then check whether the calling component renders an explanation or silently hides the action with no feedback to the user.

**Mapping real-time drop-offs**
Trace Socket.io event subscriptions in `useSocket.ts` and `RealtimeContext.tsx`. A friction point exists when a `socket.on` listener is registered but no cleanup (`socket.off`) runs on unmount, or when an event fires after a component has navigated away.

**Auditing form submit paths**
Follow React Hook Form `handleSubmit` → Zod `parse` → service call → query invalidation. Missing `queryClient.invalidateQueries` after a mutation leaves the UI stale and confuses users about whether their action succeeded.
```

Save this to `.claude/skills/mapping-user-journeys.md` in the project root (needs write permission to that path).