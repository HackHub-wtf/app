# In-App Guidance

## When to use
When the UI surface is unfamiliar or the correct next action is non-obvious — empty tables, blank canvases, or first-time entry into a feature area (e.g. voting criteria, file manager).

## Patterns

### Contextual tooltip on an empty action bar
```tsx
<Tooltip
  label="Add voting criteria to let judges score ideas consistently."
  position="bottom"
  withArrow
  opened={criteria.length === 0 && !tooltipDismissed}
>
  <Button
    leftSection={<IconPlus size={16} />}
    onClick={() => setModalOpen(true)}
  >
    Add criterion
  </Button>
</Tooltip>
```

### Inline helper text below an empty list
Keep guidance close to where the user will act, not in a modal or aside.

```tsx
{files.length === 0 && (
  <Text size="sm" c="dimmed" mt="xs">
    No files attached. Drag and drop or click "Upload" to share project assets with your team.
  </Text>
)}
```

### Feature spotlight card for new capabilities
Used once per feature, keyed to the user ID so it does not reappear.

```tsx
const storageKey = `spotlight_video_${user!.id}`
const [seen, setSeen] = useState(() => !!localStorage.getItem(storageKey))

if (!seen) {
  return (
    <Card withBorder p="md" mb="md">
      <Group justify="space-between">
        <Group gap="sm">
          <IconVideo size={20} />
          <Text fw={500} size="sm">Video calls are now available</Text>
        </Group>
        <CloseButton onClick={() => { localStorage.setItem(storageKey, '1'); setSeen(true) }} />
      </Group>
      <Text size="xs" c="dimmed" mt={4}>Start a call directly from your team page.</Text>
    </Card>
  )
}
```

## Pitfalls
- Tooltips that persist after the user has taken the guided action become noise. Tie `opened` to the actual empty condition, not a standalone boolean flag.