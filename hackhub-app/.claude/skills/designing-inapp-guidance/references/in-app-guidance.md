# In-App Guidance Components

## When to use
Use this reference when building any tooltip, popover, stepper tour, or inline alert that teaches users how to use HackHub. All guidance components live in `src/components/` as PascalCase files and consume `useGuidanceStore` from `src/store/guidanceStore.ts`.

## Patterns

### Component selection guide

| Scenario | Component | Mantine primitive |
|----------|-----------|-------------------|
| Label a button or icon | `FeatureTooltip` | `Tooltip` |
| Explain a panel feature | `FeaturePopover` | `Popover` |
| Walk through a flow | `OnboardingTour` | `Stepper` + `Modal` |
| Persistent dismissable tip | `ContextualAlert` | `Alert` |

### Guidance store shape
All guidance components must read from and write to the shared store. Never manage seen-state in local `useState`.

```typescript
// src/store/guidanceStore.ts
interface GuidanceState {
  seen: Set<string>
  hasSeen: (id: string) => boolean
  markSeen: (id: string) => void
  reset: () => void   // dev/testing use only
}
```

Persist key: `'hackhub-guidance'`. Storage serialization must handle `Set` manually (JSON doesn't serialize `Set` natively — store as array, revive in `getItem`).

```typescript
getItem: (k) => {
  const raw = JSON.parse(localStorage.getItem(k) ?? 'null')
  if (raw?.state?.seen) raw.state.seen = new Set(raw.state.seen)
  return raw
},
setItem: (k, v) => {
  const copy = { ...v, state: { ...v.state, seen: [...v.state.seen] } }
  localStorage.setItem(k, JSON.stringify(copy))
},
```

### Role-gated rendering
Always check role before mounting a guidance component:

```typescript
if (!user || !hasRole(user, 'participant')) return null
```

## Pitfalls
- **Set serialization bug**: The default Zustand `persist` storage will silently turn `Set` into `{}` on reload. Always provide a custom `storage` config that serializes `Set` as an array.
- **Tour ID versioning**: When onboarding content changes significantly, bump the tour ID (e.g., `v1` → `v2`). Old IDs in `localStorage` will block users from seeing updated content.