---
name: typescript
description: Enforces TypeScript type safety and strict mode compilation across the HackHub React frontend
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# TypeScript Skill

Enforces TypeScript 5.8 strict mode across the HackHub codebase — explicit types, no `any`, Zod-validated boundaries, and proper inference from Supabase-generated types. Run `npm run build` to type-check; ESLint with `typescript-eslint` catches additional violations at lint time.

## Quick Start

```bash
npm run build   # tsc -b + vite build (fails on type errors)
npm run lint    # eslint with typescript-eslint rules
```

## Key Concepts

**Strict mode is on.** Every function parameter and return value must be typed. No implicit `any`.

**`unknown` over `any`.** When a type truly isn't known at compile time, use `unknown` and narrow it. Never use `any` as an escape hatch.

**Zod at system boundaries.** External data (Supabase responses, form inputs, API payloads) must be validated with a Zod schema before use. Derive the TypeScript type from the schema with `z.infer<>`.

**Type imports.** Use `import type { Foo }` for types-only imports to avoid runtime overhead and satisfy `verbatimModuleSyntax`.

**Supabase-generated types.** Database row types come from `src/lib/supabase.ts`. Alias them rather than redefining — `type Team = Database['public']['Tables']['teams']['Row']`.

## Common Patterns

**Explicit function signatures**
```typescript
async function fetchTeams(hackathonId: string): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*').eq('hackathon_id', hackathonId)
  if (error) throw new Error(error.message)
  return data
}
```

**Zod schema + inferred type**
```typescript
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  hackathonId: z.string().uuid(),
})
type CreateTeamInput = z.infer<typeof createTeamSchema>
```

**Type narrowing instead of casting**
```typescript
// bad
const user = response as User

// good
if (isUser(response)) {
  // response is User here
}
```

**Generic constraints**
```typescript
function getById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id)
}
```

**Boolean variable prefixes** — always `is`, `has`, `should`, or `can`:
```typescript
const isLoading: boolean = false
const hasPermission: boolean = canManageTeam(user, team)
```

**No derived state in `useState`** — derive from existing state directly:
```typescript
// bad
const [teamCount, setTeamCount] = useState(0)

// good
const teamCount = teams.length
```