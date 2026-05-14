# Feedback & Insights

## When to use
Trace how user-generated signals (votes, comments, idea edits, notifications) flow through the system to find where feedback loops break down or fail to reach the user who triggered them.

## Patterns

**Vote confirmation loop**
`FlexibleVotingInterface.tsx` → `votingService.vote()` → Supabase write → `queryClient.invalidateQueries(['votes', ideaId])`. If the invalidation is missing, the vote count displayed to the voter doesn't update until the next full page load — the user gets no confirmation their action registered.

**Notification delivery path**
`notificationService.ts` writes to Supabase, and `NotificationCenter.tsx` reads via a Supabase Realtime subscription or polling. Check that the subscription is set up in a stable effect (not inside a render) and that unread count badges re-render when new rows arrive.

**Comment and idea edit visibility**
`IdeaService` updates propagate to other clients via `RealtimeContext`. Verify that `socket.emit` fires after the Supabase write succeeds (not before) so other clients don't receive a stale payload if the write fails.

## Pitfalls
- Supabase Realtime subscriptions that are not unsubscribed on component unmount fire callbacks into unmounted components, causing React "can't perform state update" warnings and occasionally displaying stale notification counts after navigation.