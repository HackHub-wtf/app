---
name: writing-release-notes
description: |
  Drafts release notes tied to shipped features.
  Use when: implementing or refactoring Writing Release Notes work, troubleshooting activation onboarding, engagement adoption, in app guidance, or aligning new changes with the repository's existing conventions
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Writing Release Notes Skill

This fallback skill keeps Writing Release Notes work aligned with the conventions already present in this repository. Prefer extending the closest existing implementation over inventing a new abstraction, and verify neighboring states before finishing.

## Quick Start

### Inspect the current implementation

```sh
rg -n "writing-release-notes|activation-onboarding|engagement-adoption|in-app-guidance" .
rg --files | rg "writing-release-notes|activation-onboarding|engagement-adoption"
```

### Make the smallest compatible change

- Tie recommendations to real in-app flows, states, or surfaces instead of generic product advice.
- Preserve the existing activation, onboarding, and state-transition patterns around the touched area.
- Keep copy, prompts, and nudges aligned with the surrounding product voice and UI structure.

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

### Activation Onboarding

**When:** The task touches activation onboarding in Writing Release Notes work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

### Engagement Adoption

**When:** The task touches engagement adoption in Writing Release Notes work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

### In App Guidance

**When:** The task touches in app guidance in Writing Release Notes work.

- Inspect the nearest existing implementation before introducing a new pattern.
- Reuse naming, file placement, and helper utilities that are already established in this repo.
- Keep the change easy to review and easy to extend without widening scope unnecessarily.

## See Also

- [Activation Onboarding](references/activation-onboarding.md)
- [Engagement Adoption](references/engagement-adoption.md)
- [In App Guidance](references/in-app-guidance.md)
- [Product Analytics](references/product-analytics.md)
- [Roadmap Experiments](references/roadmap-experiments.md)
- [Feedback Insights](references/feedback-insights.md)