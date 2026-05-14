---
name: frontend-design
description: |
  Designs UI components using Mantine with theming and accessibility.
  Use when: implementing or refactoring Frontend Design work, troubleshooting aesthetics, components, layouts, or aligning new changes with the repository's existing conventions
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Frontend Design Skill

This fallback skill keeps Frontend Design work aligned with the conventions already present in this repository. Prefer extending the closest existing implementation over inventing a new abstraction, and verify neighboring states before finishing.

## Quick Start

### Inspect the current implementation

```sh
rg -n "frontend-design|aesthetics|components|layouts" .
rg --files | rg "frontend-design|aesthetics|components"
```

### Make the smallest compatible change

- Reuse the current design tokens, spacing rhythm, and component primitives before inventing new ones.
- Keep visual changes consistent across loading, empty, hover, focus, and mobile states.
- Favor intentional, legible UI over trend-driven styling flourishes.

### Verify before finishing

- Check responsive behavior and the primary interactive states affected by the change.
- Verify empty, loading, error, and disabled states if the surface exposes them.
- Confirm accessibility basics still hold: labels, focus states, semantics, and contrast.

## Key Concepts

| Concept | Why it matters | What to check |
|---------|----------------|---------------|
| Existing patterns | Keeps the repo coherent | Start from the nearest matching implementation before editing |
| Scope control | Prevents abstraction creep | Keep the change in the same layer as surrounding code |
| Verification | Catches regressions early | Recheck adjacent states, edge cases, and integration points |
| References | Speeds up repeat work | Use the linked topic files when the task needs deeper guidance |

## Common Patterns

### Aesthetics

**When:** The task touches aesthetics in Frontend Design work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

### Components

**When:** The task touches components in Frontend Design work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

### Layouts

**When:** The task touches layouts in Frontend Design work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

## See Also

- [Aesthetics](references/aesthetics.md)
- [Components](references/components.md)
- [Layouts](references/layouts.md)
- [Motion](references/motion.md)
- [Patterns](references/patterns.md)