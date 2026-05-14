# TypeScript Types

## When to use
When defining types for Supabase rows, store state, service inputs/outputs, component props, or shared domain objects.

## Patterns

**Alias Supabase-generated row types**
```typescript
import type { Database } from '@/lib/supabase'

type Team   = Database['public']['Tables']['teams']['Row']
type Member = Database['public']['Tables']['team_members']['Row']
```
Never redefine row shapes manually — they drift from the real schema.

**Zustand store interface**
```typescript
interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
```

**Boolean variable naming**
```typescript
const isLoading: boolean = false
const hasPermission: boolean = canManageTeam(user, team)
const canEditIdea: boolean = user.role === 'admin' || idea.authorId === user.id
```
Always prefix booleans with `is`, `has`, `should`, or `can`.

## Pitfalls
- Do not use `any` as an escape hatch — use `unknown` and narrow. `any` disables all downstream type checking.
- Use `import type { Foo }` for type-only imports to satisfy `verbatimModuleSyntax` and avoid runtime overhead.