# Forms

## When to use
Use React Hook Form + Zod for every form with validation. Zod schema doubles as the TypeScript type source, so input shapes stay consistent end-to-end.

## Patterns

**Schema-first form**
```typescript
const teamSchema = z.object({
  name: z.string().min(1, 'Required').max(100),
  hackathonId: z.string().uuid(),
})
type TeamInput = z.infer<typeof teamSchema>

export function CreateTeamForm({ hackathonId }: { hackathonId: string }) {
  const { register, handleSubmit, formState: { errors } } = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
    defaultValues: { hackathonId },
  })

  const mutation = useCreateTeam()

  return (
    <form onSubmit={handleSubmit(data => mutation.mutate(data))}>
      <TextInput label="Team name" {...register('name')} error={errors.name?.message} />
      <Button type="submit" loading={mutation.isPending}>Create</Button>
    </form>
  )
}
```

**Controlled select with Mantine**
```typescript
const { control } = useForm<FormValues>()

<Controller
  name="role"
  control={control}
  render={({ field }) => (
    <Select data={['admin', 'participant']} {...field} />
  )}
/>
```

**Validation at the boundary only**
```typescript
// Validate external input (API response, user form)
const parsed = teamSchema.safeParse(rawApiData)
if (!parsed.success) throw new Error('Unexpected API shape')
// Internal calls between services don't need re-validation
```

## Pitfalls
- Don't manage form field values with `useState` alongside React Hook Form — pick one.
- Don't skip `error` prop wiring on Mantine inputs; silent validation failures confuse users.