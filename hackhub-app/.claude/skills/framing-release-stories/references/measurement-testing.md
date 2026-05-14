# Measurement & Testing

## When to use
When defining what "success" looks like for a shipped feature and how to verify it before declaring the rollout complete.

## Patterns

**Instrument at the boundary.** The most reliable measurement points in HackHub are service method calls (`teamService`, `ideaService`, `votingService`) and Supabase table writes. If you can't measure at the service layer, add a Supabase analytics event rather than a client-side counter that won't survive page refresh.

**Rollout checklist verification steps.** For every item in the go/no-go checklist, state the exact command or query that proves it's done: `npm run lint` for code quality, a direct Supabase table query for migration confirmation, a grep for the permission guard in `src/utils/permissions.ts` for access control.

**Regression surface for real-time features.** When a Socket.io event name or payload shape changes, the test is whether existing connected clients degrade gracefully. Check `src/hooks/useSocket.ts` and `src/contexts/RealtimeContext.tsx` for error boundaries around event handlers.

## Pitfalls
Don't conflate TypeScript compilation passing with feature correctness. `npm run build` catches type errors, not logic bugs or missing RLS policies. Always verify database-level behavior with a direct Supabase query or integration test against the actual schema.