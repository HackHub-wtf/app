---
name: embedding-decision-cues
description: Applies behavioral cues that improve conversion decisions in HackHub's React/TypeScript frontend using Mantine, Zustand, and Supabase
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Embedding Decision Cues Skill

Applies behavioral and psychological cues — urgency signals, social proof, progress indicators, and friction reducers — to improve conversion at key decision points in HackHub: hackathon registration, team formation, idea submission, and voting. Works within the existing Mantine 8.x component system and Zustand/TanStack Query state layer.

## Quick Start

1. Identify the conversion point: registration, join-team CTA, idea submit, vote cast
2. Read the relevant page component (`src/pages/`) and its service layer
3. Choose the cue type that fits the context (see Key Concepts)
4. Apply using Mantine primitives — `Badge`, `Progress`, `Text`, `Tooltip`, `Alert`
5. Persist seen/dismissed state in Zustand if the cue is one-time or session-scoped

## Key Concepts

**Urgency signals** — deadline countdowns, spot scarcity ("2 of 5 team slots left"). Pull hackathon deadline from `hackathonStore.ts` and render inline near CTAs.

**Social proof** — participant counts, team activity recency, idea vote tallies. Data already flows through `IdeaService.getIdeas()` and `TeamService.getTeams()`; surface aggregate counts near decision points.

**Progress momentum** — show a user how far along they are in a multi-step flow (profile completion, hackathon checklist). Use Mantine `Progress` or `Stepper` tied to profile/hackathon state from `authStore.ts`.

**Friction reducers** — pre-fill forms with known data (user name, email from `authStore.user`), inline validation feedback via React Hook Form + Zod, and optimistic UI via TanStack Query `onMutate` so the action feels instant.

**Loss aversion framing** — surface what a user misses by not acting: "Your team hasn't submitted an idea yet — submissions close in 4 h." Read team membership from `hackathonStore` and deadline from the hackathon record.

## Common Patterns

**Deadline badge near a CTA**
```tsx
import { Badge, Group, Button } from '@mantine/core'
import { IconClock } from '@tabler/icons-react'

function SubmitIdeaButton({ deadline }: { deadline: string }) {
  const hoursLeft = Math.max(0, differenceInHours(new Date(deadline), new Date()))
  const urgent = hoursLeft < 24

  return (
    <Group gap="xs">
      {urgent && (
        <Badge color="red" leftSection={<IconClock size={12} />}>
          {hoursLeft}h left
        </Badge>
      )}
      <Button onClick={handleSubmit}>Submit idea</Button>
    </Group>
  )
}
```

**Slot scarcity from live data**
```tsx
function JoinTeamCard({ team }: { team: Team }) {
  const spotsLeft = MAX_TEAM_SIZE - team.member_count
  return (
    <Text size="sm" c={spotsLeft <= 1 ? 'red' : 'dimmed'}>
      {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining
    </Text>
  )
}
```

**Profile completion nudge (Zustand + Progress)**
```tsx
function ProfileCompletionBanner() {
  const user = useAuthStore(s => s.user)
  const fields = ['display_name', 'bio', 'avatar_url'] as const
  const filled = fields.filter(f => Boolean(user?.[f])).length
  const pct = Math.round((filled / fields.length) * 100)

  if (pct === 100) return null
  return (
    <Alert title="Complete your profile" color="blue">
      <Progress value={pct} mb="xs" />
      <Text size="sm">{pct}% done — teams are more likely to invite complete profiles.</Text>
    </Alert>
  )
}
```

**Optimistic vote to remove hesitation**
```tsx
const voteMutation = useMutation({
  mutationFn: (ideaId: string) => IdeaService.voteOnIdea(ideaId),
  onMutate: async (ideaId) => {
    await queryClient.cancelQueries({ queryKey: ['ideas'] })
    queryClient.setQueryData(['ideas'], (old: Idea[]) =>
      old.map(i => i.id === ideaId ? { ...i, vote_count: i.vote_count + 1 } : i)
    )
  },
  onError: () => queryClient.invalidateQueries({ queryKey: ['ideas'] }),
})
```

**Pre-fill form fields from auth state**
```tsx
const { user } = useAuthStore()
const { register, reset } = useForm<IdeaFormData>({
  defaultValues: { submitter_name: user?.display_name ?? '' },
})
```
```

Approve the write above and it'll land at `.claude/skills/embedding-decision-cues.md`, making it available as `/embedding-decision-cues` in future sessions.