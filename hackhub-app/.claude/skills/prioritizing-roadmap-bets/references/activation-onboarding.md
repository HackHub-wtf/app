# Activation & Onboarding

## When to use
Score onboarding initiatives when the team suspects drop-off between signup and first meaningful action (joining a team, submitting an idea, casting a vote).

## Patterns

**Empty-state prompts** — Components like `Teams.tsx` and `Ideas.tsx` render empty lists for new users. Adding contextual CTAs here touches one file each, no schema changes, and is visible on every new user's first session. High impact, low effort.

**Progressive auth gating** — `authStore.ts` controls the session gate. Surfacing a soft "create account" nudge before hard-blocking anonymous users on `Hackathons.tsx` can increase conversion without changing RLS policies.

**Guided first action** — A one-time tooltip or modal triggered by `hackathonStore.ts` state (e.g., `teams.length === 0`) can walk new participants to team creation. Scope is contained to a single new component and one store read.

## Pitfalls
Avoid coupling onboarding state to Supabase rows unless persistence is truly required — local `localStorage` flags keep the schema clean and the migration list short. Schema changes for onboarding tracking carry disproportionate deploy risk.