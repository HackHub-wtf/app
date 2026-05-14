# Product Analytics

## When to use
Score analytics instrumentation when the team lacks signal on which features are used, where users drop off, or which hackathon stages cause friction.

## Patterns

**Event tracking at service boundaries** — `teamService.ts`, `ideaService.ts`, and `votingService.ts` are the natural chokepoints for funnel events. Adding a lightweight `analytics.track()` call at the start of each key method is low-effort and captures the full action surface without touching components.

**Page-level instrumentation** — React Router 7 exposes route transitions in `App.tsx`. A single `useEffect` on route change can fire a page-view event, covering all pages with one insertion point.

**Error rate tracking** — React Query's `onError` callbacks in service hooks are already structured for error handling. Routing these to an analytics sink (e.g., via `VITE_GOOGLE_ANALYTICS_ID`) surfaces real failure rates without new UI work.

## Pitfalls
Do not add a second analytics library if `VITE_GOOGLE_ANALYTICS_ID` is already configured — duplicate tracking inflates event counts and adds bundle weight. Verify the existing integration before scoping a new dependency.