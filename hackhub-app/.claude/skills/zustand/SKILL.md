---
name: zustand
description: Manages application state with Zustand stores and subscriptions in HackHub
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Zustand Skill

Handles global client-side state in HackHub using Zustand 5.x. The two primary stores are `authStore.ts` (user session, profile) and `hackathonStore.ts` (hackathon and team data). Zustand handles UI-owned global state; server state lives in React Query.

## Quick Start

Stores live in `src/store/`. Each store exports a typed `create<State>()` hook consumed directly in components. No providers needed.

```typescript
import { useAuthStore } from '@/store/authStore'

const user = useAuthStore(state => state.user)
const login = useAuthStore(state => state.login)
```

## Key Concepts

**Store shape** — interface defines state fields and action signatures together:
```typescript
interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}
```

**Selective subscriptions** — always select the slice you need, not the whole store, to prevent unnecessary re-renders:
```typescript
// Good: component re-renders only when user changes
const user = useAuthStore(state => state.user)

// Bad: re-renders on every store update
const store = useAuthStore()
```

**Async actions** — set loading state before async work, clear it in both success and error paths:
```typescript
login: async (email, password) => {
  set({ isLoading: true })
  try {
    const { data } = await supabase.auth.signInWithPassword({ email, password })
    set({ user: data.user, isLoading: false })
  } catch (error) {
    set({ isLoading: false })
    throw error
  }
}
```

**Derived state** — compute from store values in the component, never duplicate into state:
```typescript
const teams = useHackathonStore(state => state.teams)
const teamCount = teams.length  // derived, not stored
```

## Common Patterns

**Reading auth state in a component:**
```typescript
const { user, isLoading } = useAuthStore(state => ({
  user: state.user,
  isLoading: state.isLoading
}))
```

**Triggering an action:**
```typescript
const logout = useAuthStore(state => state.logout)
<Button onClick={logout}>Sign out</Button>
```

**Initializing on app load** — call `initialize()` once at the root (e.g. `App.tsx`) to rehydrate session from Supabase:
```typescript
useEffect(() => {
  useAuthStore.getState().initialize()
}, [])
```

**Outside React** — access store state directly without a hook when needed in services:
```typescript
const user = useAuthStore.getState().user
```

**Zustand + React Query boundary** — Zustand owns auth session and hackathon context; React Query owns lists, pagination, and anything that needs cache invalidation. Don't duplicate server data into Zustand stores.