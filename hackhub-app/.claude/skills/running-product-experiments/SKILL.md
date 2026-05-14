---
name: running-product-experiments
description: Sets up product experiments and rollout checks for HackHub's React/TypeScript/Supabase stack
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Running Product Experiments Skill

Sets up feature flags, A/B experiments, and gradual rollout checks in HackHub. Works with the existing Zustand store, Supabase user metadata, and React context patterns to gate features by user cohort, role, or percentage rollout — without introducing an external feature-flag service unless one is already present.

## Quick Start

1. Identify the experiment scope: UI variant, new feature gate, or behavioral change.
2. Add a flag to the user profile or Supabase `app_metadata`/`user_metadata`, or derive cohort from `user.id` hash.
3. Read the flag in a Zustand selector or a `useExperiment` hook.
4. Wrap the experimental code path behind the flag check.
5. Add a rollout guard (percentage bucket or explicit allow-list) before enabling broadly.
6. Instrument the decision point so analytics can attribute outcomes.

## Key Concepts

**Cohort assignment** — deterministic bucketing via `parseInt(userId.slice(-4), 16) % 100 < rolloutPercent` keeps the same user in the same bucket across sessions without a database write.

**Flag sources** — flags can live in Supabase `user_metadata` (per-user overrides), a `feature_flags` table (org/hackathon-scoped), or a local constant map in `src/utils/experiments.ts` for short-lived experiments.

**Zustand integration** — expose `activeExperiments: string[]` from `authStore` so any component can read flags without prop-drilling.

**RLS safety** — if flags are stored in Supabase, ensure the `feature_flags` table has RLS policies that prevent users from promoting themselves into experiments.

**Cleanup discipline** — experiments are temporary. Keep a `expiresAt` field or a comment with the target removal date to avoid flag accumulation.

## Common Patterns

**Deterministic percentage rollout**
```typescript
// src/utils/experiments.ts
export function isInRollout(userId: string, featureKey: string, percent: number): boolean {
  const seed = `${featureKey}:${userId}`
  const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return hash % 100 < percent
}
```

**useExperiment hook**
```typescript
// src/hooks/useExperiment.ts
import { useAuthStore } from '@/store/authStore'
import { isInRollout } from '@/utils/experiments'

export function useExperiment(featureKey: string, rolloutPercent = 100): boolean {
  const user = useAuthStore(s => s.user)
  if (!user) return false
  return isInRollout(user.id, featureKey, rolloutPercent)
}
```

**Gating a component**
```typescript
function IdeaFeedPage() {
  const showNewVotingUI = useExperiment('new_voting_ui', 20)

  return showNewVotingUI
    ? <FlexibleVotingInterface />
    : <LegacyVotingInterface />
}
```

**Supabase-backed flag (org-scoped)**
```typescript
const { data: flags } = useQuery({
  queryKey: ['feature-flags', hackathonId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key, enabled')
      .eq('hackathon_id', hackathonId)
    if (error) throw error
    return data
  },
  staleTime: 5 * 60 * 1000
})

const hasFlag = (key: string) => flags?.some(f => f.key === key && f.enabled) ?? false
```

**Role-gated rollout (managers only)**
```typescript
export function useManagerExperiment(featureKey: string): boolean {
  const user = useAuthStore(s => s.user)
  const role = useAuthStore(s => s.profile?.role)
  if (!user || role !== 'manager') return false
  return isInRollout(user.id, featureKey, 100)
}
```