# Performance

## When to use
Apply these patterns when a component re-renders more than necessary, when a list is long and scrolls slowly, or when an expensive calculation runs on every render.

## Patterns

**Stable query keys prevent redundant fetches**
```typescript
// include every variable the query depends on
queryKey: ['teams', hackathonId, filters.status]
```

**`useMemo` for expensive derivations**
```typescript
const sortedIdeas = useMemo(
  () => [...ideas].sort((a, b) => b.voteCount - a.voteCount),
  [ideas]
)
```

**Zustand selector granularity**
```typescript
// re-renders only when `user.id` changes, not on any auth state change
const userId = useAuthStore(state => state.user?.id)
```

**Lazy-load heavy components**
```typescript
const TeamVideoCall = lazy(() => import('@/components/TeamVideoCall'))

// Wrap usage in Suspense
<Suspense fallback={<Loader />}>
  <TeamVideoCall teamId={teamId} />
</Suspense>
```

## Pitfalls
- Don't wrap every component in `memo` preemptively — profile first. Memoization has overhead too.
- Avoid creating new object/array literals inside `queryKey` arrays; they break referential equality and cause unnecessary refetches.