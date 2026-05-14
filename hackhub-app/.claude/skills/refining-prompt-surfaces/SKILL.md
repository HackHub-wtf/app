---
name: refining-prompt-surfaces
description: Optimizes banners, modals, and in-app prompts for clarity, timing, and conversion in HackHub's React/TypeScript frontend using Mantine primitives.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Refining Prompt Surfaces Skill

Audits and rewrites banners, modals, alerts, and inline prompts across HackHub to sharpen copy, reduce friction, and improve user response rates. Works within Mantine 8's `Modal`, `Alert`, `Notification`, and `Popover` components, applying behavioral copy principles and consistent tone without adding new dependencies.

## Quick Start

1. Locate the surface to refine — scan `src/components/` and `src/pages/` for `Modal`, `Alert`, `Notification`, or `Banner` usage.
2. Read the component to understand the trigger context (auth state, permission level, hackathon phase).
3. Apply copy and structural improvements directly in the component.
4. Verify TypeScript compiles: `npm run build`.
5. Lint: `npm run lint`.

## Key Concepts

**Copy hierarchy** — Every prompt surface needs one job: confirm, warn, nudge, or inform. Mixed-purpose prompts confuse users. Strip to the single most important message.

**Trigger fidelity** — A prompt is only as good as its timing. Check where the component is mounted and what state drives its visibility. A banner shown to users who already completed an action creates distrust.

**CTA specificity** — Replace vague labels (`OK`, `Submit`, `Continue`) with action verbs that name the outcome (`Join Team`, `Submit Idea`, `Enable Notifications`). Mantine `Button` labels are the primary lever.

**Dismissal respect** — Prompts that can't be dismissed or reappear immediately erode trust. Use Zustand stores or `localStorage` to persist dismissed state when appropriate.

**Role awareness** — HackHub has admins, managers, and participants. Copy should match the reader's capability. Use `useAuthStore` to gate or tailor prompt content by role.

## Common Patterns

### Tightening a modal CTA

```tsx
// Before — vague
<Button onClick={handleSubmit}>Submit</Button>

// After — specific to the action
<Button onClick={handleSubmit}>Submit Idea to Hackathon</Button>
```

### Reducing banner noise with dismissal persistence

```tsx
import { useLocalStorage } from '@mantine/hooks'
import { Alert } from '@mantine/core'

const [dismissed, setDismissed] = useLocalStorage({
  key: 'team-setup-banner-dismissed',
  defaultValue: false,
})

if (dismissed) return null

return (
  <Alert
    title="Finish setting up your team"
    withCloseButton
    onClose={() => setDismissed(true)}
  >
    Add at least one member before the hackathon starts.
  </Alert>
)
```

### Role-aware prompt copy

```tsx
import { useAuthStore } from '@/store/authStore'

const { user } = useAuthStore()
const isManager = user?.role === 'manager'

<Modal title={isManager ? 'Review this idea' : 'Your idea is under review'}>
  {isManager
    ? 'Approve or request changes before the voting phase opens.'
    : 'A manager will review your submission before voting begins.'}
</Modal>
```

### Notification copy checklist

- Subject first: what happened, not what the system did (`"Team joined"` not `"Join operation successful"`)
- Skip filler words: drop "Please", "Successfully", "Note that"
- One sentence max for `@mantine/notifications` toasts
- Use `color="red"` only for errors that block the user; use `color="yellow"` for warnings

### Audit entry points

```bash
# Find all Modal usages
grep -r "<Modal" src/ --include="*.tsx" -l

# Find all Alert usages
grep -r "<Alert" src/ --include="*.tsx" -l

# Find notification calls
grep -r "notifications.show" src/ --include="*.ts" --include="*.tsx" -l
```