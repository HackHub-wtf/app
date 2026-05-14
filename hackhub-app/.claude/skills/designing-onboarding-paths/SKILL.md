---
name: designing-onboarding-paths
description: Designs onboarding paths, checklists, and first-run UI for HackHub using React 19, Mantine 8, Zustand, and Supabase
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Designing Onboarding Paths Skill

Guides the design and implementation of onboarding flows, first-run experiences, and setup checklists in HackHub. Covers role-aware onboarding (manager vs participant), step tracking via Zustand, Mantine Stepper/Modal components, and persisting completion state to Supabase user profiles.

## Quick Start

1. Identify the user role from `authStore` — managers and participants follow different paths
2. Track onboarding state in a Zustand store slice or in the user's profile via `profileService`
3. Gate onboarding display on a `hasCompletedOnboarding` flag read from Supabase on `initialize()`
4. Render the onboarding UI using Mantine `Stepper`, `Modal`, or `Drawer` components
5. On final step completion, write the flag back to Supabase and update local store state

## Key Concepts

**Role-aware paths** — check `user.role` from `authStore.ts` before rendering steps; managers see hackathon-creation steps, participants see team-join steps.

**Persistent progress** — store `onboarding_completed` and `onboarding_step` in the Supabase `profiles` table so refreshes don't reset progress. Read in `AuthStore.initialize()`.

**Step gating** — each step should validate its own precondition (e.g. profile filled, team joined) rather than trusting linear completion order, since users can navigate away mid-flow.

**First-run detection** — compare `created_at` vs `updated_at` on the profile row, or use an explicit `is_first_login` boolean set to `false` after onboarding completes.

**Checklist vs wizard** — use a Mantine `Stepper` for linear mandatory flows (e.g. email verify → profile → join team) and a persistent `Progress`+`List` checklist for optional enrichment tasks shown post-login.

## Common Patterns

**Onboarding store slice**
```typescript
interface OnboardingState {
  currentStep: number
  isComplete: boolean
  advance: () => void
  complete: () => Promise<void>
}
```
Add this slice to `hackathonStore.ts` or a dedicated `onboardingStore.ts` under `src/store/`.

**Conditional onboarding wrapper in App.tsx**
```typescript
const { user } = useAuthStore()
const { isComplete } = useOnboardingStore()

if (user && !isComplete) {
  return <OnboardingFlow />
}
```

**Mantine Stepper for linear wizard**
```typescript
import { Stepper } from '@mantine/core'

<Stepper active={currentStep} onStepClick={setCurrentStep}>
  <Stepper.Step label="Profile" description="Set your display name">
    <ProfileStep onNext={advance} />
  </Stepper.Step>
  <Stepper.Step label="Join a team" description="Find or create a team">
    <TeamStep onNext={advance} />
  </Stepper.Step>
  <Stepper.Completed>
    <CompletionScreen onDone={complete} />
  </Stepper.Completed>
</Stepper>
```

**Persisting completion to Supabase**
```typescript
async function complete() {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)
  if (!error) set({ isComplete: true })
}
```

**Checklist pattern for optional tasks**
```typescript
const CHECKLIST_ITEMS = [
  { id: 'avatar', label: 'Upload a profile photo', check: (u) => !!u.avatar_url },
  { id: 'team',   label: 'Join or create a team',  check: (u) => u.team_count > 0 },
  { id: 'idea',   label: 'Submit your first idea',  check: (u) => u.idea_count > 0 },
]
```
Derive completion from live data rather than storing per-item flags, so the checklist self-heals if the user completes items outside the onboarding UI.

**Tabler icon pairing for steps**
```typescript
import { IconUser, IconUsers, IconBulb, IconCheck } from '@tabler/icons-react'
```
Use consistent icons across stepper, checklist, and notification copy to reinforce the same mental model.