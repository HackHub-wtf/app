# In-App Guidance

## When to use
Score guidance initiatives when user research or support patterns show confusion about specific workflows — team joining, idea submission, voting criteria setup.

## Patterns

**Inline help text** — Adding `helperText` props to Mantine form fields in `TeamChat.tsx`, `VotingCriteriaManager.tsx`, or idea submission forms is zero-risk and zero-schema. It is the lowest-effort guidance bet available.

**Contextual modals** — Mantine's `Modal` component is already used across the app. A "how voting works" explainer modal triggered from `FlexibleVotingInterface.tsx` requires one new component and no backend changes.

**Role-aware hints** — `permissions.ts` exports role checks used throughout the UI. Showing manager-specific tips only when `hasRole('manager')` is true prevents noise for participants and requires no new state.

## Pitfalls
Avoid storing "has seen this tip" flags in Supabase unless cross-device sync is a stated requirement. A `localStorage` key keeps the implementation trivial and avoids a migration. Adding a new table for UI state is a high-effort, high-risk bet that rarely justifies its cost.