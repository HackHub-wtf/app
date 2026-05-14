# Conversion Optimization

## When to use
When the release story needs to motivate action — getting managers to configure the feature, participants to adopt a new flow, or admins to enable a rollout.

## Patterns

**Lead with the outcome, not the capability.** "Your team can now vote on any dimension that matters" lands harder than "voting criteria are now configurable." Read the component's visible UI text (button labels, headings, empty states) to find the user-facing language already in the codebase.

**Reduce perceived friction in the headline.** If a feature replaces a multi-step workaround, name the workaround: "No more spreadsheet scoring — judges set criteria directly in HackHub." Grep for the old flow in `src/pages/` comments or TODOs to find what was painful before.

**Match the CTA to the role.** Managers need setup instructions; participants need reassurance that existing work is preserved. Segment the rollout checklist by role so each audience sees only the steps relevant to them.

## Pitfalls
Avoid abstract benefit claims ("streamlined experience", "improved workflow"). If you can't point to a specific UI element or service method that changed, the claim is too vague to convert anyone.