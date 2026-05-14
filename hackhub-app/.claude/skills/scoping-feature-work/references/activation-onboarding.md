# Activation & Onboarding

## When to use
Scope this pattern when a feature helps new users reach their first meaningful action — joining a team, submitting an idea, or completing a hackathon registration.

## Patterns

### Empty-state driven onboarding
When a page has no data, render a call-to-action rather than a blank list. Scope as a UI-only slice on top of existing React Query hooks — no migration needed.
```
Slice 1 — add EmptyState component to src/components/ with primary CTA
Slice 2 — wire to useQuery isSuccess + data.length === 0 condition
Slice 3 — track first action via notificationService or analytics event
```

### Progressive profile completion
Gate advanced features (idea submission, voting) behind a profile completeness check in `src/utils/permissions.ts`. Scope the gate before the UI change.
```
Slice 1 — add profileComplete() helper to permissions.ts
Slice 2 — show inline banner in Header when incomplete
Slice 3 — unlock feature once threshold met (React Query refetch on profile update)
```

### Guided first hackathon join
Add a stepper component using Mantine `Stepper` that persists step in Zustand (not Supabase — ephemeral). No migration required.

## Pitfalls
- Don't add onboarding state to the database unless it must survive a logout. Zustand + localStorage is enough for most wizard flows.
- Don't gate the entire app — gate specific actions so users can still explore.