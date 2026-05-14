# Product Analytics for Experiments

## When to use
Instrument experiment exposure and outcome events so you can measure whether a variant actually changes behavior.

## Patterns

**Minimal event tracker (no external SDK required)**
```typescript
// src/utils/analytics.ts
export function trackEvent(event: string, props: Record<string, unknown> = {}) {
  supabase.from('analytics_events').insert({
    event,
    user_id: supabase.auth.getUser().then(r => r.data.user?.id),
    properties: props,
    occurred_at: new Date().toISOString(),
  }).then(({ error }) => {
    if (error && import.meta.env.DEV) console.warn('analytics insert failed', error)
  })
}
```

**Instrument experiment exposure at the decision point**
```typescript
function IdeaFeedPage() {
  const showNewVotingUI = useExperiment('new_voting_ui', 20)

  useEffect(() => {
    trackEvent('experiment_exposure', {
      experiment: 'new_voting_ui',
      variant: showNewVotingUI ? 'treatment' : 'control',
    })
  }, [showNewVotingUI])
  // ...
}
```

**Track the outcome event**
```typescript
async function handleVoteSubmit(ideaId: string) {
  await votingService.castVote(ideaId)
  trackEvent('vote_cast', { idea_id: ideaId, experiment: 'new_voting_ui' })
}
```

## Pitfalls
- Do not fire the exposure event on every render — put it in a `useEffect` with a stable dependency. Duplicate rows inflate experiment counts.
- Analytics inserts are fire-and-forget. If the table does not exist or RLS blocks the insert, fail silently in production but log in dev.