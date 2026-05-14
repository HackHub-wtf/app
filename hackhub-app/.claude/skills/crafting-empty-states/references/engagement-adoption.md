# Engagement & Adoption

## When to use
When users are past first login but have stalled — they created a team but have not submitted an idea, or a hackathon has teams but no votes. Empty states here should prompt the next meaningful action, not just explain absence.

## Patterns

### Team with no ideas (participant view)
```tsx
export function EmptyIdeas({ teamId }: { teamId: string }) {
  return (
    <Stack align="center" gap="md" py="xl">
      <IconBulb size={48} stroke={1.2} color="var(--mantine-color-dimmed)" />
      <Text fw={600} size="lg">No ideas submitted yet</Text>
      <Text c="dimmed" size="sm" ta="center" maw={360}>
        Your team has not pitched anything. Be the first to start the conversation.
      </Text>
      <Button component={Link} to={`/teams/${teamId}/ideas/new`}>
        Submit an idea
      </Button>
    </Stack>
  )
}
```

### Voting period open but no votes cast
Highlight urgency when a deadline is approaching.

```tsx
<Alert color="yellow" icon={<IconAlertCircle size={18} />} title="Voting is open">
  <Text size="sm">
    No votes recorded yet. The voting window closes {formatDate(hackathon.voting_ends_at)}.
  </Text>
  <Button size="xs" mt="xs" component={Link} to={`/hackathons/${id}/vote`}>
    Start voting
  </Button>
</Alert>
```

### Progress nudge in sidebar
When a team has an idea but no attachments or description, show a subtle nudge inline rather than a full empty state.

```tsx
{idea.description.length < 50 && (
  <Text size="xs" c="orange">
    Your idea description is very short — add more detail to stand out.
  </Text>
)}
```

## Pitfalls
- Avoid stacking multiple nudges on the same screen. Pick the single most important missing action and surface only that one.