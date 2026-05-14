# Content & Copy

## When to use
When writing UI strings for tier names, gate messages, upgrade prompts, and plan comparison text.

### Pattern: Tier labels that signal value
Use names that imply progression, not just pricing tier numbers.
```typescript
export const PLAN_LABELS: Record<PlanKey, string> = {
  free:    'Free',
  starter: 'Starter',
  pro:     'Pro',
}

export const PLAN_TAGLINES: Record<PlanKey, string> = {
  free:    'Get started with one team',
  starter: 'Grow with video calls and more members',
  pro:     'No limits — analytics included',
}
```

### Pattern: Feature-specific gate messages
Match the copy to the blocked feature so users understand what upgrading buys them.
```typescript
export const GATE_MESSAGES: Partial<Record<keyof typeof PLANS.free, string>> = {
  videoCall:  'Video calls are available on Starter and above.',
  analytics:  'Analytics are a Pro-only feature.',
}
```

### Pattern: CTA copy tied to the delta
```tsx
<Button>Unlock video calls — upgrade to Starter</Button>
// not: <Button>Upgrade your plan</Button>
```

## Pitfalls
- Avoid "premium" as a tier name — it implies everything else is subpar.
- Don't use price in UI copy strings; prices change and the string will rot.