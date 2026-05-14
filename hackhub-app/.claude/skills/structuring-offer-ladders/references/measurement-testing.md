# Measurement & Testing

## When to use
When validating that gate logic is correct, limit enforcement is consistent, and upgrade flows behave as expected.

### Pattern: Unit-test plan constants directly
```typescript
import { PLANS, isWithinLimit, canUseFeature } from '@/utils/plans'

test('free plan blocks video calls', () => {
  expect(canUseFeature('free', 'videoCall')).toBe(false)
})

test('pro plan has no effective team limit', () => {
  expect(isWithinLimit('pro', 'maxTeams', 998)).toBe(true)
})

test('starter blocks at maxMembers', () => {
  expect(isWithinLimit('starter', 'maxMembers', 15)).toBe(false)
})
```

### Pattern: Test the service layer hard block
```typescript
test('createTeam throws when free plan is at limit', async () => {
  await expect(TeamService.createTeam(input, 'free', 1)).rejects.toThrow('free plan allows up to 1')
})
```

### Pattern: Track upgrade modal impressions
Log gate encounters so you know which features drive the most upgrade intent.
```typescript
function UpgradeModal({ feature, opened, onClose }) {
  useEffect(() => {
    if (opened) analytics.track('upgrade_prompt_shown', { feature })
  }, [opened, feature])
  // ...
}
```

## Pitfalls
- Don't rely solely on UI tests for gate logic — the service layer must enforce limits independently.
- Avoid testing with hardcoded plan strings; use the `PlanKey` type to catch renames at compile time.