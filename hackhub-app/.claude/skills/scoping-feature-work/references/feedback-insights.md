# Feedback & Insights

## When to use
Scope this pattern when collecting structured user feedback, surfacing voting results, or presenting aggregated insights to hackathon managers.

## Patterns

### In-app feedback widget
Lightweight thumbs-up / thumbs-down or NPS widget stored in a `feedback` Supabase table. Scope bottom-up.
```
Slice 1 — migration: feedback table (id, user_id, context text, score int, created_at)
           RLS: insert for authenticated users, select for managers/admins only
Slice 2 — feedbackService.ts with submit() method
Slice 3 — FeedbackWidget component using Mantine Rating or two icon buttons
Slice 4 — React Query mutation with optimistic "thanks" state
```

### Voting results dashboard
Aggregate idea scores from existing `votes` table using a Supabase RPC or view. Present via Mantine `Table` or `BarChart` in a manager-gated page.
```
Given user has canManageTeam() === true
When they open the Results tab
Then they see ideas ranked by weighted score
And participants without manager role see only their own idea's score
```

### Idea comment sentiment summary
If ideas have a comments relation, surface a simple count + last-activity timestamp. No ML needed — scope as a service method returning `{ commentCount, lastCommentAt }` joined in a single Supabase select.

## Pitfalls
- Don't expose individual vote attribution to participants — RLS must enforce that vote rows are readable only by managers.
- Avoid client-side aggregation over large result sets; push GROUP BY to Supabase (RPC or view) and return pre-aggregated data.