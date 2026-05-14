# Data Fetching

## When to use
Use TanStack Query for all server state. Never mirror server data into Zustand — that creates a second source of truth that drifts.

## Patterns

**Basic query with stale time**
```typescript
export function useTeams(hackathonId: string) {
  return useQuery({
    queryKey: ['teams', hackathonId],
    queryFn: () => TeamService.getTeams(hackathonId),
    staleTime: 5 * 60 * 1000,
  })
}
```

**Optimistic mutation**
```typescript
export function useUpdateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateTeamInput) => TeamService.updateTeam(data),
    onMutate: newData => {
      queryClient.setQueryData(['teams'], (old: Team[]) =>
        old.map(t => (t.id === newData.id ? { ...t, ...newData } : t))
      )
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  })
}
```

**Dependent query**
```typescript
const { data: user } = useCurrentUserQuery()
const { data: ideas } = useQuery({
  queryKey: ['ideas', user?.id],
  queryFn: () => IdeaService.getIdeasByUser(user!.id),
  enabled: !!user,
})
```

## Pitfalls
- Don't use `useEffect` + `fetch` for server data — use TanStack Query to get caching, deduplication, and background refresh for free.
- Always provide a `queryKey` that includes every variable the query depends on; stale keys cause incorrect cached responses.