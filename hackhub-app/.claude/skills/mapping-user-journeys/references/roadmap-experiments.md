# Roadmap & Experiments

## When to use
Assess the blast radius of a proposed feature or change by mapping which services, stores, and components it touches before implementation begins.

## Patterns

**Feature gate tracing**
Before adding a role-gated feature, check `src/utils/permissions.ts` for the relevant role check and verify it is already threaded through to the page component. New features that need a new permission type require changes in at least three places: `permissions.ts`, the component render gate, and the Supabase RLS policy in `supabase/`.

**Store impact assessment**
New data types that persist across navigation (hackathon context, team membership) belong in `hackathonStore.ts`. Check whether the store already holds a related slice before adding new state — duplicate state between Zustand and React Query cache causes stale-data bugs.

**Real-time scope**
Any feature involving collaborative state (shared editing, live voting counts) needs a Socket.io event registered in `RealtimeContext.tsx` and a corresponding `socket.on` cleanup in the consuming hook. Grep `socket.emit` for existing event names before defining new ones to avoid naming collisions.

## Pitfalls
- Experiments that conditionally render components based on unstable flags (hardcoded booleans, env vars without a clear toggle strategy) accumulate as dead code. Flag all experimental code with a dated comment and a linked issue so it doesn't outlive the experiment.