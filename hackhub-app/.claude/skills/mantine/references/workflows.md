# Mantine Workflows

## When to use
Follow these workflows when adding new UI features, mutation feedback, or confirmation dialogs in HackHub.

## Mutation with notification feedback

Wire `onSuccess` / `onError` from React Query mutations to `notifications.show()`.

```typescript
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TeamService } from '@/services/teamService'

export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTeamInput) => TeamService.createTeam(data),
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ['teams', team.hackathon_id] })
      notifications.show({ title: 'Team created', message: team.name, color: 'green' })
    },
    onError: (err: Error) => {
      notifications.show({ title: 'Failed', message: err.message, color: 'red' })
    },
  })
}
```

## Confirm-before-delete with modals

Use `modals.openConfirmModal()` — don't build a custom confirm dialog.

```typescript
import { modals } from '@mantine/modals'
import { Text } from '@mantine/core'

function handleDelete(teamId: string) {
  modals.openConfirmModal({
    title: 'Delete team',
    children: <Text size="sm">This action cannot be undone.</Text>,
    labels: { confirm: 'Delete', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onConfirm: () => deleteTeam(teamId),
  })
}
```

## Form with Mantine inputs + React Hook Form

Mantine inputs are uncontrolled by default — wire them via `Controller` or `register`.

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextInput, Textarea, Button, Stack } from '@mantine/core'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1), description: z.string() })
type FormData = z.infer<typeof schema>

export function TeamForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSuccess)}>
      <Stack>
        <TextInput label="Name" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" error={errors.description?.message} {...register('description')} />
        <Button type="submit" loading={isSubmitting}>Create</Button>
      </Stack>
    </form>
  )
}
```

## Pitfalls

- **Don't use `@mantine/form` for validated forms** — HackHub uses React Hook Form + Zod; `@mantine/form` is only acceptable for trivial, schema-free cases.
- **Don't forget to register custom modals** in `MantineProvider`'s `modals` prop before calling `modals.open()` with a component key.