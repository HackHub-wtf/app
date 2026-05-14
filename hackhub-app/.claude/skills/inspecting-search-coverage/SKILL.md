---
name: inspecting-search-coverage
description: Audits technical and on-page search coverage for HackHub's React/TypeScript/Supabase frontend — checks meta tags, indexability, route discoverability, and content searchability across pages and components.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Inspecting Search Coverage Skill

Audits HackHub's search coverage across two dimensions: **technical search** (how well Supabase queries, filters, and full-text search cover the data model) and **on-page search** (how well the UI surfaces searchable content to users and crawlers). Covers route-level metadata, page titles, indexable content in Mantine components, and Supabase query patterns that back search features.

## Quick Start

1. Grep for existing search patterns across pages and services
2. Check each routed page in `src/pages/` for title tags, meta descriptions, and heading structure
3. Audit Supabase queries in `src/services/` for `ilike`, `textSearch`, or filter coverage gaps
4. Verify that dynamic content (hackathons, teams, ideas) is reachable from static entry points
5. Report gaps as: missing metadata, uncovered data fields, or dead-end routes

## Key Concepts

**Technical search coverage** — whether Supabase queries in service files expose the right columns for filtering and full-text search. Look for `ilike`, `textSearch`, `.filter()`, and `.eq()` in `src/services/`.

**On-page search coverage** — whether pages render enough text for users and crawlers. Check `<title>`, `<meta name="description">`, and `<h1>`/`<h2>` usage in page components under `src/pages/`.

**Route discoverability** — whether all meaningful routes in `src/App.tsx` are linked from navigable surfaces, not just deep-linked by URL.

**Content indexability** — whether dynamically rendered Mantine components (Cards, Accordions, Modals) expose their text content in the DOM rather than hiding it behind interaction gates.

## Common Patterns

**Find all Supabase search/filter calls:**
```bash
grep -r "ilike\|textSearch\|\.filter\|\.eq\|\.contains" src/services/
```

**Check for page-level title and meta tags:**
```bash
grep -r "document\.title\|<title\|<meta" src/pages/
```

**Audit routes without linked navigation:**
```bash
grep -r "path=" src/App.tsx
grep -r "to=" src/components/Layout/
```

**Find Mantine components that may hide content:**
```bash
grep -r "Accordion\|Modal\|Drawer\|Collapse" src/components/ src/pages/
```

**Check idea/hackathon fields exposed to search:**
```bash
grep -r "\.select(" src/services/ideaService.ts src/services/teamService.ts
```

When gaps are found, the fix is usually one of: adding `.select()` columns to a Supabase query, rendering a visible `<h1>` on a page that currently has none, or adding a `<Link>` in the sidebar/header to a route that exists but isn't navigable.