# Content Copy

## When to use
When producing the actual text assets — changelog entry, Slack announcement, in-app tooltip, or GitHub release body — that ship alongside or after the feature.

## Patterns

**Changelog entry formula:** one sentence (what users can do now) + one sentence (what it replaces or removes) + one sentence (who it affects). Pull the "what it replaces" from git log or PR description, not from assumptions.

**Slack announcement structure:** headline → one-paragraph narrative → bulleted role impact (Manager / Participant / Admin) → single action link. Keep the paragraph under 60 words so it renders fully in notification previews without truncation.

**In-app tooltip copy:** read the component's prop types and visible labels in the relevant `.tsx` file. Write tooltip text that mirrors the exact terminology in the UI — mismatched labels between tooltip and button create support tickets.

## Pitfalls
Don't write copy before reading the code. Feature names drift between design, PR title, and implementation. The string literals in `src/components/` and `src/pages/` are the canonical source of truth for what the UI actually says.