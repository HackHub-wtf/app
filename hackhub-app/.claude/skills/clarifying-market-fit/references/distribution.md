# Distribution

## When to use
When evaluating how HackHub reaches new users — referral paths, invite mechanics, share surfaces, and cross-channel entry points. Use when adding invite flows, share links, or any feature that turns existing users into acquisition vectors.

## Patterns

**Invite-as-onboarding**
Team invite links in `src/services/teamService.ts` are a distribution surface. The landing experience for an invite recipient should skip the generic homepage pitch and drop the user directly into context: "You've been invited to join [Team Name] in [Hackathon Name]." This reduces drop-off from cold invite links.

**Share surfaces near moments of value**
Idea submission (`src/services/ideaService.ts`) and team creation are high-emotion moments. Adding a share affordance immediately after these actions (not buried in settings) captures distribution intent while motivation is highest.

**Entry point copy alignment**
Users arriving from external links (Slack, email, direct share) land with a different mental model than organic visitors. Page copy should acknowledge the context when detectable — a team invite page shouldn't open with a generic HackHub pitch.

## Pitfall
Viral mechanics added to a product with weak activation don't scale — they just import more users who churn at the same point. Validate that invited users reach a meaningful first action before investing in invite-loop optimization.