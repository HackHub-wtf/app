# Feedback & User Insights

## When to use
Use these patterns to collect qualitative signal from users at the right moment — after they complete a tour, dismiss a hint, or finish a key action like submitting an idea. Keep surveys short (one question) and contextual.

## Patterns

### Post-tour feedback prompt
After the onboarding tour completes (final step "Done" click), show a single-question `Modal` before fully dismissing:

```typescript
const [showFeedback, setShowFeedback] = useState(false)

// Replace direct markSeen on last step:
onClick={() => isLast ? setShowFeedback(true) : setActive(a => a + 1)}

// Feedback modal:
<Modal opened={showFeedback} onClose={() => { markSeen(TOUR_ID); setShowFeedback(false) }} title="Quick question">
  <Text size="sm">Was this walkthrough helpful?</Text>
  <Group mt="md">
    {['Yes', 'Somewhat', 'No'].map(v => (
      <Button key={v} variant="default" size="xs"
        onClick={() => { submitFeedback(TOUR_ID, v); markSeen(TOUR_ID); setShowFeedback(false) }}>
        {v}
      </Button>
    ))}
  </Group>
</Modal>
```

### Passive NPS via dismissable Alert
Show a one-question NPS `Alert` after a user has submitted their third idea (derive count from React Query data, never store it in guidance state):

```typescript
if (myIdeas.length >= 3 && !hasSeen('nps-ideas-v1')) {
  return <NpsAlert hintId="nps-ideas-v1" />
}
```

### Routing feedback to the right channel
`submitFeedback` should POST to a Supabase `guidance_feedback` table (columns: `hint_id`, `user_id`, `response`, `created_at`) rather than a third-party service, keeping all data in the existing backend.

## Pitfalls
- Never block the user from completing their action to collect feedback. The feedback prompt must always have a visible skip/close path.
- Don't ask for feedback on every dismissal — limit to high-signal moments (tour completion, first successful idea submission). Over-prompting trains users to ignore all guidance.