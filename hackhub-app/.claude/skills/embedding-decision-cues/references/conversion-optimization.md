# Conversion Optimization

## When to use
When a key action (register, join team, submit idea, vote) has low completion rates or users drop off mid-flow.

## Patterns

**Urgency near the primary CTA**
Pull `hackathon.submission_deadline` from `hackathonStore` and render a `Badge` only when `hoursLeft < 24`. Place it inline with the button, not above the fold — proximity to the action is what drives response.

**Slot scarcity on team cards**
`MAX_TEAM_SIZE - team.member_count` is already computable from `TeamService.getTeams()` data. Show it as dimmed text until ≤2 slots remain, then switch to `c="red"`. Never fabricate scarcity — if data isn't fresh, don't show the count.

**Reduce perceived risk with optimistic UI**
Use TanStack Query `onMutate` to reflect votes and joins immediately. Users who see instant feedback complete follow-on actions at higher rates than those who wait for a spinner.

## Pitfalls
- Stacking multiple urgency cues on one screen creates noise — pick the single highest-stakes signal per page.
- Deadline countdowns that don't match the actual deadline destroy trust; always derive from the database record, never hardcode.