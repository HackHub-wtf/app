# Activation & Onboarding Metrics

## When to use
Track the critical path from account creation through first meaningful action. Use these patterns when instrumenting registration, hackathon join, team formation, or first idea submission.

## Patterns

**Milestone events on the activation path**
```typescript
// Fire each milestone exactly once per user
const ACTIVATION_EVENTS = {
  REGISTERED: 'user:registered',
  HACKATHON_JOINED: 'hackathon:joined',
  TEAM_JOINED: 'team:joined',
  TEAM_CREATED: 'team:created',
  IDEA_SUBMITTED: 'idea:submitted',
} as const
```

**Track in service methods, not components**
```typescript
// src/services/teamService.ts
static async joinTeam(teamId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('team_members').insert({ team_id: teamId, user_id: userId })
  if (error) throw new Error(error.message)
  track(EVENTS.TEAM_JOINED, { userId, teamId })
}
```

**Detect first-time actions to avoid double-counting**
```typescript
// Query the user's prior events before firing activation milestones
const hasJoinedBefore = await supabase
  .from('team_members')
  .select('id')
  .eq('user_id', userId)
  .limit(2) // if count > 1, this is not the first join
```

## Pitfalls
- Do not fire `hackathon:joined` on every page load — check whether the user is already a member before firing.
- Activation milestones must be idempotent. Wrap them in a guard or track server-side if the frontend can trigger them multiple times.