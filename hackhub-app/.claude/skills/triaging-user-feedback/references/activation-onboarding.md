# Activation & Onboarding Feedback

## When to use
Apply this reference when triaging feedback about first-run experience, registration friction, empty dashboards, or users not reaching their first meaningful action (joining a team, submitting an idea).

## Patterns

**Quick win — empty state on first login**
User lands on Hackathons or Teams page with no data and sees a blank list. Add a Mantine `<Center>` + `<Text>` + action button block inside the existing React Query result guard in `src/pages/Hackathons.tsx` or `src/pages/Teams.tsx`. No service changes needed.

**Quick win — form validation copy is confusing**
Zod schemas in the same component file drive error messages. Update the `.min(1, 'Required')` message strings directly. Confirm location: `grep -r "z.object" src/pages/Login.tsx src/components/`.

**Backlog — onboarding checklist or progress indicator**
Requires a new Zustand slice to track completion state, a new component, and likely a Supabase column to persist progress across sessions. Tag as backlog with open question: should progress reset per hackathon or be global?

## Pitfalls
Don't classify "add a welcome modal" as a quick win without checking whether it needs user-preference persistence. If it does, it touches `authStore.ts` and Supabase — that's backlog scope.