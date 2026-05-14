# Conversion Optimization

## When to use
When improving the rate at which new users complete a meaningful first action — joining a hackathon, creating a team, or submitting an idea.

## Patterns

**Reduce steps to first action**
Move the most important CTA above the fold on the post-login page. If a user lands on a dashboard with no active hackathons, show a single "Find a hackathon" prompt rather than a full empty layout.

**Progressive disclosure**
Don't show all onboarding steps at once. Surface step N+1 only after step N is complete. Use Mantine `Stepper` with `allowStepSelect={false}` to enforce sequencing.

**Inline error recovery**
On registration and profile forms, surface Zod validation errors inline (via React Hook Form `formState.errors`) rather than on submit. Users who see errors mid-flow convert at higher rates than those who hit a wall at the end.

## Pitfalls
- Don't gate activation behind profile completion fields that aren't strictly necessary. Every optional field added to a required onboarding step drops completion rate. Ask for the minimum, collect the rest later.