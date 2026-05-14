---
name: accelerating-first-run
description: Improves onboarding sequence and time-to-value for new HackHub users by reducing friction in registration, first-action flows, and activation milestones
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Accelerating First Run Skill

Reduces time-to-value for new users by auditing and improving the first-run experience across registration, onboarding, and the first meaningful action (joining or creating a team, submitting an idea). Works within HackHub's React 19 + Mantine 8 + Supabase + Zustand stack to identify friction points, add progress indicators, and ensure new users reach activation without getting stuck.

## Quick Start

1. Audit the current first-run path: `src/pages/Login.tsx` → post-auth redirect → first meaningful page
2. Check `src/store/authStore.ts` for `initialize()` — confirm profile completeness is tracked
3. Look for empty states in `src/pages/Hackathons.tsx`, `src/pages/Teams.tsx`, `src/pages/Ideas.tsx`
4. Identify where new users land after signup and what action they are prompted to take
5. Add or improve onboarding affordances using Mantine `Stepper`, `Progress`, `Tooltip`, or `Alert`

## Key Concepts

**Activation milestone** — the first action that signals a user has understood the product (e.g., joining a team or submitting an idea). Everything before this is onboarding friction.

**First-run state detection** — use Zustand `authStore` user profile fields or a `onboarding_completed` flag in Supabase to distinguish new vs. returning users.

**Persistent progress** — store onboarding step completion in Supabase (user profile or a dedicated `onboarding` table) so progress survives page refresh. Surface it via a Zustand slice.

**Empty states as CTAs** — zero-data pages (no hackathons, no teams) are the highest-leverage onboarding touchpoints. Replace blank lists with actionable empty states that drive the next step.

**Skeleton loading** — use Mantine `Skeleton` during TanStack Query fetches on first load so the UI never looks broken before data arrives.

## Common Patterns

**Detect new user and redirect to onboarding**
```typescript
// In authStore.ts initialize()
const isNewUser = !profile.onboarding_completed
if (isNewUser) navigate('/onboarding')
```

**Step-based onboarding with Mantine Stepper**
```typescript
import { Stepper } from '@mantine/core'

const steps = ['Complete profile', 'Join a hackathon', 'Create or join a team', 'Submit your first idea']

<Stepper active={currentStep} onStepClick={setCurrentStep}>
  {steps.map((label, i) => (
    <Stepper.Step key={i} label={label} />
  ))}
</Stepper>
```

**Persist step completion via Supabase**
```typescript
await supabase
  .from('profiles')
  .update({ onboarding_step: nextStep, onboarding_completed: nextStep >= steps.length })
  .eq('id', user.id)
```

**Actionable empty state**
```typescript
import { IconUsers } from '@tabler/icons-react'
import { Center, Stack, Text, Button } from '@mantine/core'

function NoTeamsEmptyState({ hackathonId }: { hackathonId: string }) {
  return (
    <Center h={300}>
      <Stack align="center" gap="sm">
        <IconUsers size={48} stroke={1.2} />
        <Text c="dimmed">No teams yet — be the first to start one.</Text>
        <Button onClick={() => openCreateTeamModal(hackathonId)}>Create a team</Button>
      </Stack>
    </Center>
  )
}
```

**Contextual tooltip nudge on first visit**
```typescript
import { Tooltip } from '@mantine/core'

<Tooltip label="Click here to join your first hackathon" opened={isNewUser && !hasJoined}>
  <Button>Browse hackathons</Button>
</Tooltip>
```

**Guard against stale onboarding state**

Always re-fetch the user profile via TanStack Query before rendering onboarding UI — do not rely solely on Zustand cache, which may be stale across sessions.

```typescript
const { data: profile } = useQuery({
  queryKey: ['profile', user.id],
  queryFn: () => profileService.getProfile(user.id),
  staleTime: 0
})
```