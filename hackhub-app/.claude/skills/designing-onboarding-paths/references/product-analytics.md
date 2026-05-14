# Product Analytics

## When to use
When you need to measure onboarding funnel drop-off, feature adoption rates, or checklist completion across user cohorts. Wire analytics events at step transitions and completion boundaries.

## Patterns

**Step-transition event**
```typescript
function trackStep(step: string, role: string) {
  // Replace with your analytics provider (e.g. PostHog, Amplitude)
  window.analytics?.track('onboarding_step_viewed', { step, role })
}

// Call in each step's onMount or useEffect
useEffect(() => { trackStep('join-team', user.role) }, [])
```

**Completion funnel event**
```typescript
async function complete() {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', user.id)

  if (!error) {
    window.analytics?.track('onboarding_completed', {
      role: user.role,
      steps_taken: currentStep + 1,
      ms_elapsed: Date.now() - onboardingStartedAt,
    })
    set({ isComplete: true })
  }
}
```

**Checklist adoption metric**
```typescript
const adoptionRate = CHECKLIST_ITEMS.filter(i => i.check(profile)).length / CHECKLIST_ITEMS.length
window.analytics?.identify(user.id, { adoption_rate: adoptionRate })
```

## Pitfalls
Do not log analytics events inside Supabase real-time callbacks — they fire on every replica change and will inflate counts. Fire events only on explicit user actions or confirmed server writes.