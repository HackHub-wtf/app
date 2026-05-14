---
name: socket.io
description: Enables real-time WebSocket communication and event handling for HackHub's collaborative features including team chat, notifications, and live updates
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Socketio Skill

Handles Socket.io 4.x integration for HackHub's real-time collaboration layer. Socket.io powers team chat, live notifications, and collaborative events through `RealtimeContext` (`src/contexts/RealtimeContext.tsx`) and the `useSocket` hook (`src/hooks/useSocket.ts`). All socket logic flows through the context provider — components consume it via `useRealtime()`.

## Quick Start

```typescript
// Access the socket in any component
import { useRealtime } from '@/hooks/useRealtime'

function MyComponent() {
  const { socket, isConnected } = useRealtime()

  useEffect(() => {
    if (!socket) return

    socket.on('custom:event', (data: EventPayload) => {
      // handle event
    })

    return () => {
      socket.off('custom:event')
    }
  }, [socket])
}
```

## Key Concepts

**Connection lifecycle** — The socket is created once in `RealtimeContext` after the user authenticates. Components never instantiate `io()` directly; they consume the shared socket from context.

**Event namespacing** — Events follow the pattern `resource:id:action` (e.g., `team:abc123:message`). Always use this pattern when adding new events.

**Cleanup** — Every `socket.on()` call must have a matching `socket.off()` in the `useEffect` cleanup. Missing cleanup causes duplicate handlers and memory leaks.

**TypeScript** — Define payload types for every event. Never use `any` for socket event data.

```typescript
interface TeamMessagePayload {
  teamId: string
  message: string
  userId: string
  timestamp: string
}
```

## Common Patterns

**Joining and leaving rooms**
```typescript
useEffect(() => {
  if (!socket) return

  socket.emit('join:team', { teamId })

  return () => {
    socket.emit('leave:team', { teamId })
  }
}, [socket, teamId])
```

**Listening to namespaced events**
```typescript
useEffect(() => {
  if (!socket) return

  socket.on(`team:${teamId}:message`, (payload: TeamMessagePayload) => {
    setMessages(prev => [...prev, payload])
  })

  return () => {
    socket.off(`team:${teamId}:message`)
  }
}, [socket, teamId])
```

**Emitting events with acknowledgement**
```typescript
socket.emit('chat:send', { teamId, message }, (ack: { ok: boolean }) => {
  if (!ack.ok) {
    notifications.show({ color: 'red', message: 'Message failed to send' })
  }
})
```

**Connection state guard**
```typescript
const { socket, isConnected } = useRealtime()

if (!isConnected) {
  return <Alert color="yellow">Connecting to real-time services...</Alert>
}
```

**Adding a new real-time feature**
1. Define TypeScript payload types in `src/types/`
2. Add event handlers in the relevant service (`src/services/realtimeService.ts`) or a scoped hook
3. Emit from the component or service layer, never from store actions
4. Always clean up listeners on unmount