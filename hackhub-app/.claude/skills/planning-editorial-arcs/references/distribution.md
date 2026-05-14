# Distribution

## When to use
When deciding how and where content reaches users — in-app surfaces, notification channels, docs, or external changelog — and in what order.

## Patterns

**Cadence before channel** — decide timing first (pre-launch, at-launch, post-launch), then pick the channel. For a new feature in `src/pages/`, the sequence is: tooltip at launch → notification Day 0 → empty state +1 day.

**Single source of truth per surface** — docs live in `docs/`, in-app copy lives in the component. Never duplicate the same sentence across both; if it changes, it will drift.

**Notification throttling** — `NotificationCenter.tsx` is a high-attention surface. Reserve it for actionable events. Informational content belongs in tooltips or docs, not notifications.

## Pitfalls
Don't ship release notes before the feature is live in production. Changelog entries that describe features users can't yet access erode trust. Slot release note copy for Day 0, not pre-launch.