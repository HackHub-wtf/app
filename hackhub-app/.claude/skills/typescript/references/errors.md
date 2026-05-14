# Common TypeScript Errors

## When to use
When diagnosing type errors from `npm run build` or `npm run lint` in HackHub.

## Patterns

**`Type 'X | null' is not assignable to type 'X'`**
```typescript
// error: user might be null
const name = user.profile.name

// fix: guard first
if (!user) return null
const name = user.profile.name
```

**`Argument of type 'unknown' is not assignable`**
```typescript
// error: catch clause binding is unknown
catch (e) {
  throw e.message  // e is unknown
}

// fix: narrow before use
catch (e) {
  const msg = e instanceof Error ? e.message : String(e)
  throw new Error(msg)
}
```

**`Object is possibly 'undefined'` on React Query data**
```typescript
// error: data can be undefined before query resolves
return teams.map(t => <TeamCard key={t.id} team={t} />)

// fix: guard loading/error states
if (isLoading) return <Loader />
if (!teams) return null
return teams.map(t => <TeamCard key={t.id} team={t} />)
```

## Pitfalls
- `npm run build` runs `tsc -b` before Vite — type errors fail the build even if the dev server runs fine. Always build before merging.
- ESLint with `typescript-eslint` catches additional issues (no-explicit-any, no-floating-promises) that `tsc` alone does not report. Run both.