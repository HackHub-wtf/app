---
name: reducing-form-falloff
description: Improves lead capture and registration forms to reduce user drop-off using React Hook Form, Zod, and Mantine in HackHub's React/TypeScript frontend.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Reducing Form Falloff Skill

Audits and improves HackHub forms to reduce abandonment. Applies progressive disclosure, inline validation, smart defaults, and friction reduction using React Hook Form 7.x, Zod 4.x, and Mantine 8.x components. Targets registration, hackathon creation, team joining, and idea submission flows.

## Quick Start

1. Identify the target form file under `src/pages/` or `src/components/`
2. Read the current field count, validation timing, and error display approach
3. Apply the patterns below to cut steps, show errors inline, and reduce perceived effort
4. Verify with `npm run lint` and a manual walkthrough in `npm run dev`

## Key Concepts

**Field reduction** — every extra field costs conversions. Split multi-field forms into steps or defer optional fields to a profile edit page.

**Validation timing** — validate `onBlur` for most fields, `onChange` only for password strength. Never validate only on submit; users can't correct errors they haven't seen yet.

**Error proximity** — Mantine's `TextInput` and `Select` accept an `error` prop; place errors directly on the field, not in a banner above the form.

**Smart defaults** — pre-fill fields from `useAuthStore` (user name, email) and `useHackathonStore` (active hackathon id) to eliminate redundant typing.

**Perceived progress** — for multi-step forms use `Stepper` from Mantine to show how many steps remain. Keep each step to ≤ 4 fields.

**Submit state** — disable the submit button and show a `Loader` inside it during mutation; re-enable on error so the user can retry without reloading.

## Common Patterns

### Inline validation with React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TextInput, Button } from '@mantine/core'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
})

type FormValues = z.infer<typeof schema>

export function LeadForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput label="Name" error={errors.name?.message} {...register('name')} />
      <TextInput label="Email" error={errors.email?.message} {...register('email')} mt="sm" />
      <Button type="submit" loading={isSubmitting} mt="md" fullWidth>Join</Button>
    </form>
  )
}
```

### Pre-filling from store

```typescript
const { user } = useAuthStore()

const { reset } = useForm<FormValues>({
  defaultValues: { name: user?.user_metadata?.full_name ?? '', email: user?.email ?? '' },
})
```

### Multi-step with Stepper

```typescript
import { Stepper } from '@mantine/core'
const [step, setStep] = useState(0)

<Stepper active={step} onStepClick={setStep}>
  <Stepper.Step label="Basics"><BasicsFields /></Stepper.Step>
  <Stepper.Step label="Details"><DetailsFields /></Stepper.Step>
</Stepper>
```

### Submit button with mutation state

```typescript
const mutation = useMutation({ mutationFn: submitForm })

<Button
  type="submit"
  loading={mutation.isPending}
  disabled={mutation.isPending}
  fullWidth
>
  Submit Idea
</Button>
```

### Surfacing server errors on the field

```typescript
onError: (error) => {
  if (error.message.includes('email')) {
    setError('email', { message: 'This email is already registered' })
  }
}
```