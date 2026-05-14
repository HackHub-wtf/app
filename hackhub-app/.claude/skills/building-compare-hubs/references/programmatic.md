# Programmatic Reference — Compare Hubs

## When to use
When generating comparison combinations or alternatives lists programmatically — ranking by relevance, filtering candidates, or building sitemap entries.

## Patterns

**Client-side relevance scoring** — rank alternatives by shared tags or criteria count:
```tsx
function scoreRelevance(candidate: Hackathon, subject: Hackathon): number {
  const sharedTags = candidate.tags.filter(t => subject.tags.includes(t)).length
  const sizeDiff = Math.abs(candidate.maxTeamSize - subject.maxTeamSize)
  return sharedTags * 10 - sizeDiff
}

const alternatives = allHackathons
  .filter(h => h.slug !== slug)
  .sort((a, b) => scoreRelevance(b, subject) - scoreRelevance(a, subject))
  .slice(0, 9)
```

**Slug-pair generation for sitemaps** — produce canonical A/B pairs without duplicates:
```ts
const pairs: [string, string][] = []
for (let i = 0; i < slugs.length; i++)
  for (let j = i + 1; j < slugs.length; j++)
    pairs.push([slugs[i], slugs[j]])
```

**Route param validation** — verify slugs resolve before rendering the table:
```tsx
if (slugA === slugB) return <Navigate to={`/alternatives/${slugA}`} replace />
```

## Pitfalls
- Cap the alternatives list at 9 items (3×3 grid); beyond that users stop scanning and relevance drops sharply.
- Normalize slug order (alphabetical) in the URL so `/compare/a/b` and `/compare/b/a` don't create duplicate pages.