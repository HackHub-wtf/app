# Content Copy

## When to use
When writing or rewriting the text inside banners, modals, alerts, notifications, and tooltips — title, body, and button labels.

## Patterns

### Subject-first notifications
Lead with what happened, not what the system did.

```
✓ "Team invite accepted"
✗ "The invite acceptance operation completed successfully"
```

### Role-matched body copy
Use `useAuthStore` to serve different copy to managers vs participants. Managers need action prompts; participants need status updates.

```tsx
const isManager = user?.role === 'manager'
const body = isManager
  ? 'Two ideas are waiting for your review before voting opens.'
  : 'Your idea is under review. You\'ll be notified when voting starts.'
```

### CTA verb specificity
Every button label should name the outcome, not the gesture.

| Vague | Specific |
|-------|----------|
| OK | Got it |
| Submit | Submit Idea |
| Continue | Join Hackathon |
| Yes | Enable Notifications |

## Pitfalls
- Drop filler: "Please note that", "Successfully", "In order to" add no meaning and slow reading.
- Don't use `color="red"` alerts for informational messages — users learn to ignore surfaces that overuse urgency signals.