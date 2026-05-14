# Growth Engineering

## When to use
When wiring up the mechanics that move users from free to paid: limit nudges, trial logic, and plan transitions.

### Pattern: Near-limit nudge via React Query
Fetch current usage counts alongside team data so nudges appear without extra round trips.
```typescript
export function useTeamUsage(hackathonId: string) {
  const plan = useAuthStore(s => s.plan)
  const { data: teams } = useQuery({
    queryKey: ['teams', hackathonId],
    queryFn: () => TeamService.getTeams(hackathonId),
  })

  return {
    count: teams?.length ?? 0,
    atLimit: !isWithinLimit(plan, 'maxTeams', teams?.length ?? 0),
    nearLimit: isNearLimit(plan, 'maxTeams', teams?.length ?? 0),
  }
}
```

### Pattern: Plan transition via profile update
Keep plan changes in one place — write to Supabase profiles, then refresh auth state.
```typescript
export async function upgradePlan(userId: string, newPlan: PlanKey) {
  const { error } = await supabase
    .from('profiles')
    .update({ plan: newPlan })
    .eq('id', userId)
  if (error) throw error
  useAuthStore.getState().refreshProfile()
}
```

### Pattern: Feature unlock notification after upgrade
```typescript
// After upgradePlan resolves
notifications.show({
  title: 'Plan upgraded',
  message: `You're now on the ${PLAN_LABELS[newPlan]} plan. ${PLAN_TAGLINES[newPlan]}`,
  color: 'green',
})
```

## Pitfalls
- Don't grant plan features client-side before the Supabase write confirms — optimistic plan upgrades can expose features to users whose payment failed.