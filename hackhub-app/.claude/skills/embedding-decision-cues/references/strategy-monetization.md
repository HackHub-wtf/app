# Strategy & Monetization

## When to use
When decision cues need to support business outcomes — premium feature discovery, plan upgrades, or sponsor visibility — without undermining trust.

## Patterns

**Gate premium features with inline upgrade prompts**
When a user hits a limit (e.g., max ideas per team), render a Mantine `Alert` with `color="yellow"` explaining what the limit is and what unlocking it provides. Avoid modal interruptions mid-flow; inline prompts convert better and feel less coercive.

**Sponsor visibility tied to high-engagement moments**
Surface sponsor badges or prizes adjacent to the idea submission CTA — the moment of highest intent. Pull sponsor data from a `hackathon.sponsors` JSON field and render with `Badge` + `Tooltip` for detail. Never let sponsor content obscure the primary action.

**Value framing on plan comparison**
When showing upgrade options, anchor on outcomes ("submit up to 10 ideas", "priority review by judges") rather than feature names. Use the user's current usage data from `IdeaService` to personalize: "You've used 2 of your 3 idea slots."

## Pitfalls
- Monetization nudges shown to users who are already on the right plan erode trust quickly; always read the user's current entitlements from `authStore` before rendering any upgrade prompt.