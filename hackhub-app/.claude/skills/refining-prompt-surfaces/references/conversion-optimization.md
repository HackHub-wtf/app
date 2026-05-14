# Conversion Optimization

## When to use
When a modal, banner, or inline prompt has low completion rates — users dismiss without acting, or the action taken isn't the intended one.

## Patterns

### Single-action modals
Strip modals to one primary CTA. Secondary options (cancel, skip) should be visually subordinate. Mantine `Group justify="flex-end"` with `variant="subtle"` for cancel keeps hierarchy clear.

```tsx
<Group justify="flex-end" mt="md">
  <Button variant="subtle" onClick={onClose}>Not now</Button>
  <Button onClick={handleJoin}>Join Team</Button>
</Group>
```

### Contextual trigger alignment
Show prompts only when the user can act on them. A "Submit your idea" banner visible before a hackathon is open creates noise. Gate visibility on hackathon phase from `useHackathonStore`.

```tsx
const { currentHackathon } = useHackathonStore()
if (currentHackathon?.status !== 'active') return null
```

### Friction-reducing defaults
Pre-fill or pre-select where possible. A team-join modal that already shows the team name reduces cognitive load and increases follow-through.

## Pitfalls
- Don't stack multiple CTAs in one surface — "Submit Idea" and "Invite Members" in the same modal splits attention and lowers both.
- Avoid modals triggered on page load; they fire before the user has context and are immediately dismissed.