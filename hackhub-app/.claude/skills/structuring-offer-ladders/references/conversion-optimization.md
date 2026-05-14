# Conversion Optimization

## When to use
When surfacing upgrade prompts, gating features, or reducing friction between free and paid tiers.

### Pattern: Gate at the action, not the page
Show locked UI rather than hiding it — users can't want what they can't see.
```tsx
function CreateTeamButton({ plan, teamCount }: { plan: PlanKey; teamCount: number }) {
  const allowed = isWithinLimit(plan, 'maxTeams', teamCount)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <>
      <Button onClick={allowed ? handleCreate : () => setUpgradeOpen(true)}>
        New Team
      </Button>
      <UpgradeModal opened={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  )
}
```

### Pattern: Contextual upgrade copy
Use the blocked action as the hook, not generic "upgrade now" language.
```tsx
<Text size="sm">
  You've used {teamCount} of {PLANS[plan].maxTeams} teams on the {plan} plan.
  Upgrade to create unlimited teams.
</Text>
```

### Pattern: Soft gate before hard block
Warn on approach to a limit, not only at the wall.
```typescript
export function isNearLimit(plan: PlanKey, limit: 'maxTeams' | 'maxMembers', count: number): boolean {
  return count >= PLANS[plan][limit] * 0.8
}
```

## Pitfalls
- Don't gate features behind a modal that requires two clicks to dismiss — users learn to ignore them fast.
- Never throw a hard error without an upgrade path visible in the same UI.