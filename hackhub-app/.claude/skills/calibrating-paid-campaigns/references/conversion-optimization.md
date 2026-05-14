# Conversion Optimization

## When to use
When improving signup rates, reducing drop-off in paid acquisition funnels, or aligning landing page copy with ad creatives.

## Patterns

**Message match between ad and landing page**
The headline in your Mantine `Title` must mirror the ad copy exactly. Use shared theme tokens so edits propagate:
```typescript
// src/pages/LandingPage.tsx
<Title order={1} c="brand">{adHeadline}</Title>
<Text size="lg">{adSubcopy}</Text>
```

**Single-CTA landing pages for paid traffic**
Paid visitors need one clear action. Hide the nav `Sidebar` on UTM-tagged routes:
```typescript
const [searchParams] = useSearchParams()
const isPaidTraffic = searchParams.has('utm_source')
// Conditionally suppress Sidebar in Layout
```

**Conversion event at the activation boundary**
Fire the pixel event only after the Supabase mutation resolves — not on button click:
```typescript
const { mutate, isSuccess } = useMutation({ mutationFn: joinHackathon })
useEffect(() => {
  if (isSuccess && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', { send_to: 'AW-XXXXXXXXX/YYYYYYY' })
  }
}, [isSuccess])
```

## Pitfalls
Do not fire conversion events on component mount or button click. Fire them inside a `useEffect` that depends on a confirmed success state to avoid counting abandoned attempts.