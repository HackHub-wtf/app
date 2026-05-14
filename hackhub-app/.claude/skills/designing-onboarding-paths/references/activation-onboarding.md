# Activation Onboarding

## When to use
When a new user logs in for the first time and needs to complete mandatory setup steps before accessing core features. Use for both manager (hackathon creation) and participant (team join) activation paths.

## Patterns

**First-login gate in App.tsx**
```typescript
const { user } = useAuthStore()
const { isComplete } = useOnboardingStore()

if (user && !isComplete) return <OnboardingFlow role={user.role} />
```

**Role-split step config**
```typescript
const MANAGER_STEPS = ['profile', 'create-hackathon', 'invite-participants']
const PARTICIPANT_STEPS = ['profile', 'join-team', 'submit-idea']

const steps = user.role === 'manager' ? MANAGER_STEPS : PARTICIPANT_STEPS
```

**Completion write-back**
```typescript
async function complete() {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true, onboarding_step: null })
    .eq('id', user.id)
  if (!error) set({ isComplete: true })
}
```

## Pitfalls
Never trust linear step order — validate each step's precondition independently (e.g. confirm profile row exists before marking profile step done). Users navigating away mid-flow will return with partial state.