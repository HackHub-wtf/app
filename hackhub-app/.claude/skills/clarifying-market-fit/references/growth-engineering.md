# Growth Engineering

## When to use
When implementing product changes specifically intended to drive acquisition, activation, or retention — not general feature work. Use when a copy or UX change is being built with a growth hypothesis attached to it.

## Patterns

**Activation milestone instrumentation**
Define the first meaningful action for each ICP and instrument it. For managers: "hackathon created." For participants: "team joined." Surface progress toward that milestone in the onboarding flow so users know they haven't finished yet.

**Reducing time-to-value**
Every step between signup and the first meaningful action is a drop-off risk. Audit `src/pages/Home.tsx` and the post-login redirect path. If a new user has to navigate more than two steps to reach their first productive action, that's a growth leak.

**Retention surfaces in empty states**
Return visits from inactive users often land on empty states. These are retention moments, not just UX polish. An empty Hackathons page for a manager should show a prompt to create one, not just a blank list — turning a dead end into a re-engagement trigger.

## Pitfall
Growth engineering applied to a broken core flow makes problems harder to diagnose, not easier. If activation rates are low, investigate the existing flow before adding new growth mechanics on top of it. New surfaces don't fix broken existing ones.