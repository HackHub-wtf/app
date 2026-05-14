# Feedback and Insights

## When to use
When collecting user sentiment at the end of onboarding, after completing the checklist, or when a user skips or abandons a step. Surfaces data that informs future onboarding iteration.

## Patterns

**Exit-intent feedback modal**
```typescript
import { Modal, Textarea, Button, Group } from '@mantine/core'

function OnboardingSkipModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const [reason, setReason] = useState('')

  async function submit() {
    await supabase.from('onboarding_feedback').insert({ user_id: user.id, reason, skipped_at: new Date().toISOString() })
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Before you skip…">
      <Textarea label="What stopped you?" value={reason} onChange={e => setReason(e.target.value)} />
      <Group mt="md" justify="flex-end">
        <Button variant="subtle" onClick={onClose}>Never mind</Button>
        <Button onClick={submit}>Send feedback</Button>
      </Group>
    </Modal>
  )
}
```

**Completion NPS prompt**
```typescript
// Show once, 24 h after onboarding_completed is set
const showNps = profile.onboarding_completed
  && !profile.nps_submitted
  && Date.now() - new Date(profile.onboarding_completed_at).getTime() > 86_400_000
```

**Aggregate drop-off query (Supabase)**
```sql
select onboarding_step, count(*) as stuck_users
from profiles
where onboarding_completed = false
group by onboarding_step
order by stuck_users desc;
```

## Pitfalls
Do not block the skip action on form submission. Fire feedback writes in the background (`supabase.from(...).insert(...)` without `await` in the dismiss handler) so a network delay never traps the user inside a modal they already closed.