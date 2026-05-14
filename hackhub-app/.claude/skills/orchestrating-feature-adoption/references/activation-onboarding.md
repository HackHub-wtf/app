# Activation & Onboarding

## When to use
When a user has just registered, joined a hackathon for the first time, or reached a zero-state screen (no teams, no ideas, no votes yet).

## Patterns

**Empty-state CTA on first visit**
```typescript
// src/pages/Teams.tsx
{teams.length === 0 && (
  <EmptyState
    icon={<IconUsers size={48} />}
    title="You're not on a team yet"
    description="Join or create a team to start collaborating."
    action={<Button onClick={openCreateTeam}>Create a team</Button>}
  />
)}
```

**Role-gated onboarding step**
```typescript
import { hasRole } from '@/utils/permissions'

const isNewManager = hasRole(user, 'manager') && hackathons.length === 0
if (isNewManager) {
  // Route to guided hackathon creation flow
  navigate('/hackathons/new?onboarding=true')
}
```

**Persist onboarding completion in Supabase user metadata**
```typescript
await supabase.auth.updateUser({
  data: { onboarding_completed: true, onboarding_completed_at: new Date().toISOString() }
})
```

## Pitfalls
Never show onboarding flows to returning users who have already completed them — always check `user.user_metadata.onboarding_completed` before rendering wizard steps or CTAs.