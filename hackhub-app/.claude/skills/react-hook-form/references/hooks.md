# React Hook Form Hooks

## When to use
Use these hooks when building or editing forms in HackHub. They replace manual `useState` + validation logic with a schema-driven approach.

### `useForm`
```typescript
const {
  register,
  handleSubmit,
  control,
  watch,
  reset,
  setError,
  formState: { errors, isSubmitting, isDirty }
} = useForm<FormValues>({ resolver: zodResolver(schema) })
```

### `useController` for complex Mantine inputs
```typescript
const { field, fieldState } = useController({ name: 'role', control })
// field.value, field.onChange, fieldState.error?.message
```

### `useFormContext` for nested components
```typescript
// Parent: wrap with <FormProvider {...methods}>
// Child:
const { register, formState: { errors } } = useFormContext<FormValues>()
```

## Pitfalls
- Never call `useForm` conditionally — it's a hook and must run on every render.
- Don't destructure `formState` outside the component body; it uses proxies and won't update if destructured early.