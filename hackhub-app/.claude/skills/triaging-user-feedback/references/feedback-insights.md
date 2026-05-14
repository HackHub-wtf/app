# Feedback Insights Patterns

## When to use
Apply when processing a batch of feedback to identify themes, detect duplicate signals, or surface systemic issues that individual items obscure. Use before a sprint planning session or roadmap review.

## Patterns

**Grouping by affected layer**
Sort feedback items by the HackHub layer they touch (presentation, state, service, data, real-time). Items clustering in one layer signal a systemic gap — e.g., multiple "loading state missing" reports across pages point to a shared pattern problem, not individual bugs.

**Severity escalation**
Words like "broken", "crash", "never loads", "can't submit" override bucket assignment — move to quick-win urgency regardless of scope estimate. Track these separately from "nice to have" items. Grep commit history for related files: `git log --oneline -- src/pages/Ideas.tsx` to see recent churn that might explain the breakage.

**Detecting duplicate signals**
Before logging a new backlog item, check if a similar item exists. Two feedback items about "filtering ideas" and "searching ideas" may be the same underlying request. Consolidate into one backlog item with a note on the variant requests, rather than two separate tickets.

## Pitfalls
Resist the urge to immediately classify every item in a large batch. For items with ambiguous scope, mark them "needs investigation" and use Grep/Glob to read the affected file before finalizing the bucket. A wrong quick-win estimate wastes more time than a short investigation.