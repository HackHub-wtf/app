# Engagement & Feature Adoption

## When to use
When a user is active but hasn't touched a high-value feature (team chat, video calls, file sharing, flexible voting) after a natural trigger moment.

## Patterns

**Feature→moment mapping for nudges**

| Feature | Trigger moment | Role |
|---------|---------------|------|
| Team Chat | After team join | participant |
| Video Call | 30 min before deadline | participant, manager |
| File Manager | First idea submission | participant |
| Flexible Voting | After first vote cast | participant |

**Notification-based nudge via `notificationService`**
```typescript
import { notificationService } from '@/services/notificationService'

notificationService.notify({
  type: 'feature_nudge',
  title: 'Try file sharing',
  message: 'Attach mockups or code snippets directly to your idea.',
  actionLabel: 'Open file manager',
  actionUrl: `/teams/${teamId}/files`
})
```

**In-session nudge via `RealtimeContext`**
```typescript
// Trigger for all team members when deadline is close
const { socket } = useRealtime()
socket.emit('team:nudge', { teamId, feature: 'video-call', message: 'Deadline in 30 min — jump on a call?' })
```

## Pitfalls
Don't fire nudges more than once per session for the same feature. Track dismissed state in the adoption Zustand store and check before triggering any notification or tooltip.