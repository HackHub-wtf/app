# Distribution

## When to use
When evaluating how users arrive at the landing page, what entry routes exist in `App.tsx`, and whether shared or linked URLs land users in the right context.

## Patterns

**Deep-link entry points**
Users arriving from shared hackathon URLs should land on `/hackathons/:id`, not on Home. Verify the route in `App.tsx` renders a detail page with a clear join CTA — not a blank state requiring navigation.

**Auth redirect preservation**
When an unauthenticated user hits a protected route, store the intended destination before redirecting to Login. After auth, return them to the original URL. This keeps externally shared links functional.

**Route dead-end check**
```bash
grep -r "useNavigate\|Link to" src/pages/ --include="*.tsx"
```
Any page without a forward navigation path is a distribution leak. Every page needs at least one explicit next step.

## Pitfalls
- Landing all traffic on Home regardless of entry URL forces extra navigation steps. Deep-link routes are conversion opportunities — don't waste them with generic redirects.