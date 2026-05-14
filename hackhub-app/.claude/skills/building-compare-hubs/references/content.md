# Content Reference — Compare Hubs

## When to use
When writing copy, labels, and microcopy for feature tables, alternative cards, and comparison CTAs inside HackHub compare pages.

## Patterns

**Neutral feature labels** — use noun phrases, not marketing copy:
```
✓ "Max team size"       ✗ "Generous team limits"
✓ "Voting criteria"     ✗ "Flexible judging"
✓ "Real-time chat"      ✗ "Live collaboration"
```

**Alternative card description** — one sentence on what makes it different, not better:
```tsx
<Text size="sm" c="dimmed">
  {alt.tagline ?? `Supports up to ${alt.maxTeamSize} members with ${alt.votingCriteria.length} voting criteria.`}
</Text>
```

**CTA copy** — action-oriented, specific to the comparison:
```
"Compare with [Name]"   (not "Click here" or "Learn more")
"See all alternatives"  (not "Explore more options")
```

## Pitfalls
- Don't write verdicts in the table ("better", "worse", "winner") — comparison pages show facts; Badge colors communicate relative strength without editorializing.
- Keep alternative card descriptions under two sentences; longer copy breaks the grid layout on smaller viewports.