# Strategy & Monetization

## When to use
When onboarding changes intersect with paid tiers, plan limits, or upgrade prompts — ensuring new users understand the value ladder without feeling blocked.

## Patterns

**Show value before limits**
Let users experience the core loop (join hackathon → form team → submit idea) before they encounter any plan-gated feature. If a limit is hit mid-flow, explain what they accomplished first, then offer the upgrade path.

**Contextual upgrade prompts**
Trigger upgrade prompts at the exact moment a user hits a limit (e.g., max team size, max file uploads). Use Mantine `Modal` with a single clear CTA. Don't surface pricing on the onboarding screens themselves.

**Free tier as activation funnel**
Design the free tier so that activation (first team join + idea submit) is fully achievable without upgrading. Users who activate on free convert to paid at 3–5x the rate of users who never activate. Don't optimize revenue at the cost of activation.

## Pitfalls
- Don't gate the activation milestone itself behind a paid feature. If a new user can't complete the core loop on the free plan, you've broken your acquisition funnel. Activation must be free, always.