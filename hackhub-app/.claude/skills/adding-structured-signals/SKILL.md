---
name: adding-structured-signals
description: |
  Adds structured data for rich results.
  Use when: implementing or refactoring Adding Structured Signals work, troubleshooting technical, on page, content, or aligning new changes with the repository's existing conventions
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Adding Structured Signals Skill

This fallback skill keeps Adding Structured Signals work aligned with the conventions already present in this repository. Prefer extending the closest existing implementation over inventing a new abstraction, and verify neighboring states before finishing.

## Quick Start

### Inspect the current implementation

```sh
rg -n "adding-structured-signals|technical|on-page|content" .
rg --files | rg "adding-structured-signals|technical|on-page"
```

### Make the smallest compatible change

- Anchor every recommendation to a real page, route, content surface, or metadata entry in the repo.
- Keep messaging, hierarchy, and measurement advice consistent with the project's current funnel design.
- Prefer tactical edits with clear verification steps over broad strategy essays.

### Verify before finishing

- Verify the changed path and the most likely adjacent edge cases.
- Check that naming, layering, and file placement still match nearby code.
- Confirm there is a clear reason for any new abstraction, dependency, or workflow.

## Key Concepts

| Concept | Why it matters | What to check |
|---------|----------------|---------------|
| Existing patterns | Keeps the repo coherent | Start from the nearest matching implementation before editing |
| Scope control | Prevents abstraction creep | Keep the change in the same layer as surrounding code |
| Verification | Catches regressions early | Recheck adjacent states, edge cases, and integration points |
| References | Speeds up repeat work | Use the linked topic files when the task needs deeper guidance |

## Common Patterns

### Technical

**When:** The task touches technical in Adding Structured Signals work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

### On Page

**When:** The task touches on page in Adding Structured Signals work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

### Content

**When:** The task touches content in Adding Structured Signals work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

## See Also

- [Technical](references/technical.md)
- [On Page](references/on-page.md)
- [Content](references/content.md)
- [Programmatic](references/programmatic.md)
- [Schema](references/schema.md)
- [Competitive](references/competitive.md)