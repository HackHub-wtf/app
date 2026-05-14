# Activation & Onboarding Experiments

## When to use
Gate new onboarding flows, welcome modals, or first-run checklists behind a rollout flag before enabling for all users.

## Patterns

**First-login detection via Supabase metadata**
```typescript
const isNewUser = useAuthStore(s => !s.profile?.onboarding_completed)
const showOnboarding = useExperiment('onboarding_v2', 50) && isNewUser
```

**Mark onboarding complete after key action**
```typescript
async function completeOnboarding(userId: string) {
  await supabase
    .from('profiles')
    .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId)
}
```

**Show experiment-aware checklist**
```typescript
function OnboardingChecklist() {
  const showVideoStep = useExperiment('onboarding_video_step', 30)
  return (
    <Stack>
      <ChecklistItem label="Create your first team" />
      <ChecklistItem label="Submit an idea" />
      {showVideoStep && <ChecklistItem label="Watch intro video" />}
    </Stack>
  )
}
```

## Pitfalls
- Do not re-show onboarding on every login. Gate on `onboarding_completed` from the profile, not just the experiment flag.
- Clear the experiment flag from `authStore` after the user completes onboarding to avoid stale state.