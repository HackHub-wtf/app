# Form Components with Mantine

## When to use
Use these patterns whenever wiring React Hook Form to Mantine UI components in HackHub forms.

### Native-ref inputs (`register`)
```typescript
<TextInput
  label="Team name"
  error={errors.name?.message}
  {...register('name')}
/>
<Textarea
  label="Description"
  error={errors.description?.message}
  {...register('description')}
/>
```

### Controlled Mantine components (`Controller`)
Use `Controller` for `Select`, `MultiSelect`, `Switch`, `Checkbox`, `DatePicker` — anything that doesn't forward a `ref`.
```typescript
<Controller
  name="hackathonId"
  control={control}
  render={({ field, fieldState }) => (
    <Select
      label="Hackathon"
      data={hackathons.map(h => ({ value: h.id, label: h.name }))}
      error={fieldState.error?.message}
      {...field}
    />
  )}
/>
```

### Root-level server errors
```typescript
{errors.root && (
  <Text c="red" size="sm" mt="xs">{errors.root.message}</Text>
)}
```

## Pitfalls
- Spreading `register()` on a Mantine `Select` won't work — Mantine's `Select` doesn't use a native `<select>` and ignores the `ref`. Always use `Controller` for it.