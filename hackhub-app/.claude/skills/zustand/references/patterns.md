# Zustand Patterns

## When to use
Use these patterns when creating or modifying Zustand stores in `src/store/`, or consuming store state in components and services.

## Patterns

**Define state and actions in one interface**
```typescript
interface HackathonState {
  hackathons: Hackathon[]
  selectedId: string | null
  isLoading: boolean
  fetchHackathons: () => Promise<void>
  selectHackathon: (id: string) => void
}

export const useHackathonStore = create<HackathonState>((set) => ({
  hackathons: [],
  selectedId: null,
  isLoading: false,
  fetchHackathons: async () => { /* ... */ },
  selectHackathon: (id) => set({ selectedId: id }),
}))
```

**Select slices, not the whole store**
```typescript
// Good — re-renders only when selectedId changes
const selectedId = useHackathonStore(state => state.selectedId)

// Good — stable object selector with shallow equality
import { useShallow } from 'zustand/react/shallow'
const { hackathons, isLoading } = useHackathonStore(
  useShallow(state => ({ hackathons: state.hackathons, isLoading: state.isLoading }))
)

// Bad — re-renders on every store mutation
const store = useHackathonStore()
```

**Access store outside React (services, utils)**
```typescript
// In teamService.ts — no hook needed
const user = useAuthStore.getState().user
if (!user) throw new Error('Not authenticated')
```

## Pitfalls

- **Don't store server data in Zustand.** Lists, paginated results, and anything requiring cache invalidation belong in React Query. Zustand owns auth session and hackathon selection context — not team lists or idea feeds.
- **Object selectors without `useShallow` create new references every render**, causing infinite re-render loops. Always wrap multi-field selectors with `useShallow`.