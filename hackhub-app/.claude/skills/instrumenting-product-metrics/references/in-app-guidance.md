# In-App Guidance Metrics

## When to use
Measure whether onboarding prompts, tooltips, empty states, and feature nudges are seen and acted on. Use when adding checklist steps, contextual hints, or first-run modals.

## Patterns

**Impression + action pair for every guidance element**
```typescript
// Fire :shown when the element renders, :dismissed or :completed on action
track('onboarding_step:shown', { userId, step: 'create_team' })
track('onboarding_step:completed', { userId, step: 'create_team' })
track('onboarding_step:dismissed', { userId, step: 'create_team' })
```

**Track tooltip and empty-state interactions**
```typescript
// src/components/EmptyTeamState.tsx — track in a useEffect, not on every render
useEffect(() => {
  track('empty_state:shown', { userId, context: 'teams_list', hackathonId })
}, []) // empty dep array — fires once on mount
```

**Checklist completion rate**
```typescript
const CHECKLIST_STEPS = ['join_hackathon', 'create_or_join_team', 'submit_idea'] as const
function markStepComplete(step: typeof CHECKLIST_STEPS[number], userId: string) {
  track('checklist_step:completed', { userId, step })
}
```

## Pitfalls
- Never track `:shown` inside a render function — it fires on every re-render. Always use `useEffect` with an empty dependency array or a stable ref guard.
- Pair every `:shown` event with a `:dismissed` or `:completed` path, otherwise you can only measure impressions, not outcomes.