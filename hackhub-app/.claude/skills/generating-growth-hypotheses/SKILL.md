---
name: generating-growth-hypotheses
description: |
  Generates channel experiments and growth loops.
  Use when: implementing or refactoring Generating Growth Hypotheses work, troubleshooting conversion optimization, content copy, distribution, or aligning new changes with the repository's existing conventions
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Generating Growth Hypotheses Skill

This fallback skill keeps Generating Growth Hypotheses work aligned with the conventions already present in this repository. Prefer extending the closest existing implementation over inventing a new abstraction, and verify neighboring states before finishing.

## Quick Start

### Inspect the current implementation

```sh
rg -n "generating-growth-hypotheses|conversion-optimization|content-copy|distribution" .
rg --files | rg "generating-growth-hypotheses|conversion-optimization|content-copy"
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

### Conversion Optimization

**When:** The task touches conversion optimization in Generating Growth Hypotheses work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

### Content Copy

**When:** The task touches content copy in Generating Growth Hypotheses work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

### Distribution

**When:** The task touches distribution in Generating Growth Hypotheses work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

## See Also

- [Conversion Optimization](references/conversion-optimization.md)
- [Content Copy](references/content-copy.md)
- [Distribution](references/distribution.md)
- [Measurement Testing](references/measurement-testing.md)
- [Growth Engineering](references/growth-engineering.md)
- [Strategy Monetization](references/strategy-monetization.md)