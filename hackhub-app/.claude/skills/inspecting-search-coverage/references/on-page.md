# On-Page Search Coverage

## When to use
When checking whether routed pages in `src/pages/` render enough visible, structured text for users and crawlers to understand page content.

## Patterns

**Check for page titles and meta descriptions:**
```bash
grep -r "document\.title\|<title\|<meta name" src/pages/
```
Each page component should set `document.title` on mount. HackHub is a React SPA — there is no server-rendered `<head>`, so this is the only mechanism.

**Heading hierarchy audit:**
```bash
grep -rn "<h1\|<h2\|<Title\|<Text.*fw={700}" src/pages/
```
Every page needs a visible `<h1>` equivalent. In Mantine, this is typically `<Title order={1}>` or `<Text component="h1">`.

**Verify dynamic content is in the DOM, not behind interaction gates:**
```bash
grep -r "Accordion\|Collapse\|Modal\|Drawer" src/pages/
```
Content inside `<Collapse opened={false}>` or an unopened `<Modal>` is not in the DOM and is invisible to crawlers. Move critical text (hackathon names, idea titles) outside these gates.

## Pitfalls
- HackHub deploys to Cloudflare Pages as a static SPA — `<meta>` tags set by React only affect client-rendered views, not social previews or search snippets. If SEO matters, a prerender step or `_worker.js` edge injection is required.