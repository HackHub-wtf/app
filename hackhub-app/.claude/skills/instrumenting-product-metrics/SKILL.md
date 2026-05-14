---
name: instrumenting-product-metrics
description: Defines product events, funnels, and activation metrics for HackHub's React/TypeScript frontend using Supabase and analytics integrations
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Instrumenting Product Metrics Skill

Handles instrumentation of product analytics in HackHub — defining typed event schemas, tracking user actions through key funnels (registration → hackathon join → team formation → idea submission), and measuring activation milestones. Works within HackHub's service layer pattern, keeping tracking calls out of components and behind thin service abstractions.

## Quick Start

1. Identify the user action or funnel stage to instrument
2. Define a typed event in `src/services/analyticsService.ts` (create if absent)
3. Call `track()` from the relevant service method or React hook — not inline in JSX
4. Validate the event fires in the browser console or your analytics dashboard
5. Add the event name to the shared `EVENTS` constant so it stays consistent across callers

## Key Concepts

**Event taxonomy** — all events follow `<noun>:<verb>` naming (e.g. `hackathon:joined`, `team:created`, `idea:submitted`, `vote:cast`). Keep names stable — renaming breaks historical funnels.

**Activation milestones** — the critical path is: account created → first hackathon joined → team formed or joined → first idea submitted. Each step must fire a distinct event so drop-off is measurable.

**Funnels** — map directly to HackHub flows:
- Onboarding funnel: `user:registered` → `hackathon:viewed` → `hackathon:joined`
- Collaboration funnel: `team:viewed` → `team:joined` or `team:created` → `chat:message_sent`
- Submission funnel: `idea:started` → `idea:submitted` → `vote:cast`

**Service layer placement** — tracking calls live in `src/services/` (e.g. inside `TeamService.createTeam()`, `IdeaService.submitIdea()`), not scattered across page components.

**User identity** — attach `userId` from `useAuthStore` to every event. For anonymous sessions, use a stable anonymous ID until the user authenticates.

## Common Patterns

**Typed event schema**
```typescript
// src/services/analyticsService.ts
export const EVENTS = {
  HACKATHON_JOINED: 'hackathon:joined',
  TEAM_CREATED: 'team:created',
  TEAM_JOINED: 'team:joined',
  IDEA_SUBMITTED: 'idea:submitted',
  IDEA_VOTED: 'vote:cast',
  CHAT_MESSAGE_SENT: 'chat:message_sent',
} as const

type EventName = typeof EVENTS[keyof typeof EVENTS]

interface EventProperties {
  userId: string
  hackathonId?: string
  teamId?: string
  ideaId?: string
  [key: string]: string | number | boolean | undefined
}

export function track(event: EventName, properties: EventProperties): void {
  // Replace with your analytics provider (PostHog, Amplitude, GA4, etc.)
  if (import.meta.env.DEV) console.debug('[analytics]', event, properties)
  // window.analytics?.track(event, properties)
}
```

**Tracking inside a service method**
```typescript
// src/services/teamService.ts
import { track, EVENTS } from './analyticsService'

static async createTeam(input: CreateTeamInput, userId: string): Promise<Team> {
  const { data, error } = await supabase.from('teams').insert(input).select().single()
  if (error) throw new Error(error.message)
  track(EVENTS.TEAM_CREATED, { userId, hackathonId: input.hackathonId, teamId: data.id })
  return data
}
```

**Tracking activation in a hook**
```typescript
// src/hooks/useActivation.ts
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { track, EVENTS } from '@/services/analyticsService'

export function useTrackHackathonJoined(hackathonId: string | null) {
  const user = useAuthStore(s => s.user)
  useEffect(() => {
    if (!hackathonId || !user) return
    track(EVENTS.HACKATHON_JOINED, { userId: user.id, hackathonId })
  }, [hackathonId, user])
}
```

**Funnel drop-off guard** — fire a `funnel:abandoned` event on unmount when the user started but did not complete a multi-step flow:
```typescript
useEffect(() => {
  return () => {
    if (!submitted) track('funnel:abandoned', { userId, step: 'idea_draft', hackathonId })
  }
}, [])
```

**Environment gate** — never send events in test runs:
```typescript
const IS_TRACKING_ENABLED = import.meta.env.PROD || import.meta.env.VITE_ANALYTICS_DEBUG === 'true'
if (IS_TRACKING_ENABLED) track(event, props)
```