# Mantine UI Patterns

## When to use
Reference this when building or reviewing React components in HackHub that need layout, data display, forms, or user feedback.

## Layout

Use `Stack` / `Group` / `SimpleGrid` — not raw `div` — for spacing and arrangement.

```typescript
// Vertical list of cards
<Stack gap="md">
  {teams.map(t => <TeamCard key={t.id} team={t} />)}
</Stack>

// Horizontal toolbar
<Group justify="space-between" mb="md">
  <Title order={3}>Teams</Title>
  <Button onClick={open}>New Team</Button>
</Group>

// Responsive grid
<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
  {ideas.map(i => <IdeaCard key={i.id} idea={i} />)}
</SimpleGrid>
```

## Loading and error states

Always guard data before rendering to avoid crashes.

```typescript
import { Loader, Alert, Center } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

if (isLoading) return <Center h={200}><Loader /></Center>
if (error) return (
  <Alert icon={<IconAlertCircle size={16} />} color="red" title="Failed to load">
    {error.message}
  </Alert>
)
```

## Modal with disclosure

```typescript
import { useDisclosure } from '@mantine/hooks'
import { Modal, Button } from '@mantine/core'

const [opened, { open, close }] = useDisclosure(false)

return (
  <>
    <Button onClick={open}>Edit Team</Button>
    <Modal opened={opened} onClose={close} title="Edit Team" centered>
      <TeamForm onSuccess={close} />
    </Modal>
  </>
)
```

## Pitfalls

- **Don't use inline `style` for colors or spacing** — use `c=`, `bg=`, `mt=`, `p=` props or `var(--mantine-color-*)` CSS variables.
- **Don't build custom toasts** — always call `notifications.show()` from `@mantine/notifications`.
- **Don't size icons with CSS** — pass `size` prop directly to `@tabler/icons-react` components.