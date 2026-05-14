# Strategy & Monetization

## When to use
Apply when designing forms that sit at plan upgrade prompts, feature gates, or premium feature unlock flows within HackHub.

## Patterns

### Gate premium fields with an inline upgrade prompt, not a redirect
If a form field (e.g. private hackathon toggle) requires a paid plan, disable the field and show a `Tooltip` with an upgrade CTA rather than removing the field entirely.

```typescript
<Tooltip label="Upgrade to Pro to create private hackathons" disabled={isPro}>
  <Switch
    label="Private hackathon"
    disabled={!isPro}
    {...register('is_private')}
  />
</Tooltip>
```

### Surface the upgrade form in a `Modal`, not a new page
Keep the user in context. Open a plan selection modal from the locked field rather than navigating away and losing form state.

```typescript
const [upgradeOpen, setUpgradeOpen] = useState(false)

<Modal opened={upgradeOpen} onClose={() => setUpgradeOpen(false)} title="Upgrade Plan">
  <PlanSelectionForm onSuccess={() => setUpgradeOpen(false)} />
</Modal>
```

### Preserve form state across the upgrade flow
Store the in-progress form values in Zustand or `sessionStorage` before opening the upgrade modal so the user returns to a pre-filled form after upgrading.

## Pitfalls
Do not silently drop premium field values when a user downgrades. Store the values and restore them if the user upgrades again — losing configured settings creates support tickets and erodes trust.