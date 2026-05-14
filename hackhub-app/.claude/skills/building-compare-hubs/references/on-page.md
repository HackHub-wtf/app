# On-Page Reference — Compare Hubs

## When to use
When a comparison or alternatives page needs correct `<title>`, meta description, and heading hierarchy for search discoverability.

## Patterns

**Dynamic page title** — set the document title from route params once data loads:
```tsx
useEffect(() => {
  if (itemA && itemB) {
    document.title = `${itemA.name} vs ${itemB.name} — HackHub`
  }
}, [itemA, itemB])
```

**H1 mirrors the comparison intent** — use the subject names directly:
```tsx
<Title order={1}>{itemA.name} vs {itemB.name}</Title>
<Text c="dimmed">Side-by-side feature comparison</Text>
```

**Alternatives page heading** — name the subject and frame the intent:
```tsx
<Title order={1}>Alternatives to {subject.name}</Title>
<Text c="dimmed">{alternatives.length} similar hackathon platforms</Text>
```

## Pitfalls
- Don't use a generic title like "Compare" — both subject names must appear in `<title>` for the page to rank for branded comparison queries.
- Avoid duplicate H1s across comparison and alternatives pages for the same subject; they compete with each other.