# Roadmap Experiments

## When to use
When A/B testing onboarding variants (e.g. modal wizard vs inline checklist) or progressively rolling out new onboarding steps to a subset of users before full release.

## Patterns

**Feature flag via profile metadata**
```typescript
const variant = profile.experiments?.onboarding_variant ?? 'control'

if (variant === 'checklist') return <OnboardingChecklist />
return <OnboardingWizard />
```

**Assign variant on first login**
```typescript
async function assignVariant(userId: string) {
  const variant = Math.random() < 0.5 ? 'checklist' : 'control'
  await supabase
    .from('profiles')
    .update({ experiments: { onboarding_variant: variant } })
    .eq('id', userId)
  return variant
}
```

**Step ordering experiment**
```typescript
const STEP_ORDERS: Record<string, string[]> = {
  control:   ['profile', 'join-team', 'submit-idea'],
  team_first: ['join-team', 'profile', 'submit-idea'],
}

const steps = STEP_ORDERS[variant] ?? STEP_ORDERS.control
```

## Pitfalls
Always assign the variant once and persist it — re-randomizing on each login creates inconsistent experiences and corrupts funnel data. Read `profile.experiments` in `AuthStore.initialize()` and treat it as immutable for the session.