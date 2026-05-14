# Strategy and Monetization

## When to use
When prompt surfaces need to communicate plan limits, upgrade paths, or feature gating within HackHub's access model.

## Patterns

### Limit-reached alerts over silent failures
When a user hits a plan boundary (e.g., max teams, max hackathons), show an explicit `Alert` explaining what the limit is and what unlocks it. Silent failures erode trust.

```tsx
<Alert color="yellow" title="Team limit reached">
  Your plan supports up to 3 teams. Contact your admin to expand access.
</Alert>
```

### Upgrade prompts scoped to managers
Only managers and admins should see upgrade or billing prompts. Showing them to participants creates confusion and support noise.

```tsx
const canSeeUpgradePrompt = ['admin', 'manager'].includes(user?.role ?? '')
if (!canSeeUpgradePrompt) return null
```

### Feature-preview modals for locked capabilities
For features visible but not accessible, use a `Modal` that explains the value before asking for an action — not a tooltip that just says "Upgrade required."

```tsx
<Modal title="Advanced voting criteria">
  <Text>Weight ideas by innovation, feasibility, and impact. Available on the Pro plan.</Text>
  <Button mt="md" onClick={handleContactAdmin}>Request access</Button>
</Modal>
```

## Pitfalls
- Don't block a user's current workflow with an upgrade modal mid-task. Show it after the task completes, or on a dedicated settings surface.
- Avoid language like "Unlock premium features" — it's vague. Name the specific capability the user is missing.