# Engagement & Adoption Metrics

## When to use
Measure whether users return and go deeper after activation. Use when instrumenting repeat actions — voting, chat, file sharing, repeat hackathon joins — and feature-level adoption within an active session.

## Patterns

**Session-depth events for collaboration features**
```typescript
export const ENGAGEMENT_EVENTS = {
  CHAT_MESSAGE_SENT: 'chat:message_sent',
  FILE_UPLOADED: 'file:uploaded',
  VOTE_CAST: 'vote:cast',
  IDEA_COMMENTED: 'idea:commented',
  VIDEO_CALL_STARTED: 'video_call:started',
} as const
```

**Track frequency, not just occurrence**
```typescript
// Include session or date context so you can compute DAU/WAU ratios
track(EVENTS.CHAT_MESSAGE_SENT, {
  userId,
  teamId,
  hackathonId,
  sessionId: getSessionId(), // stable ID per browser session
})
```

**Feature adoption flag per user**
```typescript
// After a user casts their first vote, mark the feature as adopted
async function onVoteCast(ideaId: string, userId: string) {
  await votingService.castVote(ideaId, userId)
  track(EVENTS.VOTE_CAST, { userId, ideaId, hackathonId })
}
```

## Pitfalls
- Do not track every keypress or scroll event — aggregate at meaningful action boundaries (message sent, not message typed).
- Avoid attaching large payloads. Keep properties to identifiers and small scalars; never include message content or file data.