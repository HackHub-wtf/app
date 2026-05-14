# Measurement & Testing

## When to use
When validating whether a decision cue is actually improving conversion or just adding UI noise.

## Patterns

**Define the conversion event before building**
Name the specific action that constitutes success: `idea_submitted`, `team_joined`, `vote_cast`. Log it to your analytics layer (Supabase custom event or Google Analytics) at the point of mutation success in the TanStack Query `onSuccess` callback.

**A/B gate via a Zustand flag seeded from Supabase**
Store variant assignment in the user's profile row (`variant: 'control' | 'treatment'`). Read it in `authStore` on login and branch rendering logic off it. This keeps the gate server-authoritative and avoids client-side flickering.

**Funnel drop-off via route-level tracking**
Log `page_view` events with the current route on each React Router navigation. A drop between `/hackathons/:id` and `/ideas/new` with no `idea_submitted` event is the signal that the submit CTA needs work.

## Pitfalls
- Measuring click rate on a cue rather than completion of the downstream action is a vanity metric; a badge can get clicks without improving submission rates.