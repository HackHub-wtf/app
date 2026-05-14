# Product Analytics

## When to use
When instrumenting funnel steps to measure where users drop off between signup and first-value milestones, or tracking feature adoption rates.

## Patterns

**Funnel event naming convention**
```typescript
// Use noun:verb format, scoped to the activation funnel
type ActivationEvent =
  | 'signup:completed'
  | 'profile:completed'
  | 'hackathon:joined'
  | 'team:joined'
  | 'team:created'
  | 'idea:submitted'

function track(event: ActivationEvent, props?: Record<string, unknown>) {
  // wire to your analytics provider (GA4, PostHog, etc.)
  window.gtag?.('event', event, props)
}
```

**Track milestone transitions, not page views**
```typescript
// In useActivationMilestones — fire once when milestone first reached
const prevHasTeam = useRef(false)
useEffect(() => {
  if (hasTeam && !prevHasTeam.current) {
    track('team:joined', { hackathonId })
  }
  prevHasTeam.current = hasTeam
}, [hasTeam, hackathonId])
```

**Attach user properties at login for cohort analysis**
```typescript
// In authStore.ts after session resolves
useEffect(() => {
  if (user) {
    window.gtag?.('set', 'user_properties', {
      role: user.role,
      has_team: String(hasTeam),
    })
  }
}, [user, hasTeam])
```

## Pitfalls
Do not fire analytics events inside `useEffect` with no guards — they re-fire on every re-render. Use a `useRef` sentinel or track only on state transitions (false → true), not on every evaluation.