# Product Analytics

## When to use
When measuring whether a nudge or adoption flow is actually working — track seen, clicked, and dismissed events before and after shipping any feature discovery change.

## Patterns

**Adoption event tracking hook**
```typescript
function trackAdoption(feature: string, action: 'seen' | 'clicked' | 'dismissed') {
  // Google Analytics via VITE_GOOGLE_ANALYTICS_ID
  window.gtag?.('event', `feature_${action}`, { feature_name: feature })
  // Hotjar via VITE_HOTJAR_ID
  window.hj?.('event', `${feature}_${action}`)
}

// Usage
trackAdoption('video-call', 'seen')
trackAdoption('video-call', 'clicked')
```

**Supabase custom events table (persistent)**
```typescript
await supabase.from('adoption_events').insert({
  user_id: user.id,
  feature: 'markdown-editor',
  action: 'first_use',
  hackathon_id: hackathon.id,
  occurred_at: new Date().toISOString()
})
```

**Funnel checkpoint: first meaningful action**
```typescript
// Record when a participant submits their first idea with markdown
if (idea.description.includes('##') && !user.user_metadata.used_markdown) {
  trackAdoption('markdown-editor', 'first_meaningful_use')
  await supabase.auth.updateUser({ data: { used_markdown: true } })
}
```

## Pitfalls
Don't track events without verifying `VITE_GOOGLE_ANALYTICS_ID` is set — silent no-ops are fine in dev, but confirm the env var is present in the Cloudflare Pages production config before relying on data.