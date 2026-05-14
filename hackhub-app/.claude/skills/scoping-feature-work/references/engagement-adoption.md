# Engagement & Adoption

## When to use
Scope this pattern when a feature is built but underused, or when you want to surface capabilities that exist but aren't discoverable.

## Patterns

### Activity feed / recent actions
Surface recent team or hackathon activity using an existing Supabase `created_at` ordering — no schema change needed. Scope as a service + UI slice pair.
```
Slice 1 — add getRecentActivity() to relevant *Service.ts (select with limit + order)
Slice 2 — React Query hook with short staleTime (60s) for freshness
Slice 3 — ActivityFeed component in src/components/ using Mantine Timeline
```

### Feature nudges via notification system
Re-use `notificationService.ts` to push in-app nudges when a user hasn't tried a feature after N days. Scope as a service-layer slice with a condition check — no new table needed if using existing notifications table.

### Contextual help tooltips
Add Mantine `Tooltip` or `HoverCard` around underused controls. UI-only slice; no state or service changes.
```
Given user hovers a voting button for the first time
When tooltip appears
Then it describes what voting does and who can vote
And hasRole() gate is still enforced on the action itself
```

## Pitfalls
- Don't conflate engagement features with analytics — nudges live in the service layer, event tracking belongs in product-analytics.md patterns.
- Avoid polling for activity; use Supabase Realtime or Socket.io instead to prevent unnecessary load.