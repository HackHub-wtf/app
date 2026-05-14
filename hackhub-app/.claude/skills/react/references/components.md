# Components

## When to use
Create a component when UI logic is reused across pages, or when a page section is complex enough to warrant its own file. Page-level components live in `src/pages/`; reusable ones in `src/components/`.

## Patterns

**Named export matching file name**
```typescript
// src/components/TeamCard.tsx
export function TeamCard({ team }: { team: Team }) {
  return (
    <Card>
      <Text fw={600}>{team.name}</Text>
    </Card>
  )
}
```

**Guard loading and error before rendering data**
```typescript
export function TeamList({ hackathonId }: { hackathonId: string }) {
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams', hackathonId],
    queryFn: () => TeamService.getTeams(hackathonId),
  })

  if (isLoading) return <Loader />
  if (error) return <Text c="red">Failed to load teams</Text>
  return <>{teams.map(t => <TeamCard key={t.id} team={t} />)}</>
}
```

**Prop interface colocated with component**
```typescript
interface VotingCriteriaBadgeProps {
  label: string
  weight: number
  editable?: boolean
}

export function VotingCriteriaBadge({ label, weight, editable = false }: VotingCriteriaBadgeProps) {
  // ...
}
```

## Pitfalls
- Don't call raw Supabase queries inside components — go through a service.
- Avoid `default export` for components; named exports are easier to refactor and grep.