# In-App Guidance

## When to use
When users reach a page or state for the first time and need contextual orientation — without leaving the flow or reading external docs.

## Patterns

**Step indicator on multi-step flows**
```typescript
import { Stepper } from '@mantine/core'

const STEPS = ['Account', 'Join Hackathon', 'Join Team', 'Submit Idea']

<Stepper active={currentStep} breakpoint="sm">
  {STEPS.map((label, i) => (
    <Stepper.Step key={i} label={label} />
  ))}
</Stepper>
```

**Contextual tooltip on first render (dismiss on interaction)**
```typescript
const [seenHint, setSeenHint] = useState(() =>
  localStorage.getItem('hint:team-join') === '1'
)

<Tooltip
  label="Click Join to enter a team — you can leave at any time"
  opened={!seenHint}
  withArrow
>
  <Button onClick={() => { setSeenHint(true); localStorage.setItem('hint:team-join', '1') }}>
    Join Team
  </Button>
</Tooltip>
```

**Inline helper text on form fields prone to errors**
```typescript
<TextInput
  label="Team name"
  description="2–50 characters. Must be unique within this hackathon."
  error={errors.name?.message}
  {...register('name')}
/>
```

## Pitfalls
Do not use `Notifications.show` (toast) to surface validation errors — users miss toasts when focused on a form field. Always render errors inline via the `error` prop on the Mantine input component.