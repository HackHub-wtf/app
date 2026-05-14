# Feedback & Insight Collection in Experiments

## When to use
Collect qualitative signal (ratings, NPS, free-text) or behavioral micro-feedback from users inside an active experiment variant.

## Patterns

**In-variant micro-survey (shown once per experiment)**
```typescript
function VotingFeedbackPrompt({ experimentKey }: { experimentKey: ExperimentKey }) {
  const [submitted, setSubmitted] = useState(false)
  const user = useAuthStore(s => s.user)

  async function handleRating(score: number) {
    await supabase.from('experiment_feedback').insert({
      user_id: user?.id,
      experiment: experimentKey,
      score,
      occurred_at: new Date().toISOString(),
    })
    setSubmitted(true)
  }

  if (submitted) return null
  return (
    <Group>
      <Text size="sm">How useful was the new voting experience?</Text>
      {[1, 2, 3, 4, 5].map(n => (
        <Button key={n} variant="subtle" size="xs" onClick={() => handleRating(n)}>{n}</Button>
      ))}
    </Group>
  )
}
```

**Free-text feedback tied to experiment variant**
```typescript
async function submitFeedback(text: string, experiment: string) {
  await supabase.from('experiment_feedback').insert({
    user_id: (await supabase.auth.getUser()).data.user?.id,
    experiment,
    free_text: text,
    occurred_at: new Date().toISOString(),
  })
}
```

**Read aggregate scores for a running experiment**
```typescript
const { data: scores } = useQuery({
  queryKey: ['experiment-feedback', 'new_voting_ui'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('experiment_feedback')
      .select('score')
      .eq('experiment', 'new_voting_ui')
    if (error) throw error
    return data
  },
  enabled: isManagerRole,
})
```

## Pitfalls
- Do not ask for feedback immediately on page load — wait for a meaningful interaction (e.g., after a vote is cast) so the signal reflects actual usage.
- RLS on `experiment_feedback` must allow user inserts but restrict reads to managers/admins only. Never expose raw feedback rows to participants.