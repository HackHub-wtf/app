---
name: scoping-feature-work
description: Breaks features into MVP slices and acceptance criteria for HackHub's React/TypeScript/Supabase stack
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Scoping Feature Work Skill

Helps decompose a feature request into ordered MVP slices with clear acceptance criteria, wired to HackHub's layered architecture (Supabase data layer → service → React Query / Zustand → Mantine UI). Each slice is independently shippable and maps to a concrete file or module in the codebase.

## Quick Start

When invoked with a feature description, this skill:

1. Reads relevant existing modules to understand current shape (services, stores, components, types)
2. Identifies the minimal data model change (Supabase table / RLS policy, if any)
3. Cuts the feature into numbered slices, smallest first
4. Writes acceptance criteria per slice in Given / When / Then form
5. Flags cross-cutting concerns: permissions (`src/utils/permissions.ts`), real-time events (`RealtimeContext`), notifications

## Key Concepts

**MVP slice** — the smallest unit that can be merged and used in production without breaking existing behavior. Each slice has one clear owner layer: data, service, state, or UI.

**Layer order** — always scope bottom-up:
1. Database schema / RLS (`supabase/migrations/`)
2. Service method (`src/services/*Service.ts`)
3. React Query hook or Zustand action (`src/hooks/` or `src/store/`)
4. UI component or page (`src/components/` or `src/pages/`)
5. Real-time wiring (`src/contexts/RealtimeContext.tsx`) — only when the feature needs live updates

**Acceptance criteria format**
```
Given <precondition>
When  <action>
Then  <observable outcome>
And   <TypeScript / RLS constraint that enforces it>
```

**Permissions gate** — any slice that touches role-gated data must include a criterion referencing `hasRole()` / `canManageTeam()` / `canVote()` from `src/utils/permissions.ts`.

## Common Patterns

### Feature touches only the UI
Scope: one new or modified component in `src/components/` or `src/pages/`. No migration needed.
```
Slice 1 — render with static/mock data (component + Storybook-style isolation)
Slice 2 — wire to existing React Query hook
Slice 3 — add loading / error states
```

### Feature needs a new Supabase column
```
Slice 1 — migration + RLS policy update
Slice 2 — extend TypeScript type in `src/types/` and service method
Slice 3 — React Query query key update + cache invalidation
Slice 4 — UI change consuming the new field
```

### Feature needs real-time updates
```
Slice 1 — data + service layer (same as above)
Slice 2 — emit / listen in RealtimeContext; add Socket.io event name constant
Slice 3 — subscribe in the relevant component via useRealtime()
Slice 4 — optimistic update with rollback in useMutation onMutate / onError
```

### Scoping output template
```
## Feature: <name>

### Context
<one paragraph — what problem this solves, who benefits>

### Out of scope (MVP)
- <thing deferred to follow-on>

### Slices

#### Slice 1 — <layer: data | service | state | UI>
Files: src/...
AC:
  Given ...
  When  ...
  Then  ...
  And   TypeScript strict mode passes, no `any`

#### Slice 2 — ...
```