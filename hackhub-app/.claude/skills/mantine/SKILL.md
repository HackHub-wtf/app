---
name: mantine
description: Builds UI components and layouts with Mantine component library for HackHub
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Mantine Skill

Mantine 8.2.x is the primary UI library for HackHub, providing accessible components, theming, hooks, and utilities. All visual components use Mantine — no custom CSS frameworks or inline styles unless Mantine lacks the primitive needed.

## Quick Start

```typescript
import { Card, Group, Button, Text, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
```

All Mantine packages are already installed: `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`, `@mantine/modals`, `@mantine/dates`, `@mantine/dropzone`, `@mantine/carousel`, `@mantine/charts`, `@mantine/spotlight`.

## Key Concepts

**Layout primitives** — use `Stack` for vertical, `Group` for horizontal, `SimpleGrid` for grids. Avoid raw `div` wrappers when a Mantine primitive fits.

**Theming** — colors, spacing, radius, and breakpoints come from the theme. Use `rem()` for sizing, `var(--mantine-color-*)` CSS variables for colors, and `c=` / `bg=` props instead of inline `style`.

**Notifications** — call `notifications.show({ title, message, color })` from `@mantine/notifications`. Never build custom toast UI.

**Modals** — use `modals.openConfirmModal()` or `modals.open()` from `@mantine/modals` for dialogs. Register custom modals in the `MantineProvider` modals map.

**Forms** — `@mantine/form` is available but HackHub uses React Hook Form + Zod as the primary form layer. Use Mantine's `useForm` only for simple, non-schema-validated forms.

**Icons** — always import from `@tabler/icons-react`, pass directly to Mantine `leftSection` / `rightSection` props or render inline. Size via the `size` prop, not CSS.

## Common Patterns

**Card with action**
```typescript
import { Card, Text, Button, Group } from '@mantine/core'

export function TeamCard({ team, onJoin }: TeamCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={500}>{team.name}</Text>
      <Text size="sm" c="dimmed">{team.description}</Text>
      <Group justify="flex-end" mt="md">
        <Button onClick={() => onJoin(team.id)}>Join</Button>
      </Group>
    </Card>
  )
}
```

**Loading and error states**
```typescript
import { Loader, Alert, Center } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

if (isLoading) return <Center><Loader /></Center>
if (error) return (
  <Alert icon={<IconAlertCircle />} color="red" title="Error">
    {error.message}
  </Alert>
)
```

**Controlled disclosure (modal/drawer)**
```typescript
import { useDisclosure } from '@mantine/hooks'
import { Modal, Button } from '@mantine/core'

const [opened, { open, close }] = useDisclosure(false)

return (
  <>
    <Button onClick={open}>Open</Button>
    <Modal opened={opened} onClose={close} title="Details">
      {/* content */}
    </Modal>
  </>
)
```

**Responsive layout**
```typescript
import { SimpleGrid } from '@mantine/core'

<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</SimpleGrid>
```

**Inline notification on mutation**
```typescript
import { notifications } from '@mantine/notifications'

onSuccess: () => {
  notifications.show({ title: 'Done', message: 'Team created', color: 'green' })
},
onError: (err) => {
  notifications.show({ title: 'Failed', message: err.message, color: 'red' })
}
```