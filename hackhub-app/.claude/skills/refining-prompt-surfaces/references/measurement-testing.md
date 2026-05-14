# Measurement and Testing

## When to use
When validating whether a prompt change improved outcomes, or diagnosing why a surface isn't driving the expected action.

## Patterns

### Instrumenting dismissal vs completion
Track both paths. If dismissal rate is high, the prompt is poorly timed or the copy is wrong. If completion rate is high but the action doesn't stick, the CTA may be misleading.

```tsx
const handleDismiss = () => {
  analytics.track('prompt_dismissed', { surface: 'team-setup-banner', phase: currentHackathon?.status })
  setDismissed(true)
}
```

### Before/after copy comparison
When rewriting a surface, keep the old copy in a comment for one deploy cycle. It makes rollback trivial and gives reviewers a clear diff.

```tsx
{/* was: "Don't forget to set up your team before the deadline" */}
<Alert title="Team setup needed">
  Add at least one member before the hackathon starts.
</Alert>
```

### Phase funnel checkpoints
For multi-step flows (register → join team → submit idea), identify the step with the highest drop rate. That's where prompt surfaces have the most leverage.

## Pitfalls
- Don't run copy experiments without a clear success metric defined in advance. "Felt better" is not a result.
- Avoid measuring impressions alone — a prompt shown 1000 times that nobody acts on is a failure, not a success.