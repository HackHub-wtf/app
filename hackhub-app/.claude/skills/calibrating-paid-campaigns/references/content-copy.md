# Content Copy

## When to use
When writing or updating copy for paid landing pages, registration forms, or in-app CTAs tied to a campaign.

## Patterns

**Copy stored as constants, not inline strings**
Keep campaign copy in a single file so non-engineers can update it without touching component logic:
```typescript
// src/content/campaigns.ts
export const PAID_LANDING = {
  headline: 'Run your next hackathon in minutes',
  subhead: 'Free for teams under 50. No credit card required.',
  cta: 'Start for free',
}
```

**Zod-validated copy config**
If copy comes from a CMS or env var, validate the shape at startup:
```typescript
const campaignSchema = z.object({
  headline: z.string().min(1).max(80),
  subhead: z.string().max(160),
  cta: z.string().max(30),
})
```

**Copy variation via URL param**
Test two headlines without a feature flag library:
```typescript
const [params] = useSearchParams()
const variant = params.get('cv') === 'b' ? COPY_B : COPY_A
```

## Pitfalls
Avoid hardcoding copy directly in JSX when it's tied to a campaign — it creates silent inconsistencies when the ad copy changes and the page copy doesn't.