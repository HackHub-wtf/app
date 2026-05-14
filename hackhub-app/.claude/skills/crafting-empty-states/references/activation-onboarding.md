# Activation & Onboarding

## When to use
When a user logs in for the first time or reaches a page with no existing data. The goal is to reduce time-to-first-action by surfacing the right next step immediately.

## Patterns

### First-login empty dashboard
Show a role-aware welcome state on the home page when the user has no hackathons yet.

```tsx
const { data: hackathons = [], isLoading } = useQuery({
  queryKey: ['hackathons'],
  queryFn: HackathonService.getAll,
})
const { user } = useAuthStore()
const isManager = user?.role === 'manager' || user?.role === 'admin'

if (!isLoading && hackathons.length === 0) {
  return (
    <Stack align="center" gap="md" py={80}>
      <IconTrophy size={56} stroke={1.1} color="var(--mantine-color-dimmed)" />
      <Text fw={700} size="xl">No hackathons yet</Text>
      <Text c="dimmed" size="sm" ta="center" maw={400}>
        {isManager
          ? 'Create your first hackathon to start inviting participants.'
          : 'You have not joined any hackathons. Wait for an invite or browse open events.'}
      </Text>
      {isManager && <Button component={Link} to="/hackathons/new">Create hackathon</Button>}
    </Stack>
  )
}
```

### Step-indicator for multi-step setup (manager)
When a hackathon exists but has no teams or ideas yet, guide the manager through setup stages.

```tsx
const steps = [
  { label: 'Create hackathon', done: true },
  { label: 'Add teams', done: teams.length > 0 },
  { label: 'Invite participants', done: members.length > 1 },
]

return (
  <Stepper active={steps.filter(s => s.done).length} size="sm">
    {steps.map(s => <Stepper.Step key={s.label} label={s.label} />)}
  </Stepper>
)
```

### Dismissible onboarding banner
Persist dismissal in `localStorage` so the banner does not reappear.

```tsx
const [dismissed, setDismissed] = useState(
  () => localStorage.getItem('onboarding_dismissed') === '1'
)
const dismiss = () => {
  localStorage.setItem('onboarding_dismissed', '1')
  setDismissed(true)
}
if (dismissed) return null
return <OnboardingBanner onDismiss={dismiss} />
```

## Pitfalls
- Never show the onboarding state while `isLoading` is true — flickering banners erode trust. Always gate on `!isLoading && data.length === 0`.