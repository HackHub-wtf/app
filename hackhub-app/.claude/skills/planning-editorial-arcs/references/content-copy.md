# Content Copy

## When to use
When writing or reviewing copy for any HackHub surface: in-app labels, tooltips, empty states, notifications, onboarding flows, or documentation pages.

## Patterns

**Surface-specific word budgets** — tooltips: ≤20 words. Empty states: ≤40 words. Notifications: ≤15 words. Release notes: ≤80 words per item. Exceeding budget is a signal the copy is doing too much.

**Audience-locked briefs** — every piece of copy targets exactly one audience: participant, manager, or admin. Copy written for "everyone" serves no one. `VotingCriteriaManager.tsx` and admin pages target managers only.

**Verb-led labels** — buttons and CTAs use imperative verbs: "Start hackathon", "Join team", "Submit idea". Noun labels ("Submission", "Team management") create hesitation.

## Pitfalls
Don't reuse the same copy across surfaces with different contexts. A notification saying "Your idea was submitted" works at Day 0; the same string in an empty state three days later is confusing.