# Growth Engineering

## When to use
When wiring decision cues into the product loop — activation → habit → referral — rather than one-off conversion fixes.

## Patterns

**Activation milestone tracking in authStore**
Track which first-actions a user has completed (`hasJoinedTeam`, `hasSubmittedIdea`, `hasCastVote`) as booleans on the profile. Gate congratulatory nudges and next-step prompts off these flags rather than re-querying Supabase on every render.

**Viral loop: team invite with social proof**
When a user creates a team, prompt them to invite via a shareable link. Show the invitee a landing card with the current team member count and the hackathon deadline — both available from `TeamService` and `hackathonStore` — so the invitee sees momentum before deciding to join.

**Re-engagement hook on idle teams**
If a team has no chat activity in 48 h and the deadline is within 72 h, surface a `NotificationService` push to all members. Read last message timestamp from `chatService` query cache and compute idle duration client-side.

## Pitfalls
- Growth loops that rely on email re-engagement need user consent; confirm notification opt-in is captured at registration before triggering any outbound messaging.