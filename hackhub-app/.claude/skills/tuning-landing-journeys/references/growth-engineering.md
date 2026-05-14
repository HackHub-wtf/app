# Growth Engineering

## When to use
When building referral flows, share mechanics, invite links, or any feature where one user's action surfaces HackHub to a new potential user.

## Patterns

**Shareable hackathon URLs**
Every hackathon detail page should have a copy-link affordance that produces a deep-link URL (`/hackathons/:id`). This is the lowest-friction distribution mechanic available — no auth required to view the link.

**Team invite links**
Generate a short-lived signed URL for team invites. Store the invite token in Supabase with an expiry. On redemption, route the new user through a minimal registration flow that pre-fills the team join step.

**Post-action share prompts**
After a user submits an idea or joins a team, surface a contextual share prompt ("Tell your network about your hackathon"). Place it in the success state of the action modal, not as a separate page.

## Pitfalls
- Invite links that expire too quickly (under 48 hours) kill async sharing. Hackathon participants often share links via email threads that have response delays. Use 7-day expiry as a default.