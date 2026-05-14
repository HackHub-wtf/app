# Roadmap Experiments

## When to use
Score speculative or high-uncertainty initiatives — new auth providers, real-time infrastructure swaps, AI features — where the risk score should anchor the ranking before effort is estimated.

## Patterns

**Feature flags via env vars** — `VITE_APP_ENVIRONMENT` is already available. Gating experimental UI behind an env check costs nothing and lets the team ship to staging without exposing incomplete work to production users.

**Parallel real-time proof of concept** — Before committing to migrating chat from Socket.io to Supabase Realtime, add a shadow subscription in one low-traffic component (e.g., a notification feed) to validate latency and event delivery. This isolates risk to a non-critical path.

**Spike-first for cross-cutting changes** — Any initiative touching `supabase.ts`, `RealtimeContext.tsx`, or `authStore.ts` simultaneously should be treated as a spike, not a feature. Time-box the exploration and score the full initiative only after the spike surfaces actual file counts and migration requirements.

## Pitfalls
The scoring formula `(Impact × 2) / (Effort + Risk)` can make high-impact infrastructure bets look attractive even when risk is high. For experiments, treat a risk score above 4 as a hard flag — cap these at spike status until risk is understood, regardless of impact.