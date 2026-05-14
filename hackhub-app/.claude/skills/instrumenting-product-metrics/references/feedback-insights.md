# Feedback & Insight Metrics

## When to use
Track qualitative signals: NPS prompts, in-app surveys, error encounters, and support-triggering events. Use when adding feedback widgets, error boundaries, or rage-click detection.

## Patterns

**Survey impression and response**
```typescript
track('survey:shown', { userId, surveyId: 'post_hackathon_nps' })
track('survey:submitted', {
  userId,
  surveyId: 'post_hackathon_nps',
  score: npsScore,            // numeric 0–10
  hackathonId,
})
```

**Error boundary event**
```typescript
// src/components/ErrorBoundary.tsx
componentDidCatch(error: Error) {
  track('error:boundary_triggered', {
    userId: authStore.getState().user?.id ?? 'anonymous',
    errorMessage: error.message,
    page: window.location.pathname,
  })
}
```

**Rage-click / frustration signal**
```typescript
// Attach to elements known to cause confusion (disabled buttons, locked features)
function handleLockedFeatureClick(featureName: string) {
  track('locked_feature:clicked', { userId, featureName, hackathonId })
}
```

## Pitfalls
- Never include free-text user input (survey comments, chat excerpts) in event properties — it leaks PII and bloats your event store. Store qualitative text in Supabase and reference it by ID.
- Gate NPS and survey prompts behind a cooldown check. Showing the same prompt multiple times inflates `:shown` counts and degrades the user experience.