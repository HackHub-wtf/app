# Feedback & Insights

## When to use
When collecting qualitative signal about where users feel confused or stuck in the activation flow, or when surfacing that signal back into the UI.

## Patterns

**In-flow micro-survey on exit intent from onboarding**
```typescript
const [showSurvey, setShowSurvey] = useState(false)

// Trigger if user navigates away before completing team join
useEffect(() => {
  return () => {
    if (!hasTeam) setShowSurvey(true)
  }
}, [])

// Render a Modal with a single question — max one open-text field
<Modal opened={showSurvey} onClose={() => setShowSurvey(false)} title="Quick question">
  <Textarea label="What stopped you from joining a team?" />
  <Button mt="sm" onClick={submitFeedback}>Submit</Button>
</Modal>
```

**Surface error rates from React Query to detect systemic friction**
```typescript
const queryClient = useQueryClient()

queryClient.getQueryCache().subscribe(event => {
  if (event.type === 'observerResultsUpdated' && event.query.state.status === 'error') {
    track('query:error', {
      queryKey: String(event.query.queryKey),
      error: String(event.query.state.error),
    })
  }
})
```

**Notify.show for non-blocking success confirmation after milestones**
```typescript
import { notifications } from '@mantine/notifications'

// After team join succeeds
notifications.show({
  title: 'You joined the team',
  message: 'Head to Team Chat to introduce yourself.',
  color: 'green',
})
```

## Pitfalls
Do not show feedback prompts more than once per session for the same step — rate-limit using `sessionStorage`. Repeated prompts feel like bugs, not research.