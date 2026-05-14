# Product Analytics

## When to use
Locate where user actions are observable in code — event emissions, service calls, state transitions — to evaluate what can be instrumented or audited without adding new tracking.

## Patterns

**Action boundaries in services**
Every meaningful user action passes through a service method (`TeamService.createTeam`, `IdeaService.submitIdea`, `votingService`). These are the cleanest instrumentation points: a single function wraps the Supabase call and can emit an analytics event before or after the `await`.

**Route transitions**
React Router 7.x `useNavigate` and `<Link>` calls in page components mark navigation events. Grep for `useNavigate` across `src/pages/` to find where programmatic redirects occur — these are drop-off risks if they fire unexpectedly.

**Real-time event volume**
Socket.io emissions in `RealtimeContext.tsx` and `useSocket.ts` represent collaborative activity signals. Tracing `socket.emit` calls by event name (`join:team`, `leave:team`, message events) maps which features drive active sessions.

## Pitfalls
- Supabase RLS means analytics calls made client-side can fail silently if the user's JWT has expired. Any instrumentation added to service methods should not throw on failure — wrap in try/catch so analytics errors don't break the user action they're observing.