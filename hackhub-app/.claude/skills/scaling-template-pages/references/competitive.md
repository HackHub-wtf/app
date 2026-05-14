# Competitive Patterns — Scaling Template Pages

## When to use
When evaluating whether to build a generic shared `SearchPage` component vs. per-entity page components.

## Patterns

### Prefer per-entity pages over a single generic shell
Each entity (hackathons, teams, ideas) has unique filter dimensions and card layouts. A single over-generic `SearchPage<T>` component becomes hard to extend. Compose the shared patterns (URL sync, query key derivation, state gates) in each page rather than abstracting prematurely.

### Share the card, not the page
```
src/components/HackathonCard.tsx   ← shared, reused in listing + detail
src/pages/Hackathons.tsx           ← owns layout, filter state, query
```

### Consistent queryKey namespace prevents cache collisions
```typescript
// Each entity owns its namespace
['hackathons', filters]
['teams', filters]
['ideas', filters]
```
Mixing namespaces (e.g. `['search', 'hackathons', filters]`) causes stale data when navigating between listing pages.

## Pitfalls
Avoid sharing a single `useSearchParams` hook instance across multiple mounted pages — React Router scopes params per route, so this only matters if you render multiple listing pages simultaneously (e.g. in tabs).