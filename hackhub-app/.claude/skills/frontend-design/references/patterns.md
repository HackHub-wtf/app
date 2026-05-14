# Frontend Design Patterns Reference

## When To Use

Use this reference when the task touches patterns while working on Frontend Design code in this repository.

## What To Inspect

- Reuse the current design tokens, spacing rhythm, and component primitives before inventing new ones.
- Keep visual changes consistent across loading, empty, hover, focus, and mobile states.
- Favor intentional, legible UI over trend-driven styling flourishes.
- Search for nearby implementations before creating a new structure or helper.

## Recommended Workflow

1. Find two or three nearby examples that already solve a similar problem.
2. Decide whether to extend an existing abstraction or keep the change local.
3. Apply the smallest change that keeps behavior predictable and naming consistent.
4. Re-run the most relevant checks for the surface you touched.
5. Update docs, tests, or supporting config only when the behavior truly changed.

## Quality Bar

- Prefer project-native conventions over generic framework advice.
- Keep instructions concise, actionable, and tied to the repository's current structure.
- Avoid new dependencies or patterns unless repetition clearly justifies them.

## Pitfalls

- Mixing incompatible patterns in the same surface or module.
- Rewriting structure that could be extended safely in place.
- Shipping without checking adjacent states, edge cases, or cleanup work.

## Done Checklist

- [ ] Check responsive behavior and the primary interactive states affected by the change.
- [ ] Verify empty, loading, error, and disabled states if the surface exposes them.
- [ ] Confirm accessibility basics still hold: labels, focus states, semantics, and contrast.