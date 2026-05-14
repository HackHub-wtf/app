# Content Searchability

## When to use
When verifying that text content rendered by Mantine components and Markdown editors is discoverable by in-page search (browser Ctrl+F) and readable by screen readers and crawlers.

## Patterns

**Markdown content rendered as DOM text:**
```tsx
// Good — text is in the DOM
import ReactMarkdown from 'react-markdown'
<ReactMarkdown>{idea.description}</ReactMarkdown>

// Bad — stored as raw markdown string in a hidden element
<span style={{ display: 'none' }}>{idea.description}</span>
```

**Mantine Cards and Accordions — verify content is always mounted:**
```tsx
// Accordion items are only in the DOM when opened by default
// Use keepMounted to ensure content is always present
<Accordion.Item keepMounted value="details">
  <Accordion.Panel>{idea.fullDescription}</Accordion.Panel>
</Accordion.Item>
```

**Audit Tabler icon-only buttons for accessible labels:**
```bash
grep -r "IconSearch\|IconFilter\|aria-label" src/components/ src/pages/
```
Icon-only controls need `aria-label` or a visually hidden label to be discoverable by assistive search.

## Pitfalls
- `<TypographyStylesProvider>` wraps markdown output in Mantine but does not add semantic roles — headings inside markdown still need a correct `h1`/`h2` hierarchy to be useful for in-page navigation.