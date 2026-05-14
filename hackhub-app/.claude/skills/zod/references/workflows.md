# Zod Workflows

## When to use
Follow these workflows when adding a new form, service method, or Supabase data boundary in HackHub.

### Adding a new form with validation
1. Define schema in the same file as the form component or in a colocated `*.schema.ts` file
2. Derive the input type with `z.infer`
3. Pass schema to `zodResolver` in `useForm`
4. Use `formState.errors` for field-level error messages from Mantine inputs

```typescript
const ideaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10),
  teamId: z.string().uuid(),
})
type IdeaInput = z.infer<typeof ideaSchema>

const form = useForm<IdeaInput>({ resolver: zodResolver(ideaSchema) })
```

### Validating Supabase data in a service method
1. Define schema near the service function
2. Call `.parse()` on input before the Supabase call
3. Optionally call `.safeParse()` on the response if the shape is not guaranteed

```typescript
async function submitIdea(raw: unknown) {
  const input = ideaSchema.parse(raw)           // throws on bad input
  const { data, error } = await supabase.from('ideas').insert(input).select().single()
  if (error) throw new Error(error.message)
  const result = ideaResponseSchema.safeParse(data) // safe on response
  if (!result.success) throw new Error('Unexpected response shape')
  return result.data
}
```

### Extending shared schemas for role-specific payloads
```typescript
const baseSchema = z.object({ name: z.string().min(1) })
const adminSchema = baseSchema.extend({ orgId: z.string().uuid() })
const updateSchema = baseSchema.partial().required({ id: true })
```

## Pitfalls
- Don't colocate schemas in `src/types/` — keep them with the service or form that owns them to avoid coupling unrelated modules.
- `z.enum` values must exactly match the string literals used elsewhere (e.g. Supabase role columns). A mismatch silently fails `.safeParse()`.