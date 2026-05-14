# Strategy & Monetization

## When to use
Apply when deciding which acquisition tools to build, how to sequence them in the funnel, and how to connect free tool usage to HackHub paid plans.

## Patterns

**Tool-to-trial bridge**
After a lead submits the form, redirect to a pre-filled signup page that highlights the feature the tool previewed — reduces the mental jump from "free tool" to "product".
```typescript
const onSubmit = async (data: LeadInput) => {
  await supabase.from('leads').insert({ ...data, source: 'budget-estimator' })
  navigate('/signup?from=budget-estimator&plan=starter')
}
```

**Feature preview as acquisition hook**
Build tools that mirror a real HackHub feature at reduced fidelity — the gap between the tool and the full product is the upgrade motivation.

| Free tool | Full feature |
|-----------|-------------|
| Team size estimator (static) | Dynamic capacity planning with real participant data |
| Budget template download | Budget tracker with actuals vs. estimates |
| One-time idea scoring | Persistent voting system with custom criteria |

**Lead-to-user attribution**
Join `leads` to `auth.users` on email after signup to measure tool-to-paid conversion without requiring third-party CRM.
```sql
select
  l.source,
  l.created_at as lead_at,
  u.created_at as signup_at,
  extract(epoch from (u.created_at - l.created_at)) / 3600 as hours_to_signup
from leads l
join auth.users u on lower(u.email) = lower(l.email)
order by l.created_at desc;
```

## Pitfalls
- Do not gate the tool entirely behind a plan — the free tool IS the top-of-funnel. Paywalling it removes the acquisition mechanism.
- Keep tool scope narrow: one problem, one output. Broad tools are hard to build, harder to share, and don't create a clear upgrade path.