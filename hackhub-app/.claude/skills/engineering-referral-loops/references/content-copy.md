# Content Copy

## When to use
When writing invite link UI labels, share panel headlines, empty states for the referral dashboard, or reward confirmation messages.

## Patterns

**Invite link share panel**
Lead with the user's benefit, not the mechanic. Prefer "Bring your team — you both get bonus votes" over "Share your referral link."

**Reward confirmation toast**
Use a Mantine `notifications.show` call when a conversion is recorded. Keep copy action-oriented:
```typescript
notifications.show({
  title: 'Someone joined with your link',
  message: 'You earned 2 extra votes for the next round.',
  color: 'teal',
})
```

**Referral dashboard empty state**
When `conversions.length === 0`, render a `<Stack>` with a Tabler icon (`IconLink`), a single sentence explaining the mechanic, and a copy-link button — not a wall of explanation text.

## Pitfalls
- Avoid passive constructions ("your link was used") — active voice converts better ("Someone joined using your link").
- Don't promise rewards in UI copy before the reward logic is deployed; mismatched expectations drive support tickets.