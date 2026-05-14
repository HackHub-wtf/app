# Routing Performance

## When to use
Apply lazy loading to page components and use stable query keys so React Query doesn't over-fetch when routes change.

**Lazy-load page components**
```typescript
import { lazy, Suspense } from 'react'
const HackathonDetail = lazy(() => import('./pages/HackathonDetail'))

<Route
  path="/hackathons/:id"
  element={
    <Suspense fallback={<Loader />}>
      <ProtectedRoute><HackathonDetail /></ProtectedRoute>
    </Suspense>
  }
/>
```

**Stable query keys tied to route params**
```typescript
// Re-fetches only when id changes, not on every render
useQuery({
  queryKey: ['hackathon', id],
  queryFn: () => hackathonService.getById(id!),
  staleTime: 5 * 60 * 1000
})
```

**Avoid layout re-mounts on navigation**
```typescript
// Nest page routes under a shared layout route so Header/Sidebar
// are not destroyed and recreated on every navigation
<Route element={<AppLayout />}>
  <Route path="/hackathons" element={<Hackathons />} />
  <Route path="/teams" element={<Teams />} />
</Route>
```

## Pitfalls
- `lazy()` boundaries must be at the route level, not inside components — splitting too deep adds waterfall fetches.
- Including unstable values (e.g. `Date.now()`) in query keys disables React Query caching entirely.