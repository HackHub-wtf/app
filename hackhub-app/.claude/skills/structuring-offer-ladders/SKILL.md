---
name: structuring-offer-ladders
description: Frames plan tiers, value ladders, and upgrade logic for HackHub's subscription and access model
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Structuring Offer Ladders Skill

Defines and implements plan tiers, feature gates, value ladders, and upgrade paths for HackHub. Covers the data model, permission checks, UI affordances for locked features, and the logic that moves users from free to paid tiers.

## Quick Start

1. Define tier constants in `src/utils/plans.ts` (or extend `src/utils/permissions.ts`)
2. Gate features via role/plan checks using `PermissionService` in `src/utils/permissions.ts`
3. Surface upgrade prompts in components using Mantine `Badge`, `Tooltip`, or `Modal`
4. Store active plan on the user profile in Supabase and expose it through `authStore`

## Key Concepts

**Tier definition** — each plan is a named constant with a feature flag set:
```typescript
export const PLANS = {
  free:    { maxTeams: 1, maxMembers: 5,  analytics: false, videoCall: false },
  starter: { maxTeams: 3, maxMembers: 15, analytics: false, videoCall: true  },
  pro:     { maxTeams: 999, maxMembers: 999, analytics: true, videoCall: true },
} as const

export type PlanKey = keyof typeof PLANS
```

**Gate check** — centralise limit enforcement so components stay thin:
```typescript
export function canUseFeature(plan: PlanKey, feature: keyof typeof PLANS.free): boolean {
  return Boolean(PLANS[plan][feature])
}

export function isWithinLimit(plan: PlanKey, limit: 'maxTeams' | 'maxMembers', count: number): boolean {
  return count < PLANS[plan][limit]
}
```

**Auth store integration** — surface the plan alongside the user:
```typescript
// authStore.ts — add to AuthState
plan: PlanKey

// set after login from user profile
set({ user: data.user, plan: profile.plan ?? 'free' })
```

**Value ladder** — each tier unlocks a meaningful capability jump, not just a number bump. Free → Starter unlocks video calls; Starter → Pro unlocks analytics and unlimited scale.

## Common Patterns

**Locked feature badge**
```tsx
import { Tooltip, Badge } from '@mantine/core'
import { IconLock } from '@tabler/icons-react'

function FeatureGate({ allowed, children }: { allowed: boolean; children: React.ReactNode }) {
  if (allowed) return <>{children}</>
  return (
    <Tooltip label="Upgrade to unlock this feature">
      <Badge leftSection={<IconLock size={12} />} color="gray" variant="light">
        Pro
      </Badge>
    </Tooltip>
  )
}
```

**Upgrade prompt modal**
```tsx
import { Modal, Text, Button, Stack } from '@mantine/core'

function UpgradeModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Unlock this feature">
      <Stack>
        <Text size="sm">This feature is available on the Pro plan.</Text>
        <Button component="a" href="/billing" fullWidth>
          View plans
        </Button>
      </Stack>
    </Modal>
  )
}
```

**Hard limit enforcement in service layer**
```typescript
// teamService.ts
static async createTeam(input: CreateTeamInput, plan: PlanKey, currentCount: number): Promise<Team> {
  if (!isWithinLimit(plan, 'maxTeams', currentCount)) {
    throw new Error(`Your ${plan} plan allows up to ${PLANS[plan].maxTeams} teams. Upgrade to create more.`)
  }
  // ... Supabase insert
}
```

**Supabase column** — store plan on the profiles table:
```sql
alter table profiles add column plan text not null default 'free'
  check (plan in ('free', 'starter', 'pro'));
```

RLS policies should remain role-based; plan enforcement belongs in the service layer, not in database rules.