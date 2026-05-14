# Form State

## When to use
Use these patterns to read and react to form state: dirty fields, touched fields, submission status, and field values.

### Commonly used `formState` fields
```typescript
const { formState: { errors, isSubmitting, isDirty, isValid, touchedFields } } = useForm(...)

// Disable submit until form is valid and dirty
<Button type="submit" disabled={!isDirty || !isValid} loading={isSubmitting}>
  Save changes
</Button>
```

### Watch a field to drive conditional UI
```typescript
const projectType = watch('projectType')

{projectType === 'external' && (
  <TextInput label="Repo URL" error={errors.repoUrl?.message} {...register('repoUrl')} />
)}
```

### Reset to new values after async load
```typescript
// Resets both values and dirty/touched state
reset({ name: team.name, description: team.description })

// Reset to original defaultValues
reset()
```

## Pitfalls
- `isValid` is `false` on first render unless `mode: 'onChange'` is set. For submit-only validation (default), check `errors` instead of `isValid` for conditional rendering.