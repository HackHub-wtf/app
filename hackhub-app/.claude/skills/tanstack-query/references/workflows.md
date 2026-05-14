# TanStack Query Workflows

## When to use
Follow these workflows when building features that write data or need low-latency UI feedback.

## Workflows

**Optimistic update for idea edits**
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

**Prefetch on hover for faster navigation**
```typescript
const queryClient = useQueryClient()

const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['teams', hackathonId],
    queryFn: () => TeamService.getTeams(hackathonId),
  })
}
```

**Voting mutation with list invalidation**
```typescript
const vote = useMutation({
  mutationFn: (ideaId: string) => VotingService.castVote(ideaId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ideas', hackathonId] })
    queryClient.invalidateQueries({ queryKey: ['votes', hackathonId] })
  },
})
```

## Pitfalls
- Skip `onMutate` rollback and you get stale UI after a failed write — always return `{ previous }` and restore it in `onError`
- `cancelQueries` in `onMutate` is required; without it an in-flight refetch can overwrite the optimistic state before the mutation settles