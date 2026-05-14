# Feedback & Insights

## When to use
When you need to collect user sentiment directly from zero-data screens — users on empty states are often the most willing to explain what they need. Also use when surfacing aggregate insight (e.g. "3 teams have not submitted ideas") to managers.

## Patterns

### Inline micro-survey on prolonged empty state
Show a one-question prompt after the user has been on an empty screen for several seconds without acting.

```tsx
const [showSurvey, setShowSurvey] = useState(false)

useEffect(() => {
  const timer = setTimeout(() => setShowSurvey(true), 8000)
  return () => clearTimeout(timer)
}, [])

{showSurvey && (
  <Text size="xs" c="dimmed" ta="center" mt="sm">
    Not sure what to do?{' '}
    <Anchor size="xs" href="mailto:support@hackhub.wtf">Let us know</Anchor>
  </Text>
)}
```

### Manager insight banner (aggregate empty signal)
When a hackathon has teams but none have submitted ideas, surface this as a manager action item rather than a per-team empty state.

```tsx
const idleTeams = teams.filter(t => t.idea_count === 0)

{idleTeams.length > 0 && (
  <Alert icon={<IconInfoCircle size={18} />} color="blue" title="Teams without ideas">
    <Text size="sm">
      {idleTeams.length} team{idleTeams.length > 1 ? 's have' : ' has'} not submitted an idea yet.
      Consider sending a reminder.
    </Text>
  </Alert>
)}
```

### Post-action confirmation to reinforce value
After the first idea is submitted, show a brief confirmation that connects the action to outcomes.

```tsx
{justSubmitted && (
  <Alert color="green" icon={<IconCircleCheck size={18} />} withCloseButton onClose={() => setJustSubmitted(false)}>
    Idea submitted. Managers and judges can now review and vote on it.
  </Alert>
)}
```

## Pitfalls
- Do not gate feedback prompts behind another empty state interaction. If the user has already seen three empty states in one session, suppress the micro-survey — survey fatigue will produce noise, not signal.