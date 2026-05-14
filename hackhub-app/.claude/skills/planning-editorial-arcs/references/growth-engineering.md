# Growth Engineering

## When to use
When editorial arcs need to support product-led growth loops — referral copy, viral hooks in team invites, upgrade prompts, or content that reduces time-to-value.

## Patterns

**Embed the loop in the copy** — team invite copy in `TeamChat.tsx` or `Teams.tsx` should reference what the invitee gains, not just who is inviting. "Kinn invited you to join their hackathon team — submit your idea before Friday" beats "You've been invited."

**Time-to-value copy** — for activation themes ("Make your first hackathon real"), the copy should name the next concrete step, not the feature name. "Create your team in 2 minutes" > "Use the team creation tool."

**Milestone triggers** — tie editorial nudges to product milestones: first team created, first idea submitted, first vote cast. These are the right moments for upgrade prompts or social sharing hooks.

## Pitfalls
Don't add growth copy to surfaces before the core action works reliably. A referral prompt on a broken team invite flow accelerates churn, not growth.