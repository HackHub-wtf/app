# Roadmap Experiments for Guidance

## When to use
Use this reference when A/B testing guidance copy, trying different hint placements, or gradually rolling out a new onboarding flow to a subset of users before making it the default.

## Patterns

### Feature-flag-style rollout with hint IDs
Version hint IDs to run parallel experiments without touching existing dismissed state:

```
'participant-onboarding-v1'  // original
'participant-onboarding-v2'  // shorter, 2-step tour being tested
```

Gate which version a user sees based on a stable hash of their user ID:

```typescript
function assignCohort(userId: string, variants: string[]): string {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return variants[hash % variants.length]
}

const tourId = assignCohort(user.id, [
  'participant-onboarding-v1',
  'participant-onboarding-v2',
])
```

### Swapping hint copy without code deploys
Store hint copy in a `HINTS` map keyed by hint ID so copy can be updated without touching component logic:

```typescript
const HINTS: Record<string, { title: string; body: string }> = {
  'voting-tip-v1': { title: 'How voting works', body: 'Score each idea...' },
  'voting-tip-v2': { title: 'Ready to vote?', body: 'Tap any idea to rate it...' },
}
```

### Cleaning up old experiments
When an experiment concludes, delete the losing variant's hint ID from `HINTS` and from the Zustand store's initial `seen` set. Don't leave dead hint IDs accumulating in `localStorage`.

## Pitfalls
- Don't use `Math.random()` to assign cohorts — it reassigns on every render. Use a deterministic hash of `user.id` as shown above.
- Keep experiment variants to two at a time. More than two variants requires a larger user base to reach statistical significance in a hackathon-sized product.