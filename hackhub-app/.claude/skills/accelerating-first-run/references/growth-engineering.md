# Growth Engineering

## When to use
When building mechanics that increase the rate at which new users reach activation, or that cause activated users to invite others.

## Patterns

**Invite-to-team flow**
After a user creates a team, immediately present a share link or email invite input. The moment of team creation is the highest-intent moment to trigger viral growth. Wire this into `teamService.ts` as a post-create callback.

**Social proof in empty states**
When showing a new user an empty hackathon list, display the number of active participants or recent submissions if the data is available. "12 teams have already formed for Spring Hackathon 2026" reduces perceived risk of joining.

**Onboarding completion as unlock**
Gate a desirable feature (e.g., idea voting, file uploads) behind onboarding completion. The unlock should feel like a reward, not a paywall. Use Mantine `Badge` or `Tooltip` to mark locked features with "Complete setup to unlock".

## Pitfalls
- Don't build viral loops that depend on users spamming their contacts. Invite mechanics should be opt-in and triggered at high-intent moments. Forced sharing prompts damage trust and increase churn.