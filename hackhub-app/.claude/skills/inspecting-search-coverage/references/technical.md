# Technical Search Coverage

## When to use
When auditing whether Supabase queries in `src/services/` expose the right columns and operators for search and filtering features.

## Patterns

**Full-text search via Supabase:**
```typescript
// In ideaService.ts or hackathonService.ts
const { data } = await supabase
  .from('ideas')
  .select('id, title, description, tags')
  .textSearch('title', query, { type: 'websearch' })
```

**Case-insensitive partial match:**
```typescript
.ilike('title', `%${query}%`)
// or combined:
.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
```

**Filter coverage audit — grep for exposed columns:**
```bash
grep -r "\.select(" src/services/ideaService.ts src/services/teamService.ts
```
Check whether `name`, `description`, `tags`, and `status` are included in `.select()` calls. Missing columns mean they can't be searched or filtered client-side.

## Pitfalls
- `ilike` is not index-backed by default — add a `pg_trgm` index on frequently searched columns in Supabase migrations or queries will be slow at scale.
- Returning `*` in `.select()` works but sends unused columns over the wire; prefer explicit column lists so you know what's actually queryable.