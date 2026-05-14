---
name: framing-release-stories
description: Builds launch narratives, assets, and rollout checklists for HackHub features
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Framing Release Stories Skill

Generates launch narratives, communication assets, and rollout checklists for HackHub features. Given a feature branch, PR, or description, it reads the relevant code changes, distills user-facing impact, and produces a release story package: a one-liner headline, a short narrative paragraph, an audience-segmented impact summary, and a go/no-go rollout checklist grounded in the actual codebase state.

## Quick Start

Invoke when shipping any user-facing change:

```
/framing-release-stories "flexible voting criteria"
/framing-release-stories --feature src/components/FlexibleVotingInterface.tsx
/framing-release-stories --pr 42
```

The skill reads changed files, identifies affected user roles (admin, manager, participant), and produces a rollout package ready to paste into a changelog, Slack announcement, or GitHub release.

## Key Concepts

**Headline** — one sentence, plain language, no jargon. States what users can now do, not what code changed.

**Narrative paragraph** — 3–5 sentences covering: what the feature does, who benefits, and what problem it replaces or removes.

**Audience impact table** — rows for each HackHub role (Hackathon Manager, Team Lead, Participant, Admin). Columns: what changed, what they can do now that they couldn't before.

**Rollout checklist** — derived from the codebase, not invented. Checks for: Supabase migrations applied, RLS policies updated, environment variables documented in `.env.example`, feature flag or permission guard wired in `src/utils/permissions.ts`, lint and build passing.

**Risk flags** — surfaces breaking changes to existing Zustand stores, React Query cache keys, or Socket.io event names that could affect live sessions.

## Common Patterns

**New component shipped** — read the component file, identify props and user interactions, map to participant or manager workflow, write the narrative from the user's perspective.

**Service layer change** — read the service file diff, check which pages call it (`Grep` for the service name across `src/pages/`), list affected flows, flag any cache invalidation gaps.

**Permission change** — read `src/utils/permissions.ts`, identify added or removed roles/checks, write audience impact for each affected role explicitly.

**Database migration** — check `supabase/` and `migrations/` for new tables or columns, confirm RLS policies exist, add migration step to rollout checklist.

**Real-time event change** — grep for the event name in `src/contexts/RealtimeContext.tsx` and `src/hooks/`, flag if event contracts changed and existing clients need updating.