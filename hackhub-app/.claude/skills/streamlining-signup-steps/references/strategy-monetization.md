# Strategy & Monetization

## When to use
When deciding which signup fields or activation steps to require vs. defer based on plan tier or trial logic.

## Patterns

**Free-tier minimal gate** — free accounts should require only email + password. Any additional data collection at signup should be tied to a paid or verified tier where there is a clear reason to ask.

**Trial activation trigger** — define a single action that starts the trial clock (e.g., creating or joining a hackathon). Do not start trials on signup — users who sign up but never activate skew churn metrics and waste re-engagement budget.

**Role-based onboarding fork** — after signup, ask one question: "Are you organizing or participating?" Route to different onboarding paths based on the answer. This defers role collection without losing it, and lets you show the right first action for each user type.

## Pitfalls
Do not require payment information during free trial signup unless there is a legal or fraud-prevention reason. Every additional field at the gate reduces trial starts, which reduces the pool of users who can convert to paid.