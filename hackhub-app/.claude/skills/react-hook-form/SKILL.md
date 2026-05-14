---
name: react-hook-form
description: Manages form state, validation, and submission handling using React Hook Form 7.x with Zod schema validation and Mantine UI components in the HackHub React/TypeScript application.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# React Hook Form Skill

Handles all form work in HackHub using React Hook Form 7.x paired with Zod 4.x for schema validation and `@hookform/resolvers` for the bridge between them. Forms integrate with Mantine UI components via controlled inputs and display inline field errors using Mantine's `error` prop pattern.

## Quick Start

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TextInput, Button, Stack } from '@mantine/core'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  hackathonId: z.string().uuid('Invalid hackathon')
})

type FormValues = z.infer<typeof schema>

export function TeamForm({ onSubmit }: { onSubmit: (data: FormValues) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack>
        <TextInput label="Team name" error={errors.name?.message} {...register('name')} />
        <Button type="submit" loading={isSubmitting}>Create</Button>
      </Stack>
    </form>
  )
}
```

## Key Concepts

**Schema-first validation** — define a Zod schema, infer the TypeScript type from it with `z.infer<typeof schema>`, pass the schema to `zodResolver`. Never duplicate validation logic in both the schema and component.

**`register` vs `Controller`** — use `register` for native HTML inputs and Mantine inputs that forward a `ref`. Use `Controller` (or `useController`) for Mantine components that don't support `ref` forwarding (e.g. `Select`, `MultiSelect`, `DatePicker`, `Switch`).

**`isSubmitting` for loading state** — `formState.isSubmitting` is `true` while the `handleSubmit` async callback is running; pass it to Mantine's `loading` prop instead of managing a separate state variable.

**`reset` after success** — call `reset()` inside the submit handler after a successful mutation to clear field values and dirty state.

**`setError` for server errors** — map API/Supabase errors back to specific fields with `setError('fieldName', { message: '...' })` or to the whole form with `setError('root', { message: '...' })`.

## Common Patterns

### Controlled Mantine select with `Controller`

```typescript
import { Controller } from 'react-hook-form'
import { Select } from '@mantine/core'

<Controller
  name="role"
  control={control}
  render={({ field, fieldState }) => (
    <Select
      label="Role"
      data={['admin', 'participant']}
      error={fieldState.error?.message}
      {...field}
    />
  )}
/>
```

### Reset after mutation

```typescript
const { reset, handleSubmit } = useForm<FormValues>({ resolver: zodResolver(schema) })

const onSubmit = async (data: FormValues) => {
  await TeamService.createTeam(data)
  reset()
}
```

### Surface server errors on the form

```typescript
const { setError, handleSubmit } = useForm<FormValues>({ resolver: zodResolver(schema) })

const onSubmit = async (data: FormValues) => {
  try {
    await TeamService.createTeam(data)
  } catch (err) {
    setError('root', { message: err instanceof Error ? err.message : 'Something went wrong' })
  }
}

// In JSX
{errors.root && <Text c="red" size="sm">{errors.root.message}</Text>}
```

### Default values for edit forms

```typescript
const { reset } = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: team.name, hackathonId: team.hackathon_id }
})

useEffect(() => {
  if (team) reset({ name: team.name, hackathonId: team.hackathon_id })
}, [team, reset])
```

### Watch a field to conditionally render UI

```typescript
const projectType = watch('projectType')

{projectType === 'external' && (
  <TextInput label="Repository URL" error={errors.repoUrl?.message} {...register('repoUrl')} />
)}
```