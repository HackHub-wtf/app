# Growth Engineering

## When to use
When wiring up referral flows, activation milestones, or any code path that feeds data back to an ad platform or analytics tool.

## Patterns

**Activation milestone events**
Define the three HackHub activation points and fire events at each:
```typescript
// account created → hackathon joined → first idea submitted
const MILESTONES = ['account_created', 'hackathon_joined', 'idea_submitted'] as const
// Fire trackMeta / trackGoogle at each transition
```

**Referral param capture**
Treat `ref` the same as UTMs — capture on entry, store in `sessionStorage`, attach to signup metadata:
```typescript
const ref = new URLSearchParams(window.location.search).get('ref')
if (ref) sessionStorage.setItem('referral_code', ref)
```

**Supabase analytics query for UTM attribution**
```sql
select raw_user_meta_data->>'utm_source' as source,
       count(*) as signups
from auth.users
group by 1
order by 2 desc;
```

## Pitfalls
Do not fire activation events in the same `useEffect` that triggers the mutation — wait for `isSuccess` to be true. Double-fires inflate conversion counts in ad platforms and break ROAS calculations.