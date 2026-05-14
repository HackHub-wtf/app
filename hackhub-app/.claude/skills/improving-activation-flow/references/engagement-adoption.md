# Engagement & Feature Adoption

## When to use
When users have passed initial activation but are not using core collaboration features — team chat, idea voting, file sharing, or real-time updates.

## Patterns

**Optimistic team join to eliminate perceived latency**
```typescript
const joinTeam = useMutation({
  mutationFn: (teamId: string) => TeamService.joinTeam(teamId),
  onMutate: async (teamId) => {
    await queryClient.cancelQueries({ queryKey: ['teams', hackathonId] })
    const previous = queryClient.getQueryData<Team[]>(['teams', hackathonId])
    queryClient.setQueryData(['teams', hackathonId], (old: Team[]) =>
      old.map(t => t.id === teamId ? { ...t, isMember: true } : t)
    )
    return { previous }
  },
  onError: (_err, _teamId, ctx) => {
    queryClient.setQueryData(['teams', hackathonId], ctx?.previous)
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['teams', hackathonId] }),
})
```

**Surface real-time activity to signal a live environment**
```typescript
// In RealtimeContext — emit team activity badge counts to sidebar
socket.on('team:activity', ({ teamId, count }: { teamId: string; count: number }) => {
  setActivityCounts(prev => ({ ...prev, [teamId]: count }))
})
```

**Empty states as adoption nudges**
```typescript
if (!ideas.length) {
  return (
    <Center py="xl">
      <Stack align="center">
        <Text c="dimmed">No ideas yet — be the first to submit one.</Text>
        <Button onClick={() => navigate('/ideas/new')}>Submit an idea</Button>
      </Stack>
    </Center>
  )
}
```

## Pitfalls
Avoid enabling real-time subscriptions for users who have not yet joined a team — the socket connection is wasted and can cause confusing events. Gate `RealtimeContext` subscription setup behind `hasTeam`.