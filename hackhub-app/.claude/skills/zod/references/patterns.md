# Zod Patterns

## When to use
Apply these patterns when validating data at service boundaries, integrating with React Hook Form, or narrowing types from Supabase responses.

### Service boundary validation
```typescript
const teamSchema = z.object({
  name: z.string().min(1).max(100),
  hackathonId: z.string().uuid(),
})
type TeamInput = z.infer<typeof teamSchema>

async function createTeam(raw: unknown): Promise<Team> {
  const input = teamSchema.parse(raw)
  const { data, error } = await supabase.from('teams').insert(input).select().single()
  if (error) throw new Error(error.message)
  return data
}
```

### React Hook Form integration
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
type LoginInput = z.infer<typeof loginSchema>

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })
}
```

### Safe parsing for Supabase responses
```typescript
const result = userSchema.safeParse(supabaseResponse)
if (!result.success) {
  console.error(result.error.flatten())
  return null
}
return result.data
```

## Pitfalls
- Never use `.parse()` at component render level — it throws and will crash the component. Use `.safeParse()` instead.
- Don't duplicate TypeScript types by hand when you have a schema; always use `z.infer<typeof schema>`.
- Avoid redefining update schemas from scratch — use `.partial().required({ id: true })` on the base schema.