# In-App Guidance

## When to use
When introducing a specific feature to users who have never interacted with it — voting criteria configuration, markdown editor, or file manager. Use contextual tooltips and spotlight overlays rather than a full wizard.

## Patterns

**Mantine Tooltip for single-feature hints**
```typescript
import { Tooltip, ActionIcon } from '@mantine/core'
import { IconBulb } from '@tabler/icons-react'

<Tooltip label="Use markdown to format your idea description" position="right" withArrow>
  <ActionIcon variant="subtle"><IconBulb size={16} /></ActionIcon>
</Tooltip>
```

**Feature-seen flag to suppress after first view**
```typescript
async function markFeatureSeen(featureId: string) {
  const seen = profile.features_seen ?? []
  if (seen.includes(featureId)) return
  await supabase
    .from('profiles')
    .update({ features_seen: [...seen, featureId] })
    .eq('id', user.id)
}
```

**Mantine Popover spotlight for empty states**
```typescript
// Show guidance only when the list is empty
{ideas.length === 0 && (
  <Popover opened withArrow>
    <Popover.Target><Button>Submit idea</Button></Popover.Target>
    <Popover.Dropdown>No ideas yet — be the first to submit one.</Popover.Dropdown>
  </Popover>
)}
```

## Pitfalls
Avoid anchoring guidance to elements that may not render (e.g. a button behind a permission gate). Check `hasPermission` before rendering spotlight overlays to prevent broken pointer targets.