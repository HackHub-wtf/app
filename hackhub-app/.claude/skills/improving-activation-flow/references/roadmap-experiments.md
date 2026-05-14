# Roadmap & Experiments

## When to use
When planning, prioritizing, or A/B testing changes to the activation funnel — deciding which friction points to address first and how to validate the impact.

## Patterns

**Rank activation bets by drop-off severity first**
```
Funnel step          | Est. drop-off | Fix complexity
---------------------|---------------|----------------
Signup → profile     | ~40%          | Low (form UX)
Profile → hackathon  | ~25%          | Low (empty state)
Hackathon → team     | ~35%          | Medium (discovery)
Team → idea          | ~20%          | Medium (editor UX)
```
Start with the highest drop-off × lowest complexity cell.

**Feature flag pattern for experiment isolation**
```typescript
const EXPERIMENTS = {
  SKIP_PROFILE_STEP: import.meta.env.VITE_EXP_SKIP_PROFILE === 'true',
}

// In onboarding flow
if (!EXPERIMENTS.SKIP_PROFILE_STEP) {
  steps.push('complete-profile')
}
```

**One experiment per funnel step at a time**

Avoid running overlapping experiments on the same step — the interaction effects make attribution impossible. Use the `VITE_APP_ENVIRONMENT` var to restrict experiments to staging before rolling to production.

## Pitfalls
Do not ship permanent feature flag branches — every experiment must have a removal date. If the experiment wins, delete the flag and the dead branch. Stale flags accumulate and create invisible behavior differences between environments.