# Form Performance

## When to use
Apply these patterns when forms have many fields, expensive re-renders, or large dependent datasets (e.g. hackathon selects with hundreds of items).

### Isolate re-renders with `useWatch`
```typescript
import { useWatch } from 'react-hook-form'

// Only this component re-renders when 'projectType' changes
function ProjectTypeWatcher({ control }: { control: Control<FormValues> }) {
  const projectType = useWatch({ control, name: 'projectType' })
  return projectType === 'external' ? <ExternalFields control={control} /> : null
}
```

### Avoid re-registering on every render
```typescript
// ✓ Register once — don't recreate options inline
const roleOptions = useMemo(
  () => roles.map(r => ({ value: r.id, label: r.name })),
  [roles]
)
```

### Skip validation mode until submit
```typescript
// Default mode='onSubmit' is cheapest — only validates on submit
// Use mode='onChange' only when live feedback is required (e.g. password strength)
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  mode: 'onSubmit',     // default — cheapest
  reValidateMode: 'onChange'  // re-validates touched fields on change after first submit
})
```

## Pitfalls
- `watch()` at the top of a component subscribes to **all** field changes and re-renders on every keystroke. Use `useWatch` scoped to a child component or pass a specific field name: `watch('fieldName')`.