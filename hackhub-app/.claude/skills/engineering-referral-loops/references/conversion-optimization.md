# Conversion Optimization

## When to use
When improving referral link click-through rates, reducing drop-off between invite receipt and signup completion, or A/B testing referral CTA copy.

## Patterns

**Token persistence across sessions**
Store the `ref` token in `sessionStorage` on landing, then read it during signup to ensure conversions survive OAuth redirects or multi-step registration flows.
```typescript
// On /join page load
const refToken = new URLSearchParams(location.search).get('ref')
if (refToken) sessionStorage.setItem('referral_token', refToken)

// During signup completion
const token = sessionStorage.getItem('referral_token')
if (token) await ReferralService.recordConversion(token, newUser.id)
sessionStorage.removeItem('referral_token')
```

**Conversion funnel events**
Log each funnel step (link clicked, page viewed, form started, signup completed) as separate rows in `referral_events` so you can measure drop-off per step without relying on a third-party analytics tool.

**Inline social proof on landing**
Show the referrer's name or avatar on the `/join?ref=<token>` page to increase trust. Resolve referrer display name server-side via a Supabase function before rendering.

## Pitfalls
- Never record a conversion before the referred user completes email verification — unverified accounts inflate stats and may receive rewards they never activate.
- Avoid reading `referral_token` from `localStorage` across browser tabs for the same signup flow; use `sessionStorage` to scope it to one tab.