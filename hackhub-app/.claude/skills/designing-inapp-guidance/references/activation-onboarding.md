# Activation & Onboarding

## When to use
Use these patterns when a user logs in for the first time or hasn't completed a key setup step (joining a team, submitting an idea). Gate all onboarding on role using `hasRole` from `src/utils/permissions.ts`.

## Patterns

### First-run tour trigger
Check `hasSeen('participant-onboarding-v1')` in the root layout or page component. Render `<OnboardingTour />` once — Zustand `persist` middleware ensures it never shows again after `markSeen` is called.

```typescript
// In src/pages/Home.tsx
import { OnboardingTour } from '@/components/OnboardingTour'

export function Home() {
  return (
    <>
      <OnboardingTour />
      {/* page content */}
    </>
  )
}
```

### Checklist progress bar
Surface a compact `Progress` + `List` component showing incomplete tasks (join team, submit idea, cast a vote). Derive completion from live React Query data — never store progress state separately.

```typescript
const steps = [
  { id: 'join-team', label: 'Join a team', done: !!myTeam },
  { id: 'submit-idea', label: 'Submit an idea', done: myIdeas.length > 0 },
  { id: 'cast-vote', label: 'Vote on an idea', done: myVotes.length > 0 },
]
const pct = Math.round((steps.filter(s => s.done).length / steps.length) * 100)
```

### Manager vs participant branching
Pass a `tourId` prop so the same `OnboardingTour` component can serve both roles without duplicating the modal shell.

```typescript
const TOUR_ID = user.role === 'manager'
  ? 'manager-onboarding-v1'
  : 'participant-onboarding-v1'
```

## Pitfalls
- Don't hydrate `seenHints` from the server — Zustand `persist` reads `localStorage` only on the client. Wrap the tour render in a `useEffect` or `useHydration` guard to avoid SSR mismatches if Vite SSR is ever added.
- Never auto-open a tour and a modal simultaneously. Check `modals.openedModal` from Mantine's modal manager before rendering.