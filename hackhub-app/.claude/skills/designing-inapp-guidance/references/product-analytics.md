# Product Analytics for Guidance

## When to use
Use these patterns to measure whether guidance actually drives behavior — e.g., whether users who see the onboarding tour complete their team join step more often than those who skip it.

## Patterns

### Event naming convention
Emit guidance events with a `guidance:` prefix so they're easy to filter in analytics dashboards.

```
guidance:tour_started       { tourId, userId, role }
guidance:tour_completed     { tourId, userId, stepsViewed }
guidance:tour_dismissed     { tourId, userId, stepDismissedAt }
guidance:hint_seen          { hintId, userId }
guidance:hint_dismissed     { hintId, userId }
```

### Wrapping markSeen with analytics
Extend `useGuidanceStore` actions at the call site rather than inside the store, so analytics stays out of the state layer:

```typescript
function useTrackedGuidance() {
  const { hasSeen, markSeen } = useGuidanceStore()
  const { user } = useAuthStore()

  return {
    hasSeen,
    markSeen: (id: string) => {
      markSeen(id)
      analytics.track('guidance:hint_dismissed', { hintId: id, userId: user?.id })
    },
  }
}
```

### Measuring tour completion rate
Track `stepDismissedAt` (the index when the modal was closed early) to identify which step loses users. Store this temporarily in component state; emit on `onClose`.

```typescript
const [lastStep, setLastStep] = useState(0)
// In Modal onClose:
analytics.track('guidance:tour_dismissed', { tourId: TOUR_ID, stepDismissedAt: lastStep })
markSeen(TOUR_ID)
```

## Pitfalls
- Don't emit analytics events inside the Zustand store — it makes the store impure and hard to test. Keep side effects at the component boundary.
- Avoid tracking PII in guidance events. `userId` (UUID) is safe; email and name are not.