# Strategy & Monetization

## When to use
When deciding which actions should trigger referral rewards, whether referral access should be gated by plan tier, or how to align referral incentives with HackHub's business goals.

## Patterns

**Reward types aligned to HackHub value**
Prefer platform-native rewards over cash: extra votes per referral, visibility boosts for referred teams' ideas, or early access to the next hackathon. These reinforce the product loop rather than attracting low-intent signups.

**Plan-gated referral features**
If HackHub has a paid tier, gate advanced referral analytics (conversion breakdown, depth chart) behind it. Free users see only their link and a total count. Implement this with a permission check in `ReferralPanel`:
```typescript
const canViewAdvancedStats = hasPermission(user, 'referral:analytics')
```

**Partner loop variant**
For organization-level partners (companies sponsoring hackathons), generate tokens tied to `organization_id` rather than `auth.users.id`. Track conversions against the org to offer volume-based sponsorship discounts.

## Pitfalls
- Don't make rewards the only reason to share — if the mechanic disappears, so does sharing. Design the referral as a convenience layer on top of genuine enthusiasm for the platform.
- Avoid rewarding referrers before the referee has been active for at least 24 hours; immediate reward payout incentivizes fake account creation.