# Distribution

## When to use
When deciding where and when to surface a decision cue so it reaches users at the highest-intent moment.

## Patterns

**Contextual placement over global banners**
Render cues adjacent to the action they relate to — deadline badge next to the submit button on `Ideas.tsx`, slot count inside `TeamCard`, not in a top-of-page announcement. Global banners train users to ignore them.

**Notification channel for async re-engagement**
`NotificationService` can push a nudge when a hackathon deadline is within 24 h and the user's team has no idea submitted. Trigger from a Supabase scheduled function; keep the notification payload small (hackathon name, hours remaining, deep-link route).

**First-visit vs. returning-user differentiation**
Gate profile completion nudges behind a Zustand flag (`hasSeenProfileNudge`) persisted to `localStorage`. Show once on first login; don't re-surface on every page load.

## Pitfalls
- Distributing the same cue across multiple surfaces simultaneously (banner + toast + notification) causes fatigue; pick one channel per cue.