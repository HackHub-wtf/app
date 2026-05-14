# Distribution

## When to use
When setting up UTM attribution, routing paid traffic to the right landing pages, or verifying that channel parameters survive auth redirects.

## Patterns

**Capture UTMs once on app entry**
Read from `window.location.search` before React Router takes over, persist to `sessionStorage`:
```typescript
// src/main.tsx — before ReactDOM.createRoot
const params = new URLSearchParams(window.location.search)
;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
  const v = params.get(k)
  if (v) sessionStorage.setItem(k, v)
})
```

**Pass UTMs through Supabase signup**
Attribution must survive the auth flow — attach it to user metadata:
```typescript
const utm = Object.fromEntries(
  ['utm_source', 'utm_medium', 'utm_campaign'].map(k => [k, sessionStorage.getItem(k) ?? ''])
)
await supabase.auth.signUp({ email, password, options: { data: utm } })
```

**Route paid traffic to a dedicated page**
Use React Router to serve a stripped-down layout for paid campaigns:
```typescript
<Route path="/join" element={<PaidLandingPage />} />
// /join?utm_source=google&utm_medium=cpc
```

## Pitfalls
Do not rely on `document.referrer` for attribution — it is stripped by many ad networks. Always use UTM params as the source of truth.