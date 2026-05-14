---
name: prioritizing-roadmap-bets
description: Ranks initiatives using impact, effort, and risk signals to help the HackHub team decide what to build next
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Prioritizing Roadmap Bets Skill

Analyzes proposed features or improvements against HackHub's current architecture, scoring each initiative by user impact, implementation effort, and technical risk. Produces a ranked list with reasoning so the team can make confident sequencing decisions.

## Quick Start

Provide a list of initiatives (as bullet points or free text) and this skill will score and rank them. Example invocation:

```
/prioritizing-roadmap-bets
- Add OAuth login (Google, GitHub)
- Migrate chat from Socket.io to Supabase Realtime
- Add leaderboard for idea votes
- Offline support via service worker
```

The skill reads the current codebase to ground effort and risk scores in actual code complexity rather than guesses.

## Key Concepts

**Impact** — How many users benefit and how directly. Features touching authentication (`authStore.ts`), hackathon core flows (`hackathonStore.ts`), or team collaboration get higher weight because they are on the critical path for every user.

**Effort** — Estimated scope based on files that must change. A feature requiring new Supabase migrations, new service files, new Zustand state, and new UI components scores higher effort than one that extends an existing service method.

**Risk** — Probability of breakage or regression. Changes to `RealtimeContext.tsx`, `supabase.ts`, or RLS policies carry higher risk than adding a new page component. TypeScript strict mode means type errors surface at compile time, lowering risk for well-typed changes.

**Score** — `(Impact × 2) / (Effort + Risk)`. Higher is better. Ties are broken by lower risk.

## Common Patterns

### High-signal bets (build soon)
- Small surface area, high user visibility: e.g., improving `NotificationCenter.tsx` UX — one component, no schema changes, visible to all users.
- Unblocking other work: e.g., fixing a permission gap in `permissions.ts` that prevents three other features from shipping safely.

### Low-signal bets (defer or spike first)
- Cross-cutting infrastructure changes (replacing Socket.io, switching auth providers) — high risk, diffuse impact, many files touched.
- Features with no current user demand signal in the codebase or docs.

### Risk flags to call out
- Any change touching `supabase/` migrations — requires coordinated deploy and potential data migration.
- Changes to `RealtimeContext.tsx` or `useSocket.ts` — real-time bugs are hard to reproduce.
- New dependencies that duplicate existing ones (e.g., adding a second markdown library when `@uiw/react-md-editor` already exists).