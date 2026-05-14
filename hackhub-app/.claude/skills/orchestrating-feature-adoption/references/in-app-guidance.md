# In-App Guidance

## When to use
When surfacing a feature inline — via tooltip, spotlight, or contextual banner — without interrupting the user's current workflow.

## Patterns

**One-time contextual tooltip**
```typescript
import { Tooltip } from '@mantine/core'
import { useAdoptionStore } from '@/store/adoptionStore'

const { dismissedNudges, dismiss } = useAdoptionStore()

<Tooltip
  label="Start a video call with your team"
  opened={!dismissedNudges.has('video-nudge')}
  withArrow
  onMouseLeave={() => dismiss('video-nudge')}
>
  <ActionIcon onClick={startCall}><IconVideo /></ActionIcon>
</Tooltip>
```

**Spotlight registration for hidden features**
```typescript
// Register once in App.tsx
import { SpotlightProvider } from '@mantine/spotlight'

const actions = [
  { id: 'video-call', label: 'Start video call', description: 'Connect with your team', onClick: () => navigate('/team/video') },
  { id: 'file-share', label: 'Share a file', description: 'Attach files to your idea', onClick: openFileManager },
  { id: 'markdown', label: 'Open Markdown editor', onClick: () => setEditorMode('markdown') },
]
```

**Inline banner for phase transitions**
```typescript
{hackathon.phase === 'voting' && !hasVoted && (
  <Alert icon={<IconBulb />} title="Voting is open" color="blue">
    Rate your favourite ideas before the deadline.
    <Anchor onClick={() => navigate('/ideas')}>Go to voting</Anchor>
  </Alert>
)}
```

## Pitfalls
Avoid stacking multiple tooltips or banners on the same screen. More than one simultaneous nudge creates noise and users dismiss all of them. Show the highest-priority guidance only.