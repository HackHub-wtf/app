---
name: triaging-user-feedback
description: Routes user feedback into backlog items and quick wins for the HackHub React/TypeScript/Supabase application
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Triaging User Feedback Skill

Takes raw user feedback and sorts it into two buckets: quick wins (small scope, high impact, ships fast) and backlog (larger effort, needs design or infrastructure work). Produces prioritized, actionable items grounded in HackHub's existing architecture so developers can pick up work immediately.

## Quick Start

1. Paste or describe the feedback
2. Skill reads the affected area (component, service, page) to assess scope
3. Each item is classified as **quick win** or **backlog** with a rationale
4. Quick wins get a concrete file path and change description; backlog items get a scope estimate and open questions

## Key Concepts

**Quick Win** — change touches one file or one clearly bounded component; no schema migration, no new service, no cross-cutting concern. Typically: copy fixes, error state improvements, loading skeleton additions, icon swaps, minor form validation tweaks.

**Backlog** — requires coordination across layers (component + service + Supabase schema), introduces a new module, or needs product/design input. Typically: new feature flows, RLS policy changes, new real-time events, new Zustand store slices.

**Severity signals** — words like "broken", "crash", "can't submit", "never loads" bump an item toward quick-win urgency regardless of scope. Words like "would be nice", "maybe", "in the future" lower priority.

**HackHub layer map** (used to estimate scope):

| Feedback touches | Likely scope |
|-----------------|-------------|
| UI copy, color, icon | Quick win — `src/components/` or `src/pages/` |
| Form validation message | Quick win — Zod schema in same file |
| Loading/error state missing | Quick win — add guard around React Query result |
| New column on a table | Backlog — Supabase migration + service + component |
| New real-time event | Backlog — Socket.io handler + RealtimeContext + UI |
| Permission change | Backlog — `src/utils/permissions.ts` + RLS policy |
| New page/route | Backlog — page component + React Router entry + nav |

## Common Patterns

### Classifying a batch of feedback

For each feedback item, state:
- **Item** — one-line summary
- **Bucket** — `quick-win` or `backlog`
- **Affected layer** — presentation / state / service / data / real-time
- **File(s)** — specific paths when determinable (use Grep/Glob to confirm)
- **Action** — imperative description of the change (`add error state to TeamCard when fetch fails`)
- **Rationale** — one sentence on why this bucket

### Quick-win template

```
[quick-win] add empty state to Ideas page when no ideas exist
- File: src/pages/Ideas.tsx
- Action: wrap list render with a Mantine <Center> + <Text> block when data.length === 0
- No service or schema changes needed
```

### Backlog template

```
[backlog] let participants filter ideas by tag
- Layers: presentation (Ideas.tsx), service (ideaService.ts), data (tags column + RLS)
- Open questions: tag taxonomy — free-form or predefined list?
- Rough size: medium (new schema column, migration, service method, UI filter component)
```

### Grep before estimating

Before calling something a quick win, confirm the component exists and check its current implementation:

```bash
grep -r "Ideas" src/pages/ --include="*.tsx" -l
grep -r "EmptyState\|empty" src/components/ --include="*.tsx" -l
```

If a shared empty-state component already exists, the quick win is even smaller. If it doesn't, factor in creating one.

### Escalating a quick win to backlog

If reading the target file reveals the change needs:
- A new Supabase query (check `src/services/`)
- A new Zustand action (check `src/store/`)
- A socket event (check `src/contexts/RealtimeContext.tsx`)

...re-classify as backlog and note the additional files.