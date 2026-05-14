# TypeScript Patterns

## When to use
When writing or reviewing TypeScript in HackHub — service methods, components, hooks, store actions, or Zod schemas at data boundaries.

## Patterns

**Explicit service method signatures**
```typescript
static async getTeams(hackathonId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('hackathon_id', hackathonId)
  if (error) throw new Error(error.message)
  return data
}
```

**Zod schema at form/API boundary**
```typescript
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  hackathonId: z.string().uuid(),
})
type CreateTeamInput = z.infer<typeof createTeamSchema>

// In component
const validated = createTeamSchema.parse(formValues)
await TeamService.createTeam(validated)
```

**Generic constraint for shared utilities**
```typescript
function getById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id)
}
```

## Pitfalls
- Never use `as SomeType` casting — narrow with type guards instead. Casting silences the compiler while hiding runtime bugs.
- Derived values like `teams.length` should never be stored in `useState`. Derive them inline.