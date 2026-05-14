# Roadmap & Experiments Feedback

## When to use
Apply when triaging speculative feedback ("it would be cool if…"), A/B test proposals, feature requests with unclear scope, or requests that could go multiple directions depending on product decisions.

## Patterns

**Classifying speculative requests**
"Would be nice" and "maybe someday" language signals low urgency. Bucket as backlog and note the open product question (e.g., "who is the primary user of this feature — managers or participants?"). Don't estimate scope until the question is answered.

**Identifying quick-win experiments**
If a request can be tested with a feature flag (an env var + conditional render), classify it as a quick win with the note that it's experimental. Example: "show team leaderboard on home page" — add a `VITE_SHOW_LEADERBOARD` check in `src/pages/Home.tsx` to gate the experiment.

**Backlog — new data-driven feature**
Requests that need a new Supabase table, migration, and RLS policy are always backlog regardless of how small the UI looks. Use the layer map: if it touches `supabase/migrations/`, it's backlog. Flag schema design as an open question.

## Pitfalls
Don't let "small UI" mislead scope estimation. A leaderboard looks like one component but requires an aggregation query, a service method, and possibly a materialized view. Read `src/services/` before estimating.