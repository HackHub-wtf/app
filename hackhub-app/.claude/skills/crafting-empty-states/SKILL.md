---
name: crafting-empty-states
description: Creates empty states and onboarding affordances for HackHub using Mantine, Tabler Icons, and React Router. Use when a list, table, or page section needs a helpful zero-data experience.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Crafting Empty States Skill

Builds empty state components and onboarding affordances for HackHub's React 19 + Mantine 8 frontend. Covers first-visit zero-data screens (no hackathons, no teams, no ideas), filtered zero-result states, and role-aware call-to-action prompts that guide users toward their next meaningful action.

## Quick Start

1. Identify the data source — which React Query `useQuery` result is empty.
2. Determine the user's role via `useAuthStore` to show the right CTA (managers create, participants join).
3. Pick an icon from `@tabler/icons-react` that represents the missing entity.
4. Render a Mantine `Stack` with the icon, a headline, a one-sentence explanation, and a `Button` or `Anchor` pointing to the creation/discovery flow via React Router.
5. Place the component inline — no separate route needed.

## Key Concepts

**Role-aware CTAs** — managers see "Create hackathon", participants see "Browse hackathons". Pull role from `useAuthStore` and branch the action accordingly.

**Query-state integration** — only render the empty state when `data` is an empty array and `isLoading` is false. Never show it during loading; use Mantine `Skeleton` or `Loader` instead.

**Contextual copy** — headline names the missing entity ("No teams yet"), subtext explains why and what to do ("Join an open team or ask your manager to create one."). Keep both under 12 words each.

**Onboarding vs. filtered empty** — distinguish between a genuinely empty dataset (first-run) and a search/filter that returned nothing. Show different copy and different actions for each case.

## Common Patterns

### Basic entity empty state

```tsx
import { Stack, Text, Button } from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface EmptyTeamsProps {
  hackathonId: string
}

export function EmptyTeams({ hackathonId }: EmptyTeamsProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isManager = user?.role === 'manager' || user?.role === 'admin'

  return (
    <Stack align="center" gap="md" py="xl">
      <IconUsers size={48} stroke={1.2} color="var(--mantine-color-dimmed)" />
      <Text fw={600} size="lg">No teams yet</Text>
      <Text c="dimmed" size="sm" ta="center" maw={360}>
        {isManager
          ? 'Create the first team for this hackathon to get participants collaborating.'
          : 'No teams have been created yet. Check back soon or ask your manager.'}
      </Text>
      {isManager && (
        <Button onClick={() => navigate(`/hackathons/${hackathonId}/teams/new`)}>
          Create team
        </Button>
      )}
    </Stack>
  )
}
```

### Filtered / search zero-results

```tsx
import { Stack, Text, Button } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

interface EmptySearchProps {
  query: string
  onClear: () => void
}

export function EmptySearch({ query, onClear }: EmptySearchProps) {
  return (
    <Stack align="center" gap="sm" py="xl">
      <IconSearch size={40} stroke={1.2} color="var(--mantine-color-dimmed)" />
      <Text fw={600}>No results for "{query}"</Text>
      <Text c="dimmed" size="sm">Try a different keyword or clear the filter.</Text>
      <Button variant="subtle" onClick={onClear}>Clear search</Button>
    </Stack>
  )
}
```

### Inline usage with React Query

```tsx
const { data: teams = [], isLoading } = useQuery({
  queryKey: ['teams', hackathonId],
  queryFn: () => TeamService.getTeams(hackathonId),
})

if (isLoading) return <Loader />
if (teams.length === 0) return <EmptyTeams hackathonId={hackathonId} />
return teams.map(team => <TeamCard key={team.id} team={team} />)
```

### First-run onboarding banner (manager)

```tsx
import { Alert, Group, Button, Text } from '@mantine/core'
import { IconRocket } from '@tabler/icons-react'

export function OnboardingBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Alert icon={<IconRocket size={20} />} title="Welcome to HackHub" withCloseButton onClose={onDismiss}>
      <Group justify="space-between" align="center">
        <Text size="sm">Start by creating your first hackathon, then invite participants.</Text>
        <Button size="xs" component="a" href="/hackathons/new">Create hackathon</Button>
      </Group>
    </Alert>
  )
}
```