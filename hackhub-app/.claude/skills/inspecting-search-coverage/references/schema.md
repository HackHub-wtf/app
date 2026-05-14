# Schema Search Coverage

## When to use
When reviewing the Supabase database schema (in `supabase/` or `migrations/`) to confirm that columns used in search queries are indexed and that full-text search vectors are configured where needed.

## Patterns

**Check which columns are queried in service files:**
```bash
grep -r "ilike\|textSearch\|\.contains\|\.eq\|\.filter" src/services/
```
Cross-reference the column names found here against the migration files to confirm indexes exist.

**Add a trigram index for `ilike` searches:**
```sql
-- In a Supabase migration
create extension if not exists pg_trgm;
create index ideas_title_trgm on ideas using gin (title gin_trgm_ops);
create index ideas_description_trgm on ideas using gin (description gin_trgm_ops);
```

**Full-text search vector column (Postgres `tsvector`):**
```sql
alter table ideas add column fts tsvector
  generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored;
create index ideas_fts on ideas using gin (fts);
```
Then query with `.textSearch('fts', query)` in `ideaService.ts`.

## Pitfalls
- Supabase RLS policies apply to search queries too. A full-text search returning zero results may be a permissions issue, not a missing index — test with the service role key to isolate.