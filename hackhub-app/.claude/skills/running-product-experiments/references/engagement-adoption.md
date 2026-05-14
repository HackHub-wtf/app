# Engagement & Adoption Experiments

## When to use
Test UI changes or nudges intended to increase feature usage — voting, idea submission, team chat — across a subset of users.

## Patterns

**Surface a feature nudge to low-engagement users**
```typescript
// Derive engagement tier from server-side data, not client guess
const { data: stats } = useQuery({
  queryKey: ['user-stats', user?.id],
  queryFn: () => fetchUserActivityStats(user!.id),
})
const showVotingNudge = useExperiment('voting_nudge_banner', 40) && stats?.votes_cast === 0
```

**Sticky engagement prompt (dismissed state in localStorage)**
```typescript
function VotingNudgeBanner() {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('voting_nudge_dismissed') === '1'
  )
  if (dismissed) return null
  return (
    <Alert onClose={() => { localStorage.setItem('voting_nudge_dismissed', '1'); setDismissed(true) }}>
      Cast your first vote to shape the winning idea.
    </Alert>
  )
}
```

**Track adoption event at the decision point**
```typescript
if (showVotingNudge) {
  trackEvent('experiment_nudge_shown', { feature: 'voting', variant: 'banner_v1' })
}
```

## Pitfalls
- Do not derive engagement tier from client-only state — it drifts. Use a Supabase query or materialized view.
- Nudges shown repeatedly without dismissal logic hurt retention. Always provide a clear dismiss path.