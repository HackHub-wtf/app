# Engagement & Adoption

## When to use
Score engagement initiatives when existing users are present but underusing core features — voting, chat, file sharing, or notifications.

## Patterns

**Notification nudges** — `NotificationCenter.tsx` and `notificationService.ts` are already wired. Adding new notification types (e.g., "your idea received a vote") requires only a new event in `notificationService.ts` and a Supabase row insert — no migration, no RLS change.

**Chat discoverability** — `TeamChat.tsx` is feature-complete but may be hidden behind tab navigation. Re-ordering layout in the team detail page touches one component and zero services, making it a low-effort, high-visibility bet.

**Voting reminders** — `votingService.ts` and `FlexibleVotingInterface.tsx` handle the voting flow. A deadline-based reminder surfaced through `notificationService.ts` adds urgency without touching the voting schema.

## Pitfalls
Real-time engagement features that touch `RealtimeContext.tsx` or `useSocket.ts` carry elevated regression risk — bugs in the Socket.io event loop are hard to reproduce locally. Scope these bets carefully and test against a running Supabase instance.