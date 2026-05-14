# Strategy & Monetization

## When to use
When designing or revising the tier structure, deciding what to gate, or aligning feature access with business goals.

### Pattern: Gate on capability, not cosmetics
Gate features that change what a user can *do*, not how things look. Cosmetic gates feel punitive; capability gates feel like genuine value steps.

| Tier | Key unlock |
|------|-----------|
| Free | Core hackathon participation, 1 team |
| Starter | Video calls, more members |
| Pro | Analytics, unlimited teams/members |

### Pattern: Keep the free tier genuinely useful
A free tier that works for small hackathons creates organic reach. The limit should be *real* (one team is real), not artificially crippling.
```typescript
// Free is a real working tier, not a trial
free: { maxTeams: 1, maxMembers: 5, analytics: false, videoCall: false }
```

### Pattern: Align service-layer errors with upgrade paths
Every hard limit error should name the plan and the upgrade path, not just reject the action.
```typescript
throw new Error(
  `Your ${plan} plan allows up to ${PLANS[plan].maxTeams} teams. ` +
  `Upgrade to ${plan === 'free' ? 'Starter' : 'Pro'} to create more.`
)
```

## Pitfalls
- Don't add a tier for every feature — three tiers (free / mid / pro) cover most SaaS cases without confusing users.
- Avoid gating features that are required for basic security or collaboration hygiene — it creates trust issues.