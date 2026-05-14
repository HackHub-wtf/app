# Supabase Patterns

## When to use
Apply these patterns when writing or reviewing any code that touches Supabase: auth, database queries, storage, or real-time subscriptions.

## Auth: get the verified user
Always use `getUser()` for server-verified identity. `getSession()` is client-only and unverified.
```typescript
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) throw new Error('Unauthenticated')
```

## Typed query with error handling
Use the generated `Database` type from `src/lib/supabase.ts`. Always check `error` before using `data`.
```typescript
const { data, error } = await supabase
  .from('teams')
  .select('id, name, hackathon_id')
  .eq('hackathon_id', hackathonId)
  .returns<Team[]>()
if (error) throw new Error(error.message)
return data
```

## Real-time channel subscription
Clean up channels on unmount to avoid duplicate listeners and memory leaks.
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`teams:${hackathonId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'teams',
      filter: `hackathon_id=eq.${hackathonId}`
    }, handleTeamChange)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [hackathonId])
```

## Pitfalls
- Never re-initialize the Supabase client — import the singleton from `src/lib/supabase.ts`
- Never use the service-role key in frontend code — RLS must enforce access at the database level
- Don't use `getSession()` to gate UI logic that matters for security — it's unverified