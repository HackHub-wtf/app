---
name: building-compare-hubs
description: Creates comparison and alternative pages for discovery — feature tables, side-by-side layouts, and alternative listings using Mantine and React Router in HackHub's React/TypeScript frontend.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Building Compare Hubs Skill

Creates comparison and alternative pages that help users discover and evaluate options — hackathon platforms, team tools, or feature sets — using Mantine's Table, Grid, and Badge primitives with React Router for deep-linkable comparison URLs. Pages follow HackHub's layered architecture: data fetched via TanStack Query, typed with Zod, routed through React Router, and rendered with Mantine components.

## Quick Start

1. Add a route in `src/App.tsx` (e.g. `/compare/:slugA/:slugB` or `/alternatives/:slug`)
2. Create the page component in `src/pages/` (PascalCase, e.g. `CompareHackathons.tsx`)
3. Define a Zod schema for the comparison subject in `src/types/`
4. Fetch both subjects with `useQuery` from TanStack Query
5. Render a `ComparisonTable` or `AlternativeGrid` built from Mantine primitives

## Key Concepts

**URL-driven state** — comparison subjects come from route params (`useParams`) so pages are shareable and indexable. Never store the selected subjects only in component state.

**Feature matrix** — a comparison row is a `{ label, getValue, format? }` descriptor. Map over descriptors to render rows so adding a new dimension is a one-liner, not a new JSX block.

**Neutral framing** — comparison pages show facts, not verdicts. Use `Badge` with `color="gray"` for neutral values, `color="green"` for strengths, `color="red"` for gaps — let users decide.

**Alternatives listing** — an alternatives page fetches all items, filters out the subject, and ranks the rest by a relevance score computed client-side from shared tags or criteria weights.

**Type safety** — define `ComparisonItem` and `FeatureDescriptor<T>` types; pass them through the page, component, and query layer without `any`.

## Common Patterns

**Route setup**
```tsx
// src/App.tsx
<Route path="/compare/:slugA/:slugB" element={<CompareHackathons />} />
<Route path="/alternatives/:slug" element={<HackathonAlternatives />} />
```

**Data fetching**
```tsx
const { slugA, slugB } = useParams<{ slugA: string; slugB: string }>()

const queryA = useQuery({
  queryKey: ['hackathon', slugA],
  queryFn: () => HackathonService.getBySlug(slugA!),
  staleTime: 5 * 60 * 1000,
})
const queryB = useQuery({
  queryKey: ['hackathon', slugB],
  queryFn: () => HackathonService.getBySlug(slugB!),
  staleTime: 5 * 60 * 1000,
})
```

**Feature descriptor pattern**
```tsx
interface FeatureDescriptor<T> {
  label: string
  getValue: (item: T) => string | number | boolean
  format?: (val: ReturnType<FeatureDescriptor<T>['getValue']>) => React.ReactNode
}

const HACKATHON_FEATURES: FeatureDescriptor<Hackathon>[] = [
  { label: 'Max team size', getValue: h => h.maxTeamSize },
  { label: 'Voting criteria', getValue: h => h.votingCriteria.length },
  { label: 'Real-time chat', getValue: h => h.hasChat, format: v => <Badge color={v ? 'green' : 'gray'}>{v ? 'Yes' : 'No'}</Badge> },
]
```

**Comparison table**
```tsx
<Table striped highlightOnHover>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Feature</Table.Th>
      <Table.Th>{itemA.name}</Table.Th>
      <Table.Th>{itemB.name}</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    {HACKATHON_FEATURES.map(({ label, getValue, format }) => (
      <Table.Tr key={label}>
        <Table.Td fw={500}>{label}</Table.Td>
        <Table.Td>{format ? format(getValue(itemA)) : getValue(itemA)}</Table.Td>
        <Table.Td>{format ? format(getValue(itemB)) : getValue(itemB)}</Table.Td>
      </Table.Tr>
    ))}
  </Table.Tbody>
</Table>
```

**Alternatives grid**
```tsx
const alternatives = allHackathons
  .filter(h => h.slug !== slug)
  .sort((a, b) => scoreRelevance(b, subject) - scoreRelevance(a, subject))
  .slice(0, 9)

<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
  {alternatives.map(alt => (
    <AlternativeCard key={alt.id} item={alt} comparedTo={subject} />
  ))}
</SimpleGrid>
```

**Deep-link navigation**
```tsx
<Anchor component={Link} to={`/compare/${slugA}/${slugB}`}>
  Compare with {other.name}
</Anchor>
```