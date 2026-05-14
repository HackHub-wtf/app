# Conversion Optimization

## When to use
When auditing landing-to-registration funnels, reducing drop-off between Home → Hackathons → Join, or tightening CTA placement and copy.

## Patterns

**Above-the-fold primary CTA**
Keep the primary action visible without scrolling. Use `Button size="lg"` with a filled variant as the single dominant action per view. Pair it with a one-line value statement in `Text size="lg"`.

**Friction count audit**
Walk the path: landing → register → join hackathon → submit idea. Every extra decision (optional field, confirmation modal, redirect) costs conversion. Target ≤3 decisions from entry to first value.

**Progressive disclosure on signup**
Collect only email + password at registration. Defer display name, avatar, and org to a post-login onboarding step. Keep `signupSchema` minimal at the boundary.

## Pitfalls
- Multiple equal-weight CTAs on one page split attention and reduce clicks on all of them. Pick one primary action per screen; demote everything else to `variant="subtle"` or `variant="outline"`.