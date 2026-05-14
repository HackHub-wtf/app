---
name: tanstack-query
description: Manages server state, caching, and data synchronization using TanStack Query v5 in HackHub
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Tanstack Query Skill

Handles all server state concerns in HackHub — fetching, caching, background refetching, and optimistic updates — using TanStack Query v5 (`@tanstack/react-query`). Works alongside Zustand (which owns client/auth state) and the service layer (which owns Supabase calls).

## Quick Start

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TeamService } from '@/services/teamService'

function TeamList({ hackathonId }: { hackathonId: string }) {
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams', hackathonId],
    queryFn: () => TeamService.getTeams(hackathonId),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <Loader />
  if (error) return <ErrorMessage error={error} />
  return teams.map(team => <TeamCard key={team.id} team={team} />)
}
```

## Key Concepts

**Query keys** — arrays that uniquely identify cached data. Always include relevant IDs: `['teams', hackathonId]`, `['ideas', hackathonId, teamId]`.

**staleTime** — how long data is considered fresh before a background refetch. Default is `0` (always stale). Set `5 * 60 * 1000` (5 min) for data that doesn't change often.

**queryFn** — must be a function returning a Promise. Always delegate to the service layer (`TeamService`, `IdeaService`, etc.) rather than calling Supabase directly from components.

**useMutation** — for writes (create, update, delete). Use `onSuccess` to invalidate or update the cache; use `onMutate` + `onError` for optimistic updates.

**QueryClient** — accessed via `useQueryClient()`. Use `invalidateQueries` to trigger refetch, `setQueryData` for manual cache writes.

## Common Patterns

**Mutation with cache invalidation**
```typescript
const queryClient = useQueryClient()

const createTeam = useMutation({
  mutationFn: (input: CreateTeamInput) => TeamService.createTeam(input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['teams', hackathonId] })
  },
})
```

**Optimistic update**
```typescript
const updateIdea = useMutation({
  mutationFn: (data: UpdateIdeaInput) => IdeaService.updateIdea(data),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['ideas', hackathonId] })
    const previous = queryClient.getQueryData<Idea[]>(['ideas', hackathonId])
    queryClient.setQueryData(['ideas', hackathonId], (old: Idea[]) =>
      old.map(i => (i.id === newData.id ? { ...i, ...newData } : i))
    )
    return { previous }
  },
  onError: (_err, _vars, ctx) => {
    queryClient.setQueryData(['ideas', hackathonId], ctx?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['ideas', hackathonId] })
  },
})
```

**Dependent query** (wait for auth before fetching)
```typescript
const { user } = useAuthStore()

const { data: profile } = useQuery({
  queryKey: ['profile', user?.id],
  queryFn: () => ProfileService.getProfile(user!.id),
  enabled: !!user,
})
```

**Prefetching on hover**
```typescript
const queryClient = useQueryClient()

const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['teams', hackathonId],
    queryFn: () => TeamService.getTeams(hackathonId),
  })
}
```

## Rules for This Codebase

- Never fetch Supabase directly in components — go through a service (`teamService.ts`, `ideaService.ts`, etc.)
- Never store server data in Zustand — that's React Query's job; Zustand holds auth and UI state only
- Always handle `isLoading` and `error` states before rendering data
- Avoid `useEffect` + `fetch` for data loading — use `useQuery` instead
- Type `queryFn` return values explicitly; avoid `any`