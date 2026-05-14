# Measurement & Testing

## When to use
When verifying pixel fires, testing UTM capture end-to-end, or validating that conversion events reach the ad platform.

## Patterns

**Confirm pixels survive the Vite build**
```bash
npm run build && grep -r "fbq\|gtag" dist/index.html
# Should return matching lines — if empty, the script tags were stripped
```

**Test UTM persistence through signup**
Use browser DevTools: navigate to `/join?utm_source=google`, open Application → Session Storage, confirm keys are set, then complete signup and query `auth.users` in Supabase Dashboard for `raw_user_meta_data`.

**Type-safe pixel helpers**
Avoid repeated `typeof window.fbq === 'function'` guards — wrap once:
```typescript
// src/utils/pixels.ts
export const trackMeta = (event: string) => {
  if (typeof window.fbq === 'function') window.fbq('track', event)
}
export const trackGoogle = (sendTo: string) => {
  if (typeof window.gtag === 'function') window.gtag('event', 'conversion', { send_to: sendTo })
}
```

## Pitfalls
Browser ad blockers suppress pixel beacons in dev. Use an unblocked browser profile or the platform's test event tool (Meta Events Manager, Google Tag Assistant) to verify real fires.