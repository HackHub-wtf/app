# Zustand Workflows

## When to use
Follow these workflows when bootstrapping auth on app load, adding a new store action, or wiring store state into a page component.

## Workflows

**Bootstrap auth session on app load**

Call `initialize()` once in `App.tsx` to rehydrate the Supabase session into the store. Components that need `user` will reactively update when it resolves.
```typescript
// App.tsx
useEffect(() => {
  useAuthStore.getState().initialize()
}, [])
```

**Add a new async action to an existing store**

1. Add the action signature to the store interface.
2. Implement with `set({ isLoading: true })` before the await and `set({ isLoading: false })` in both success and catch paths.
3. Consume in a component via `useAuthStore(state => state.newAction)`.

```typescript
updateProfile: async (updates) => {
  set({ isLoading: true })
  try {
    const { data } = await supabase.from('profiles').update(updates).select().single()
    set({ user: data, isLoading: false })
  } catch (error) {
    set({ isLoading: false })
    throw error
  }
}
```

**Wire store state into a page component**

Select only what the component needs. Derive anything computable rather than adding new state fields.
```typescript
function HackathonPage() {
  const hackathons = useHackathonStore(state => state.hackathons)
  const fetchHackathons = useHackathonStore(state => state.fetchHackathons)
  const activeCount = hackathons.filter(h => h.status === 'active').length // derived

  useEffect(() => { fetchHackathons() }, [fetchHackathons])
  // ...
}
```

## Pitfalls

- **Don't call `initialize()` more than once.** It sets up a Supabase `onAuthStateChange` listener; calling it in multiple components creates duplicate listeners and double-fires auth events.
- **Don't mix Zustand and `useState` for the same concern.** If a value is in the store, read it from the store — local state shadow copies go stale silently.