# Writing Release Notes Engagement Adoption Reference

## When To Use

Use this reference when the task touches engagement adoption while working on Writing Release Notes code in this repository.

## What To Inspect

- Tie recommendations to real in-app flows, states, or surfaces instead of generic product advice.
- Preserve the existing activation, onboarding, and state-transition patterns around the touched area.
- Keep copy, prompts, and nudges aligned with the surrounding product voice and UI structure.
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

- [ ] Verify the changed path and the most likely adjacent edge cases.
- [ ] Check that naming, layering, and file placement still match nearby code.
- [ ] Confirm there is a clear reason for any new abstraction, dependency, or workflow.