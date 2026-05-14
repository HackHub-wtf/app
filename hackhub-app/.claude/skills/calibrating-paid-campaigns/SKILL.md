---
name: calibrating-paid-campaigns
description: Aligns paid acquisition channels with landing pages, conversion tracking pixels, and UTM attribution for HackHub's React/TypeScript/Supabase frontend.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Calibrating Paid Campaigns Skill

Aligns paid acquisition (Google Ads, Meta, LinkedIn) with HackHub's landing pages, conversion pixels, and UTM parameter handling. Covers pixel placement in the Vite/React entry points, UTM capture via React Router, conversion event firing on signup and first-action milestones, and verifying that Supabase auth flows pass attribution data through to the database.

## Quick Start

1. Capture UTM params on entry — read `window.location.search` in `main.tsx` or a top-level route effect and persist to `sessionStorage`.
2. Pass UTMs through the Supabase signup call as user metadata so attribution survives auth redirects.
3. Place base pixels (Meta Pixel, Google Tag) in `index.html` `<head>`; fire conversion events from the post-signup or post-activation component.
4. Confirm pixel fires by checking the browser's network tab for the expected beacon URLs after completing a registration flow.

## Key Concepts

**UTM capture** — React Router 7's `useSearchParams` hook reads UTM params on any route. Persist them to `sessionStorage` once so they survive in-app navigation without polluting every URL.

**Supabase auth metadata** — `supabase.auth.signUp({ email, password, options: { data: { utm_source, utm_medium, utm_campaign } } })` stores attribution on the user record; query `auth.users.raw_user_meta_data` in analytics.

**Pixel placement** — Base tags go in `public/index.html`. Event calls (PageView, Lead, CompleteRegistration) go in React components, fired inside `useEffect` after the relevant Supabase mutation resolves.

**Conversion boundaries** — Fire conversion events at the same points as HackHub's activation milestones: account created, first hackathon joined, first idea submitted.

**Landing page message match** — The headline and CTA copy on a paid landing page must match the ad creative. Use the same Mantine `Title`/`Text` components and shared theme tokens so copy changes propagate consistently.

## Common Patterns

**Capture and store UTMs on app load**
```typescript
// src/main.tsx or a top-level layout component
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  utmKeys.forEach(key => {
    const val = params.get(key)
    if (val) sessionStorage.setItem(key, val)
  })
}, [])
```

**Pass UTMs through Supabase signup**
```typescript
const utmData = Object.fromEntries(
  ['utm_source', 'utm_medium', 'utm_campaign'].map(k => [k, sessionStorage.getItem(k) ?? ''])
)
await supabase.auth.signUp({
  email,
  password,
  options: { data: utmData }
})
```

**Fire a Meta conversion event after signup**
```typescript
useEffect(() => {
  if (signupSuccess && typeof window.fbq === 'function') {
    window.fbq('track', 'CompleteRegistration')
  }
}, [signupSuccess])
```

**Fire a Google Ads conversion after first hackathon join**
```typescript
useEffect(() => {
  if (joinedHackathon && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', { send_to: 'AW-XXXXXXXXX/YYYYYYY' })
  }
}, [joinedHackathon])
```

**Verify pixel placement in Vite build**
```bash
# Confirm pixel scripts survive the production build
npm run build && grep -r "fbq\|gtag" dist/index.html
```