# Custom Hooks

## When to use
Extract a custom hook when a component needs to interact with Socket.io, Supabase subscriptions, or any stateful side effect that might be reused or tested independently.

## Patterns

**Subscription with cleanup**
```typescript
export function useRealtimeTeam(teamId: string) {
  const { socket } = useRealtime()
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!socket) return
    socket.emit('join:team', { teamId })
    socket.on(`team:${teamId}:message`, (msg: Message) => {
      setMessages(prev => [...prev, msg])
    })
    return () => {
      socket.off(`team:${teamId}:message`)
      socket.emit('leave:team', { teamId })
    }
  }, [socket, teamId])

  return messages
}
```

**Wrapping a Zustand selector**
```typescript
export function useCurrentUser() {
  return useAuthStore(state => state.user)
}
```

**Derived value hook**
```typescript
export function useIsTeamLead(teamId: string) {
  const user = useCurrentUser()
  const { data: team } = useQuery({ queryKey: ['team', teamId], queryFn: () => TeamService.getTeam(teamId) })
  return team?.lead_id === user?.id
}
```

## Pitfalls
- Never omit the dependency array — stale closures cause subtle bugs with socket IDs and team IDs.
- Don't return raw Supabase subscription objects from hooks; always clean up inside the hook itself.