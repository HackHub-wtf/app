# Feedback & Insights

## When to use
When collecting qualitative signal from users about a feature they just tried, or when surfacing adoption friction discovered through support or analytics.

## Patterns

**Post-action micro-survey via notification**
```typescript
// Trigger after user's first video call ends
notificationService.notify({
  type: 'feedback_prompt',
  title: 'How was the video call?',
  message: 'Quick rating helps us improve the experience.',
  actionLabel: 'Rate it',
  actionUrl: `/feedback/video-call?source=post-call`
})
```

**Inline thumbs feedback on a nudge**
```typescript
<Group gap="xs">
  <Text size="sm">Was this helpful?</Text>
  <ActionIcon variant="subtle" onClick={() => { trackAdoption('file-nudge', 'helpful'); dismiss('file-nudge') }}>
    <IconThumbUp size={16} />
  </ActionIcon>
  <ActionIcon variant="subtle" onClick={() => { trackAdoption('file-nudge', 'not-helpful'); dismiss('file-nudge') }}>
    <IconThumbDown size={16} />
  </ActionIcon>
</Group>
```

**Persist feedback in Supabase**
```typescript
await supabase.from('feature_feedback').insert({
  user_id: user.id,
  feature: 'video-call',
  rating: selectedRating,
  comment: freeTextComment ?? null,
  submitted_at: new Date().toISOString()
})
```

## Pitfalls
Don't prompt for feedback immediately after a negative or error state — if a video call failed or a file upload errored, fix the problem first. Feedback collected after friction produces noise, not signal.