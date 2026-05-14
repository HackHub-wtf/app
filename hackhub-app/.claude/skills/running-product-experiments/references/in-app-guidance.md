# In-App Guidance Experiments

## When to use
Test tooltips, coach marks, empty-state copy, or contextual help panels for new features before rolling them out to everyone.

## Patterns

**Tooltip experiment on a new UI control**
```typescript
function VotingCriteriaButton() {
  const showTooltip = useExperiment('criteria_tooltip_v1', 25)
  return (
    <Tooltip label="Customize how ideas are scored" disabled={!showTooltip}>
      <ActionIcon><IconAdjustments /></ActionIcon>
    </Tooltip>
  )
}
```

**Coach mark shown once per user session**
```typescript
function IdeaFormCoachMark() {
  const showCoachMark = useExperiment('idea_form_coach_mark', 50)
  const [seen, setSeen] = useState(false)
  if (!showCoachMark || seen) return null
  return (
    <Popover opened onClose={() => setSeen(true)}>
      <Text size="sm">Tip: use markdown to format your idea description.</Text>
    </Popover>
  )
}
```

**Empty state copy variant**
```typescript
function TeamEmptyState() {
  const useFriendlyCopy = useExperiment('friendly_empty_state', 60)
  return (
    <Text>{useFriendlyCopy
      ? "No teams yet — be the first to form one!"
      : "No teams have been created for this hackathon."
    }</Text>
  )
}
```

## Pitfalls
- Do not stack multiple coach marks on the same page. Cap to one guidance element per render cycle per user.
- Guidance tied to `useExperiment` will disappear when the flag is removed. Track dismissal in `user_metadata` if persistence across sessions matters.