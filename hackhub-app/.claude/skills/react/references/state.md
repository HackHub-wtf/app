# State Management

## When to use
- **Zustand** (`src/store/`) — global client state that survives navigation: auth session, active hackathon context.
- **TanStack Query** — anything fetched from Supabase.
- **`useState`** — local UI state (modal open, form step, toggle).

## Patterns

**Zustand store slice**
```typescript
// src/store/authStore.ts
interface AuthState {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: async (email, password) => {
    const { data } = await supabase.auth.signInWithPassword({ email, password })
    set({ user: data.user })
  },
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
```

**Selecting a slice to avoid unnecessary re-renders**
```typescript
const user = useAuthStore(state => state.user)       // re-renders only when user changes
const login = useAuthStore(state => state.login)     // stable reference, no re-render
```

**Deriving state instead of storing it**
```typescript
const teams = useTeams(hackathonId).data ?? []
const myTeams = teams.filter(t => t.members.includes(userId))  // derive, don't store
```

## Pitfalls
- Don't copy TanStack Query data into Zustand — mutations become hard to keep in sync.
- Don't call `useAuthStore()` without a selector; subscribing to the whole store causes over-rendering.