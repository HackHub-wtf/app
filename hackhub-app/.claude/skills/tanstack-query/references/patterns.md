# TanStack Query Patterns

## When to use
Use these patterns when fetching, caching, or mutating server-side data in HackHub components.

## Patterns

**Basic fetch with loading/error guards**
```typescript
const { data: teams, isLoading, error } = useQuery({
  queryKey: ['teams', hackathonId],
  queryFn: () => TeamService.getTeams(hackathonId),
  staleTime: 5 * 60 * 1000,
})

if (isLoading) return <Loader />
if (error) return <ErrorMessage error={error} />
```

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

**Dependent query (wait for auth)**
```typescript
const { user } = useAuthStore()

const { data: profile } = useQuery({
  queryKey: ['profile', user?.id],
  queryFn: () => ProfileService.getProfile(user!.id),
  enabled: !!user,
})
```

## Pitfalls
- Never call Supabase directly in components — always go through a service (`teamService.ts`, `ideaService.ts`, etc.)
- Never store query results in Zustand — React Query owns server state; Zustand owns auth and UI state only
- Omitting `enabled` on dependent queries causes the `queryFn` to run with undefined IDs