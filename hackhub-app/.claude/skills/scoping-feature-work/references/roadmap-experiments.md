# Roadmap & Experiments

## When to use
Scope this pattern when a feature is speculative, A/B tested, or needs to be dark-launched before full rollout.

## Patterns

### Feature flag via env variable
The simplest flag: `VITE_FEATURE_NEW_VOTING=true` read in a component. No infrastructure needed, toggled at build time. Suitable for short-lived experiments.
```
Slice 1 — read import.meta.env.VITE_FEATURE_X in the relevant component
Slice 2 — render alternate UI branch; old path remains unchanged
Slice 3 — remove flag + old branch once experiment concludes
```

### Runtime flag via Zustand
For flags that need to change without a redeploy, store in Zustand with an initial value fetched from a Supabase `feature_flags` table row (single fetch on app init, no realtime needed).
```
Slice 1 — migration: add feature_flags table (key text, enabled bool, RLS: select for all auth users)
Slice 2 — load flags in authStore.initialize() and store in flagStore
Slice 3 — components read flagStore.isEnabled('key') — no prop drilling
```

### Gradual rollout by user role
Use `hasRole()` to restrict a new feature to admins first, then managers, then participants. No new infrastructure — just a phased permissions change over successive PRs.

## Pitfalls
- Don't leave dead feature flag branches in the codebase after an experiment ends — schedule removal as a slice.
- Don't store experiment assignment in the database unless you need cross-device consistency; localStorage is enough for most cases.