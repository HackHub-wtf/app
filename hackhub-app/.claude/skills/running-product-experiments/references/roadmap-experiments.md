# Roadmap & Experiment Lifecycle

## When to use
Plan, track, and clean up experiments so the codebase does not accumulate dead flags.

## Patterns

**Experiment registry (single source of truth)**
```typescript
// src/utils/experiments.ts
export const EXPERIMENTS = {
  new_voting_ui:       { rollout: 20, expiresAt: '2026-06-01', owner: 'product' },
  onboarding_v2:       { rollout: 50, expiresAt: '2026-06-15', owner: 'growth' },
  criteria_tooltip_v1: { rollout: 25, expiresAt: '2026-05-31', owner: 'ux' },
} as const

export type ExperimentKey = keyof typeof EXPERIMENTS
```

**useExperiment reads from the registry**
```typescript
export function useExperiment(key: ExperimentKey): boolean {
  const user = useAuthStore(s => s.user)
  if (!user) return false
  const { rollout } = EXPERIMENTS[key]
  return isInRollout(user.id, key, rollout)
}
```

**Expiry check in CI (optional lint rule or script)**
```bash
# scripts/check-experiment-expiry.sh
node -e "
const { EXPERIMENTS } = require('./src/utils/experiments.ts')
const today = new Date().toISOString().slice(0, 10)
Object.entries(EXPERIMENTS).forEach(([k, v]) => {
  if (v.expiresAt < today) console.error('Expired experiment:', k)
})
"
```

## Pitfalls
- Do not let `expiresAt` be aspirational. If the date passes and the flag is not removed, add a CI check that fails the build.
- Avoid embedding rollout percentages in component files — they diverge from the registry and become impossible to audit.