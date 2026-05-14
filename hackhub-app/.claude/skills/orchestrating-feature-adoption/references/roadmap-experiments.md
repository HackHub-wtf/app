# Roadmap Experiments

## When to use
When running A/B tests, phased rollouts, or validating whether a new adoption mechanic (e.g. a new onboarding step or spotlight action) improves engagement before making it permanent.

## Patterns

**Feature flag via Supabase user metadata**
```typescript
const isInExperiment = user.user_metadata?.experiments?.includes('new-onboarding-v2')

if (isInExperiment) {
  return <NewOnboardingFlow />
}
return <CurrentOnboardingFlow />
```

**Percentage rollout using user ID hash**
```typescript
function inRollout(userId: string, percentage: number): boolean {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (hash % 100) < percentage
}

// Show new voting nudge to 20% of users
if (inRollout(user.id, 20)) {
  showVotingSpotlightNudge()
}
```

**Experiment result query**
```typescript
const { data } = await supabase
  .from('adoption_events')
  .select('action, count(*)')
  .eq('feature', 'new-onboarding-v2')
  .gte('occurred_at', experimentStartDate)
```

## Pitfalls
Don't persist experiment assignment only in Zustand — it resets on page reload. Write the assignment to `user.user_metadata` or a Supabase table so users stay in the same cohort across sessions.