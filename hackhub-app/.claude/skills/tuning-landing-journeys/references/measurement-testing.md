# Measurement & Testing

## When to use
When instrumenting landing page changes, validating that CTA clicks and funnel steps are tracked, or setting up A/B variants on hero copy or CTA placement.

## Patterns

**Event naming for funnel steps**
Name events after the action, not the element: `cta_clicked`, `registration_started`, `hackathon_joined`. Pass `{ source: 'home_hero' | 'hackathon_list' }` as context so you can compare entry points.

**Before/after baseline**
Before changing hero copy or CTA placement, record current click-through rate on the primary CTA and registration completion rate. Use these as the baseline for any variant comparison.

**Supabase analytics via RPC or edge functions**
For lightweight funnel tracking without a third-party tool, log conversion events to a `analytics_events` table via an edge function. Keep the schema minimal: `event_name`, `user_id` (nullable), `properties` (jsonb), `created_at`.

## Pitfalls
- Tracking clicks without tracking completions creates misleading data. A CTA with high clicks but low registration completions points to a friction problem downstream, not a headline problem.