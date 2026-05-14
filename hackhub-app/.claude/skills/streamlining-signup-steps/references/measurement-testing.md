# Measurement & Testing

## When to use
When instrumenting signup steps to identify where users drop off, or A/B testing form changes.

## Patterns

**Step-level events** — fire a tracking event at each discrete signup action: form render, first field interaction, submit attempt, success, and error. This lets you identify the exact step where drop-off occurs.

**Error-type tracking** — log which validation errors appear most often. If `password` errors dominate, the field requirements are unclear. If `email` errors dominate, users may be mistyping or using an unexpected format.

**Redirect destination tracking** — measure what percentage of new signups reach a "first value action" (joined a hackathon, created a team) within the first session. This is the activation metric, not signup completion.

## Pitfalls
Do not track PII (email addresses, names) in analytics events. Log event types and outcomes only. This applies to both client-side analytics and any server-side logging through Supabase Edge Functions.