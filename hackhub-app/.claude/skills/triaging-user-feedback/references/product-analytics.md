# Product Analytics Feedback

## When to use
Apply when triaging requests to add tracking, measure feature usage, understand drop-off points, or instrument a new flow. Also applies to feedback from analytics tools surfacing unexpected user paths.

## Patterns

**Quick win — add a single event call to an existing handler**
If `VITE_GOOGLE_ANALYTICS_ID` is set, a `gtag('event', ...)` call in an existing `handleSubmit` or `onClick` handler is a one-line change. Confirm the env var is wired: `grep -r "gtag\|analytics" src/ --include="*.ts" --include="*.tsx" -l`.

**Quick win — log a console event for a new user action during development**
Temporary instrumentation to validate a hypothesis (e.g., "do users reach step 3?") can be a `console.log` or a stub analytics call in the relevant component. Flag it explicitly as temp so it doesn't ship to production.

**Backlog — funnel instrumentation across multiple steps**
Tracking a multi-step flow (register → join team → submit idea) requires consistent event naming, a shared analytics utility, and coordination across `src/pages/` and `src/services/`. Scope as medium backlog; open question: use Google Analytics events or a dedicated product analytics tool?

## Pitfalls
Don't instrument inside React Query `onSuccess` callbacks for events that should fire on user intent — the callback fires on cache hits too. Instrument the user action (button click), not the data response.