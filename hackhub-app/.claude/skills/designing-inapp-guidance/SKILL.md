---
name: designing-inapp-guidance
description: Builds tooltips, tours, and contextual guidance components for HackHub using Mantine's Tooltip, Popover, and Stepper primitives with Zustand-persisted state.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Designing Inapp Guidance Skill

Adds tooltips, onboarding tours, and contextual help to HackHub's React 19 + Mantine 8 frontend. Uses Mantine's built-in overlay components for the UI layer and Zustand for tracking which hints a user has seen, so guidance never reappears after dismissal.

## Quick Start

1. Identify the target feature and user role (participant vs manager — checked via `src/utils/permissions.ts`).
2. Choose the right pattern: tooltip for single controls, popover for rich context, stepper tour for multi-step flows.
3. Wire seen-state through `useGuidanceStore` (Zustand) so completed steps persist across sessions.
4. Gate rendering on role: admins don't need participant onboarding and vice versa.

## Key Concepts

**Component placement** — guidance components live in `src/components/` as PascalCase files (e.g., `OnboardingTour.tsx`, `FeatureTooltip.tsx`). Colocate types inline unless shared.

**Seen-state store** — a Zustand slice tracks `seenHints: Set<string>` and `completedTours: Set<string>`. Persist to `localStorage` via Zustand's `persist` middleware so state survives page reloads.

**Role-gating** — import `hasRole` from `src/utils/permissions.ts` before rendering any guidance. Managers get admin-flow tours; participants get team/idea-flow tours.

**Mantine primitives to prefer**

| Need | Mantine component |
|------|-------------------|
| Single control hint | `Tooltip` |
| Rich contextual panel | `Popover` |
| Multi-step overlay tour | `Stepper` inside `Modal` |
| Persistent inline tip | `Alert` with dismiss handler |

## Common Patterns

### Dismissable tooltip with seen-state

```typescript
import { Tooltip, ActionIcon } from '@mantine/core'
import { IconQuestionMark } from '@tabler/icons-react'
import { useGuidanceStore } from '@/store/guidanceStore'

interface FeatureTooltipProps {
  id: string
  label: string
  children: React.ReactNode
}

export function FeatureTooltip({ id, label, children }: FeatureTooltipProps) {
  const { markSeen, hasSeen } = useGuidanceStore()

  return (
    <Tooltip
      label={label}
      opened={hasSeen(id) ? false : undefined}
      withArrow
    >
      <span onClick={() => markSeen(id)}>{children}</span>
    </Tooltip>
  )
}
```

### Guidance store (Zustand + persist)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GuidanceState {
  seen: Set<string>
  hasSeen: (id: string) => boolean
  markSeen: (id: string) => void
  reset: () => void
}

export const useGuidanceStore = create<GuidanceState>()(
  persist(
    (set, get) => ({
      seen: new Set(),
      hasSeen: (id) => get().seen.has(id),
      markSeen: (id) => set((s) => ({ seen: new Set([...s.seen, id]) })),
      reset: () => set({ seen: new Set() }),
    }),
    {
      name: 'hackhub-guidance',
      storage: {
        getItem: (k) => JSON.parse(localStorage.getItem(k) ?? 'null'),
        setItem: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
        removeItem: (k) => localStorage.removeItem(k),
      },
    }
  )
)
```

### Role-gated onboarding tour

```typescript
import { useState } from 'react'
import { Modal, Stepper, Button, Group, Text } from '@mantine/core'
import { useAuthStore } from '@/store/authStore'
import { hasRole } from '@/utils/permissions'
import { useGuidanceStore } from '@/store/guidanceStore'

const TOUR_ID = 'participant-onboarding-v1'

const STEPS = [
  { label: 'Join a team', description: 'Find an open team or create your own.' },
  { label: 'Submit an idea', description: 'Pitch your concept under Ideas.' },
  { label: 'Vote', description: 'Score other teams once voting opens.' },
]

export function OnboardingTour() {
  const { user } = useAuthStore()
  const { hasSeen, markSeen } = useGuidanceStore()
  const [active, setActive] = useState(0)

  if (!user || hasSeen(TOUR_ID) || !hasRole(user, 'participant')) return null

  const isLast = active === STEPS.length - 1

  return (
    <Modal opened onClose={() => markSeen(TOUR_ID)} title="Welcome to HackHub" size="lg">
      <Stepper active={active}>
        {STEPS.map((s) => (
          <Stepper.Step key={s.label} label={s.label} description={s.description}>
            <Text mt="md">{s.description}</Text>
          </Stepper.Step>
        ))}
      </Stepper>
      <Group justify="flex-end" mt="xl">
        {active > 0 && <Button variant="default" onClick={() => setActive((a) => a - 1)}>Back</Button>}
        <Button onClick={() => (isLast ? markSeen(TOUR_ID) : setActive((a) => a + 1))}>
          {isLast ? 'Done' : 'Next'}
        </Button>
      </Group>
    </Modal>
  )
}
```

### Inline contextual help (Alert)

```typescript
import { Alert } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'
import { useGuidanceStore } from '@/store/guidanceStore'

export function VotingTip() {
  const { hasSeen, markSeen } = useGuidanceStore()
  if (hasSeen('voting-tip')) return null

  return (
    <Alert
      icon={<IconInfoCircle size={16} />}
      title="How voting works"
      withCloseButton
      onClose={() => markSeen('voting-tip')}
      mb="md"
    >
      Score each idea across the active criteria. Results are visible once the hackathon closes.
    </Alert>
  )
}
```