# Engagement and Adoption

## When to use
When surfacing optional enrichment tasks to users who have completed mandatory onboarding but haven't yet adopted key platform features (uploading an avatar, submitting an idea, joining a second hackathon).

## Patterns

**Self-healing checklist derived from live data**
```typescript
const CHECKLIST_ITEMS = [
  { id: 'avatar', label: 'Upload a profile photo', check: (u: Profile) => !!u.avatar_url },
  { id: 'team',   label: 'Join or create a team',  check: (u: Profile) => u.team_count > 0 },
  { id: 'idea',   label: 'Submit your first idea',  check: (u: Profile) => u.idea_count > 0 },
]

const completed = CHECKLIST_ITEMS.filter(item => item.check(profile))
const progress = completed.length / CHECKLIST_ITEMS.length
```

**Mantine Progress bar in sidebar**
```typescript
import { Progress, Text } from '@mantine/core'

<Text size="sm">Getting started — {Math.round(progress * 100)}%</Text>
<Progress value={progress * 100} size="sm" mt={4} />
```

**Dismissible nudge after 3 logins**
```typescript
const shouldShowNudge = profile.login_count >= 3 && progress < 0.5 && !profile.nudge_dismissed
```

## Pitfalls
Do not store per-checklist-item completion flags in the database. Derive state from actual data (team memberships, idea rows) so the checklist stays accurate if the user completes actions outside the onboarding UI.