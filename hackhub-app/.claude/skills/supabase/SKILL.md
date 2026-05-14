---
name: supabase
description: Handles Supabase authentication, database queries, RLS policies, and real-time subscriptions for HackHub
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Supabase Skill

Provides patterns and guidance for working with Supabase in HackHub — covering auth session management, typed PostgreSQL queries, Row-Level Security, storage operations, and real-time subscriptions. The Supabase client is initialized in `src/lib/supabase.ts` and consumed across stores, services, and hooks.

## Quick Start

```bash
# Local Supabase stack
supabase start          # starts Postgres, Auth, Storage, Realtime
supabase status         # shows local URLs and keys
supabase db reset       # re-run all migrations from scratch
supabase migration new  # scaffold a new migration file
```

Environment variables required in `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Key Concepts

**Client** — singleton from `src/lib/supabase.ts`; import it directly in services, never re-initialize.

**Auth** — managed by `src/store/authStore.ts`. Session is persisted by the Supabase client automatically. Always use `supabase.auth.getUser()` to get the verified server-side user; `getSession()` is client-only and unverified.

**RLS** — all tables have Row-Level Security enabled. Never bypass with service-role key in frontend code. Let RLS enforce permissions at the database level; mirror checks in `src/utils/permissions.ts` only for UI gating.

**Typed queries** — use the generated `Database` type from `src/lib/supabase.ts` for `.from()` calls so column names and return types are inferred.

**Storage** — operations go through `src/services/storageService.ts` (`uploadFile`, `deleteFile`, `generateSignedUrl`). Buckets are defined in Supabase; never hardcode bucket names outside that service.

**Real-time** — database-level changes use `supabase.channel()` subscriptions. Socket.io (via `RealtimeContext`) handles application-level collaboration events. Use Supabase Realtime for data sync, Socket.io for presence and chat.

## Common Patterns

**Auth sign-in**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
if (error) throw new Error(error.message)
```

**Typed table query**
```typescript
const { data, error } = await supabase
  .from('teams')
  .select('id, name, hackathon_id')
  .eq('hackathon_id', hackathonId)
  .returns<Team[]>()
if (error) throw new Error(error.message)
return data
```

**Insert and return row**
```typescript
const { data, error } = await supabase
  .from('ideas')
  .insert({ title, description, team_id: teamId })
  .select()
  .single()
if (error) throw new Error(error.message)
return data
```

**Real-time subscription (database)**
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`teams:${hackathonId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'teams', filter: `hackathon_id=eq.${hackathonId}` },
      (payload) => handleTeamChange(payload)
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [hackathonId])
```

**File upload via StorageService**
```typescript
const url = await storageService.uploadFile(bucket, path, file)
```

**Migration workflow**
```bash
supabase migration new add_voting_criteria
# edit supabase/migrations/<timestamp>_add_voting_criteria.sql
supabase db reset   # apply locally
```