# Distribution

## When to use
When deciding where in the app to expose plan information, upgrade entry points, and tier awareness.

### Pattern: Plan badge in the header
Surface current plan passively so users always know where they stand.
```tsx
import { Badge } from '@mantine/core'
import { PLAN_LABELS } from '@/utils/plans'

function HeaderPlanBadge() {
  const plan = useAuthStore(s => s.plan)
  if (plan === 'pro') return null
  return <Badge color="blue" variant="light">{PLAN_LABELS[plan]}</Badge>
}
```

### Pattern: Inline gate at the feature — not only on a pricing page
Gate checks should live closest to the blocked feature to reach users at the moment of intent.
```tsx
// In Teams.tsx, next to the "Add Member" button
{!canUseFeature(plan, 'videoCall') && (
  <Tooltip label={GATE_MESSAGES.videoCall}>
    <IconLock size={16} color="gray" />
  </Tooltip>
)}
```

### Pattern: `/billing` as the single upgrade destination
All upgrade CTAs link to one route so the conversion path is consistent and easy to instrument.
```tsx
<Button component={Link} to="/billing" variant="filled">
  See plans
</Button>
```

## Pitfalls
- Don't scatter upgrade links to external URLs — they break analytics funnels and are hard to update.
- Avoid showing plan upgrade prompts inside critical error states; it reads as exploitative.