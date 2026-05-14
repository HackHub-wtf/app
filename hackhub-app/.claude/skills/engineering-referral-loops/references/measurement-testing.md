# Measurement & Testing

## When to use
When instrumenting referral funnel metrics, verifying RLS policies don't leak data between referrers, or writing integration tests for conversion recording.

## Patterns

**Funnel query**
```sql
select
  count(distinct r.referrer_id) as referrers,
  count(distinct rc.referee_id) as conversions,
  round(count(distinct rc.referee_id)::numeric / nullif(count(distinct r.referrer_id), 0) * 100, 1) as conversion_pct
from referrals r
left join referral_conversions rc using (token);
```

**RLS smoke test**
In your integration test suite, authenticate as user A and assert that a `select` on `referral_conversions` returns only rows where `referrer_id = A`. Authenticate as user B and assert zero rows from A's conversions are visible.

**Token collision test**
Generate 10,000 tokens with the same 8-character slice of `crypto.randomUUID()` logic and assert uniqueness. If the collision rate is unacceptable, switch to `nanoid(12)`.

## Pitfalls
- Don't measure conversion rate against total link shares — measure against unique referee signups to avoid double-counting users who click the link multiple times.
- Depth tracking (`referral_conversions.depth`) requires a recursive query or application-level logic; don't assume a flat `depth = 1` insert is correct if you need multi-level attribution.