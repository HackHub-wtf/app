# Conversion Optimization

## When to use
When a page has the right audience but low action rates — users land, read, and leave without clicking the primary CTA. Also use when A/B testing copy variants or analyzing drop-off in the registration or team-join flow.

## Patterns

**CTA specificity by role**
Generic CTAs ("Get Started", "Learn More") convert worse than role-specific ones. Check `src/utils/permissions.ts` for role context and rewrite button labels to match intent: "Create Your Hackathon" for managers, "Find a Team" for participants.

**Above-the-fold value statement**
`src/pages/Home.tsx` controls first impressions. The opening headline should name a concrete outcome within the first two lines — not a feature list. "Run your next hackathon end-to-end" converts better than "A platform for hackathon management."

**Reducing friction at the decision point**
Forms in `src/pages/Login.tsx` and signup flows should defer optional fields. If the minimum viable action is email + password, every extra field shown before that is a conversion tax.

## Pitfall
Don't optimize CTAs in isolation. A high-converting button attached to weak surrounding copy creates false confidence — the metric goes up, but activation quality drops. Audit the full page narrative before isolating a CTA test.