# Roadmap & Experiment Metrics

## When to use
Instrument A/B tests, feature flags, and rollout experiments. Use when validating whether a new flow (e.g. redesigned idea submission, new onboarding checklist) performs better than the control.

## Patterns

**Experiment exposure event**
```typescript
// Fire once when the user is bucketed into a variant — not on every render
track('experiment:exposed', {
  userId,
  experimentId: 'idea_submission_v2',
  variant: 'treatment', // or 'control'
})
```

**Outcome event tied to experiment**
```typescript
// Attach experimentId to conversion events so you can segment in your analytics tool
track(EVENTS.IDEA_SUBMITTED, {
  userId,
  hackathonId,
  ideaId: data.id,
  experimentId: activeExperiment ?? undefined,
})
```

**Feature flag check with tracking**
```typescript
function useFeatureFlag(flag: string, userId: string): boolean {
  const enabled = getFlag(flag, userId) // your flag SDK
  useEffect(() => {
    track('feature_flag:evaluated', { userId, flag, enabled })
  }, [flag, userId, enabled])
  return enabled
}
```

## Pitfalls
- Fire `experiment:exposed` only when the user actually sees the variant, not when the flag is evaluated server-side. Inflated exposure counts corrupt significance calculations.
- Do not run experiments on pages that require authentication before the auth state resolves — the `userId` will be missing and events will be unattributable.