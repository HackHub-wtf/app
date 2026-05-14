# Growth Engineering

## When to use
When designing loop mechanics — deciding on token scope (global vs. per-hackathon), setting viral depth limits, or wiring reward triggers to conversion events.

## Patterns

**Token scope per hackathon**
Add an optional `hackathon_id` column to `referrals` so tokens can be scoped to a specific event. A `null` value means a global invite. This lets you run hackathon-specific referral campaigns without polluting global stats.

**Viral depth cap**
Store `depth` in `referral_conversions` and reject inserts beyond a configured max (e.g., depth > 3) via a Supabase check constraint:
```sql
alter table referral_conversions
  add constraint max_depth check (depth <= 3);
```

**Reward trigger via database function**
Instead of calling reward logic from the client, create a Supabase `after insert` trigger on `referral_conversions` that calls a PL/pgSQL function to credit rewards. This prevents reward duplication from client retries.

## Pitfalls
- Avoid unlimited viral depth — chains longer than 3 hops are nearly impossible to audit for abuse and rarely drive meaningful conversions.
- Don't store reward state (badge granted, votes credited) in `referral_conversions` — keep it in a separate `referral_rewards` table to separate attribution from fulfillment.