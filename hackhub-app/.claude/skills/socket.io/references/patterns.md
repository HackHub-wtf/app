# Socket.io Patterns

## When to use
Apply these patterns when adding real-time features: team chat, live notifications, collaborative editing, or presence indicators.

## Patterns

**Room-scoped event listener**
```typescript
useEffect(() => {
  if (!socket) return

  socket.emit('join:team', { teamId })
  socket.on(`team:${teamId}:message`, (payload: TeamMessagePayload) => {
    setMessages(prev => [...prev, payload])
  })

  return () => {
    socket.off(`team:${teamId}:message`)
    socket.emit('leave:team', { teamId })
  }
}, [socket, teamId])
```

**Emit with acknowledgement**
```typescript
socket.emit('chat:send', { teamId, message }, (ack: { ok: boolean }) => {
  if (!ack.ok) {
    notifications.show({ color: 'red', message: 'Message failed to send' })
  }
})
```

**Connection guard before rendering**
```typescript
const { socket, isConnected } = useRealtime()

if (!isConnected) {
  return <Alert color="yellow">Connecting to real-time services...</Alert>
}
```

## Pitfalls

- Never call `io()` directly in a component — use `useRealtime()` to access the shared socket from `RealtimeContext`
- Every `socket.on()` must have a matching `socket.off()` in cleanup; missing cleanup causes duplicate handlers across re-renders
- Never use `any` for event payloads — define a TypeScript interface per event