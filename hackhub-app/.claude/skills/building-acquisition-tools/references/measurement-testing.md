# Measurement & Testing

## When to use
Apply when instrumenting a lead magnet or acquisition page to understand drop-off, conversion rate, and which variants perform better.

## Patterns

**Funnel event logging to Supabase**
Write lightweight step events to a `funnel_events` table for later analysis — no external analytics dependency required.
```typescript
async function trackStep(step: 'tool_start' | 'form_submit' | 'signup_click', meta?: Record<string, unknown>) {
  await supabase.from('funnel_events').insert({
    step,
    tool: 'team-planner',
    session_id: crypto.randomUUID(),
    meta,
  })
}
```

**A/B variant via URL param**
Read a `variant` query param at render time and pass it through to the lead insert so you can compare conversion rates per variant without a third-party tool.
```typescript
const variant = new URLSearchParams(window.location.search).get('v') ?? 'control'

// In onSubmit:
await supabase.from('leads').insert({ email, source, variant })
```

**Conversion rate query**
```sql
select
  variant,
  count(*) filter (where step = 'form_submit') as submissions,
  count(*) filter (where step = 'signup_click') as signups,
  round(
    count(*) filter (where step = 'signup_click')::numeric
    / nullif(count(*) filter (where step = 'form_submit'), 0) * 100, 1
  ) as conversion_pct
from funnel_events
group by variant;
```

## Pitfalls
- `session_id` must be generated client-side and persisted in `sessionStorage` across steps — don't regenerate it on each event or funnel attribution breaks.
- RLS on `funnel_events` should allow anonymous inserts but restrict selects to the `service_role` key used in admin queries.