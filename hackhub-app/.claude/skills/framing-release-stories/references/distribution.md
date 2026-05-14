# Distribution

## When to use
When deciding which channels to notify and in what order after a feature ships to Cloudflare Pages.

## Patterns

**Channel sequence for HackHub:** (1) internal Slack or GitHub release note for the team, (2) in-app notification via `NotificationService` if the feature affects active hackathon sessions, (3) external changelog or social if it's a public-facing milestone. Don't post externally before the Supabase migration is confirmed applied in production.

**Audience routing by role:** use the audience impact table from the release story to decide who gets proactive outreach. Managers get setup guides; participants get "what's new" copy; admins get migration steps. Grep `src/utils/permissions.ts` for the role constants to ensure you name roles consistently with the codebase.

**Real-time feature rollouts:** if the feature touches Socket.io events (check `src/contexts/RealtimeContext.tsx`), notify users during low-traffic windows. Active sessions connected to old event contracts may break silently if the server-side event name changes without a deprecation period.

## Pitfalls
Don't distribute until `npm run build` passes cleanly and the Cloudflare Pages deploy status is green. A broken deploy with an active announcement creates confusion and erodes trust faster than a delayed announcement.