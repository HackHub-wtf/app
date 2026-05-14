# Strategy & Monetization

## When to use
When evaluating landing page messaging for different user segments (organizers vs. participants), or when surfacing upgrade prompts or plan-tier differentiation in the UI.

## Patterns

**Segment-aware hero copy**
Organizers and participants have different goals. If the entry URL includes a role signal (e.g., `?role=organizer`), render a hero variant that leads with event management value. Default to the participant perspective for unqualified traffic.

**Feature gating on detail pages**
When a feature requires a plan upgrade, show it with a lock affordance and a short benefit statement rather than hiding it. Visible locked features communicate value and create upgrade intent. Use Mantine's `Overlay` or a `Badge` with a plan label.

**Upgrade CTA placement**
Place upgrade prompts at the point of friction (when a user tries to do something beyond their plan), not on a generic pricing page. In-context prompts convert better than navigation-driven ones.

## Pitfalls
- Showing upgrade prompts too early (before the user has experienced value) reads as aggressive and increases churn. Wait until the user has completed at least one meaningful action (joined a hackathon, submitted an idea) before surfacing plan-tier messaging.