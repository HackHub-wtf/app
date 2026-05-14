# Competitive & Coverage Benchmarking

## When to use
When comparing HackHub's search surface against what users expect from similar platforms (GitHub, Devpost, Luma) — identifying gaps in filterable fields, missing sort options, or content that competitors surface but HackHub buries.

## Patterns

**Minimum expected search surface for a hackathon platform:**
| Entity | Expected searchable fields | HackHub status to verify |
|--------|--------------------------|--------------------------|
| Hackathons | name, description, status, date range | Check `hackathonService.ts` |
| Teams | name, members, tech stack | Check `teamService.ts` |
| Ideas | title, description, tags, author | Check `ideaService.ts` |
| Users | display name, organization | Check `profileService.ts` |

**Audit missing filter dimensions:**
```bash
grep -r "\.select(" src/services/ | grep -v "id, "
```
If a service selects only `id` and `name`, sorting by date or filtering by status is impossible without a refetch.

**Check sort/order coverage:**
```bash
grep -r "\.order(\|\.range(\|\.limit(" src/services/
```
Missing `.order()` calls mean lists always return in insertion order — a common gap versus competitor platforms that surface "most recent" or "most voted" by default.

## Pitfalls
- Copying a competitor's filter set without checking whether the data exists in HackHub's schema leads to UI controls that silently return empty results. Verify the column exists in migrations before exposing a filter in the UI.