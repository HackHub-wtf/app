# Competitive Reference — Compare Hubs

## When to use
When positioning HackHub's compare pages against similar discovery patterns or when deciding which dimensions to surface in the feature matrix.

## Patterns

**Dimension selection** — prioritize dimensions that are both factual and differentiating; skip dimensions where all items have the same value:
```
✓ Max team size (varies)         ✗ "Supports teams" (always true)
✓ Voting criteria count (varies) ✗ "Has a dashboard" (always true)
✓ Real-time chat (yes/no)
```

**Badge color convention** — use consistently so users build intuition across pages:
```tsx
// green = strength, red = gap, gray = neutral / not applicable
<Badge color="green">Yes</Badge>
<Badge color="red">No</Badge>
<Badge color="gray">N/A</Badge>
```

**Canonical comparison direction** — always render the "home" subject (the one the user arrived from) in the left column; the challenger goes right. This matches user mental models from web search result pages.

## Pitfalls
- Don't surface dimensions you can't keep current — stale data on a comparison page (e.g., wrong team size limit) damages trust more than omitting the row entirely.
- Avoid creating comparison pages for items with fewer than three meaningful differentiating dimensions; the table looks thin and users interpret it as low-effort content.