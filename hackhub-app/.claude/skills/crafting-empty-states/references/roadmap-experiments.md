# Roadmap & Experiments

## When to use
When iterating on empty state copy, CTA placement, or onboarding flow variants. Treat these components as experiment surfaces — small copy or layout changes can meaningfully affect activation.

## Patterns

### Feature-flag-gated empty state variant
Keep both variants in the component and switch via an env variable or a simple flag until a winner is confirmed.

```tsx
const SHOW_ILLUSTRATED_EMPTY = import.meta.env.VITE_ILLUSTRATED_EMPTY === 'true'

export function EmptyHackathons() {
  if (SHOW_ILLUSTRATED_EMPTY) {
    return <IllustratedEmptyHackathons />
  }
  return <TextOnlyEmptyHackathons />
}
```

### A/B copy test via user ID bucket
Deterministic bucketing — same user always sees the same variant.

```tsx
const variant = user && parseInt(user.id.slice(-1), 16) % 2 === 0 ? 'A' : 'B'
const headline = variant === 'A' ? 'No ideas yet' : 'Your team has not pitched anything'
```

### Graduated onboarding (checklist pattern)
Replace a one-shot banner with a persistent checklist that tracks progress. Store completion per user.

```tsx
const tasks = [
  { id: 'create_team', label: 'Create a team', done: teams.length > 0 },
  { id: 'submit_idea', label: 'Submit an idea', done: ideas.length > 0 },
  { id: 'cast_vote',   label: 'Cast a vote',   done: hasVoted },
]
const allDone = tasks.every(t => t.done)
if (allDone) return null
return (
  <Card withBorder p="md">
    <Text fw={600} mb="xs">Getting started</Text>
    {tasks.map(t => (
      <Group key={t.id} gap="xs">
        {t.done ? <IconCircleCheck color="green" size={16} /> : <IconCircle size={16} />}
        <Text size="sm" td={t.done ? 'line-through' : undefined}>{t.label}</Text>
      </Group>
    ))}
  </Card>
)
```

## Pitfalls
- Clean up feature flags once an experiment concludes. Dead flag branches left in production accumulate and confuse future contributors.