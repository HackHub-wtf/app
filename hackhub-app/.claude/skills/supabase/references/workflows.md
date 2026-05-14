# Supabase Workflows

## When to use
Follow these workflows when adding a migration, changing storage, or wiring up a new real-time feature in HackHub.

## Migration: add or change a schema
```bash
supabase migration new <descriptive_name>
# edit supabase/migrations/<timestamp>_<name>.sql
supabase db reset    # applies all migrations locally from scratch
supabase status      # confirm local stack is running
```
Keep migrations additive where possible. Destructive changes (drop column, rename) require a coordinated deploy.

## Storage: upload and serve a file
Route all storage operations through `src/services/storageService.ts`. Never hardcode bucket names outside that service.
```typescript
const url = await storageService.uploadFile(bucket, path, file)
// To serve privately:
const signed = await storageService.generateSignedUrl(bucket, path, expiresIn)
```

## Real-time: choose the right layer
| Need | Use |
|------|-----|
| Database row changes (insert, update, delete) | `supabase.channel()` with `postgres_changes` |
| Presence, chat, collaborative cursor | Socket.io via `RealtimeContext` |

Don't mix the two — Supabase Realtime is for data sync; Socket.io is for application-level events.

## Pitfalls
- `supabase db reset` drops and recreates the local database — never run against a remote/production URL
- RLS policies must be written in migrations, not applied ad-hoc; UI permission checks in `src/utils/permissions.ts` are for gating only and must mirror the database policy
- Supabase `channel` names must be unique per subscription scope — reusing a name silently replaces the previous subscription