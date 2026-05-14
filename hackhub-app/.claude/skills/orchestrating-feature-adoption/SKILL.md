---
name: orchestrating-feature-adoption
description: Plans feature discovery, nudges, and adoption flows for HackHub users
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Orchestrating Feature Adoption Skill

This skill plans and implements feature discovery flows, contextual nudges, and progressive adoption paths across HackHub. It maps underused features (team chat, video calls, file sharing, voting, markdown editor) to the moments and roles where they are most useful, then designs the UI hooks and notification triggers to surface them at the right time.

## Quick Start

1. Identify the target feature and its entry point in `src/components/` or `src/pages/`
2. Determine which user roles and hackathon lifecycle stages should see the nudge
3. Choose a delivery mechanism: tooltip, `NotificationCenter`, empty-state CTA, or spotlight
4. Wire state tracking through Zustand (`authStore`, `hackathonStore`) or Supabase user metadata
5. Verify the nudge respects RBAC via `src/utils/permissions.ts` before rendering

## Key Concepts

**Adoption surface points** — Where HackHub can intercept users:
- `NotificationCenter.tsx` — system notifications already routed through `notificationService.ts`
- `@mantine/spotlight` — global command palette for surfacing hidden features on demand
- Empty states in `Teams.tsx`, `Ideas.tsx`, `Hackathons.tsx` — prime real estate for first-use CTAs
- `RealtimeContext.tsx` — broadcasts that can trigger in-session nudges for other team members

**Role-aware nudges** — Always gate on permissions:
```typescript
import { hasRole } from '@/utils/permissions'
// Only show voting nudge to participants after team formation
const canSeeVotingNudge = hasRole(user, 'participant') && hackathon.phase === 'voting'
```

**Adoption state tracking** — Persist seen/dismissed state in Supabase user metadata or Zustand:
```typescript
// Lightweight in-session tracking via Zustand
const useAdoptionStore = create<AdoptionState>(set => ({
  dismissedNudges: new Set<string>(),
  dismiss: (id: string) => set(s => ({ dismissedNudges: new Set([...s.dismissedNudges, id]) }))
}))
```

**Feature→moment mapping** for HackHub:

| Feature | Best moment | Role |
|---------|-------------|------|
| Team Chat | After team join | participant |
| Video Call | 30 min before deadline | participant, manager |
| File Manager | First idea submission | participant |
| Markdown Editor | Idea description field focus | participant |
| Voting Criteria | Hackathon setup step 2 | manager, admin |
| Flexible Voting | After first vote cast | participant |

## Common Patterns

**Empty-state CTA (most effective first-use nudge)**
```typescript
// In Teams.tsx — when user has no team
{teams.length === 0 && (
  <EmptyState
    icon={<IconUsers />}
    title="You're not on a team yet"
    description="Join or create a team to start collaborating in real time."
    action={<Button onClick={openCreateTeam}>Create a team</Button>}
  />
)}
```

**Spotlight registration for hidden features**
```typescript
import { spotlight } from '@mantine/spotlight'
// Register once in App.tsx or a layout component
const actions = [
  { id: 'video-call', label: 'Start video call', onClick: () => navigate('/team/video') },
  { id: 'file-share', label: 'Share a file', onClick: () => openFileManager() },
]
```

**Notification-based nudge via `notificationService`**
```typescript
import { notificationService } from '@/services/notificationService'
// Trigger from a Supabase Realtime event or Socket.io handler
notificationService.notify({
  type: 'feature_nudge',
  title: 'Try the Markdown editor',
  message: 'Format your idea description with rich text.',
  actionLabel: 'Open editor',
  actionUrl: `/ideas/${ideaId}/edit`
})
```

**Contextual tooltip (low-friction, one-time)**
```typescript
import { Tooltip } from '@mantine/core'
// Show once using local dismissed state
<Tooltip
  label="Click to start a video call with your team"
  opened={!hasDismissed('video-nudge')}
  withArrow
>
  <ActionIcon onClick={startCall}><IconVideo /></ActionIcon>
</Tooltip>
```

**Adoption analytics hook (add before shipping)**
```typescript
function trackAdoption(feature: string, action: 'seen' | 'clicked' | 'dismissed') {
  // Wire to analytics provider (GA, Hotjar) via VITE_GOOGLE_ANALYTICS_ID
  window.gtag?.('event', `feature_${action}`, { feature_name: feature })
}
```