# Strategy and Monetization

## When to use
When editorial content needs to support plan differentiation, upgrade flows, or feature gating — ensuring copy reflects the correct tier and doesn't promise features unavailable to the user's plan.

## Patterns

**Gate copy to audience** — admin and manager pages (`VotingCriteriaManager.tsx`, organizer tooling) are the right surfaces for upgrade prompts. Participant-facing pages should not surface plan upsells.

**Theme alignment with value tiers** — the "Organizers in control" theme maps to premium manager tooling. When writing briefs for these features, frame the value in terms of outcomes ("Run a fairer vote") not feature names ("Flexible voting criteria").

**Upgrade prompt timing** — place upgrade copy at the moment of capability friction, not at login or on the home page. When a manager hits a limit (team size, voting criteria count), that is the right moment for a tier prompt.

## Pitfalls
Don't write speculative monetization copy for features that aren't gated yet. Placeholder upgrade prompts that link to non-existent plan pages damage credibility and confuse users.