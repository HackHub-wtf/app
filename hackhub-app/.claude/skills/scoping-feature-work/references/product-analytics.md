# Product Analytics

## When to use
Scope this pattern when you need to instrument user actions, measure feature adoption, or feed data into an external analytics service (e.g., Google Analytics via `VITE_GOOGLE_ANALYTICS_ID`).

## Patterns

### Event tracking wrapper
Wrap user actions in a thin `track(event, props)` utility in `src/utils/analytics.ts`. Keeps tracking calls out of service layer and components stay testable.
```
Slice 1 — create analytics.ts with track() that reads VITE_GOOGLE_ANALYTICS_ID
Slice 2 — call track() inside mutation onSuccess callbacks (not in render)
Slice 3 — add custom dimensions (hackathon_id, user_role) from authStore
```

### Funnel instrumentation
Track key funnel steps (view hackathon → join team → submit idea → vote) by adding `track()` calls at React Router navigation points in `App.tsx` or inside page `useEffect` on mount.

### Feature flag gating with analytics
When running an experiment, gate the variant in a Zustand boolean and track which variant the user saw alongside every funnel event.
```
Given VITE_APP_ENVIRONMENT === 'production'
When user reaches the Ideas page
Then track('ideas_page_viewed', { variant: flagStore.ideaLayoutVariant })
And no PII is included in the event payload
```

## Pitfalls
- Never log user emails or IDs that map to PII in analytics events — use Supabase user UUIDs only.
- Don't track inside render — always track inside event handlers or `onSuccess` callbacks to avoid duplicate fires.