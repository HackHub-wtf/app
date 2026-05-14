# Conversion Optimization

## When to use
When auditing signup or trial activation flows to reduce drop-off between landing and first meaningful action.

## Patterns

**Minimize time-to-value** — route users to a concrete first action immediately after signup. In HackHub this means redirecting to `/hackathons` or a join flow, not a blank dashboard.

**Above-the-fold OAuth CTA** — place `signInWithOAuth({ provider: 'github' })` as the primary button. Users who see email forms first convert at lower rates. OAuth eliminates the form entirely.

**Single-screen signup** — collect only `email` + `password` at the gate. Every additional required field drops conversion. Move `display_name`, `role`, and `organization` to a post-auth `/onboarding` route.

## Pitfalls
Do not add "confirm password" fields — Supabase handles email confirmation. Duplicate fields add friction with no security benefit at the form layer.