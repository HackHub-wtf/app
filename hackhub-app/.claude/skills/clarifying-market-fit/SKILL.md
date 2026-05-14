---
name: clarifying-market-fit
description: Aligns ICP, positioning, and value narrative for on-page messaging in HackHub
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Clarifying Market Fit Skill

Audits and sharpens HackHub's on-page messaging by aligning the ideal customer profile (ICP), product positioning, and value narrative across UI copy, empty states, onboarding flows, and page-level content. Surfaces gaps where the product says one thing and the interface implies another.

## Quick Start

Invoke when:
- Page headlines or descriptions feel generic or misaligned with who actually uses HackHub
- Onboarding copy doesn't speak to a specific role (hackathon manager vs. participant)
- Value propositions buried in UI don't match the top-level pitch
- Empty states, tooltips, or CTA labels don't reinforce why someone would act

Trigger: `/clarifying-market-fit [page or component path]`

## Key Concepts

**ICP for HackHub** — two distinct users with different jobs:
- *Hackathon managers*: need control, visibility, and configuration (events, teams, voting criteria)
- *Participants*: need frictionless onboarding, team discovery, and idea submission

**Positioning** — HackHub is a structured collaboration platform, not a generic project tool. Messaging should emphasize the full lifecycle (register → team up → submit → evaluate), not just individual features.

**Value narrative** — the sequence of realized value a new user experiences. Each page should answer: "what can I do here, and why does it matter to me right now?"

## Common Patterns

**Audit a page for ICP alignment**
Read the page component and list every user-facing string. Flag any copy that:
- Uses passive or tool-centric language ("ideas are submitted here") instead of outcome language ("pitch your idea to judges")
- Doesn't distinguish manager vs. participant context
- Treats optional actions as mandatory or hides high-value affordances

**Rewrite empty states**
Empty states in `src/components/` and `src/pages/` are high-leverage. A weak empty state says "No teams yet." A strong one says "You haven't joined a team — find one that matches your skills or start your own."

**Align CTAs to role**
Check button labels and `title` props against the user's role (via `useAuthStore` and `src/utils/permissions.ts`). A manager's primary action on the Teams page differs from a participant's — both shouldn't see the same CTA.

**Check onboarding copy**
`src/pages/Home.tsx` and the login/signup flow set first impressions. The value narrative should be concrete: what happens after signup, what the first meaningful action is, and why it matters.

**Validate positioning in headers**
Page-level headings (`<Title>`, `<Text>`) in `src/pages/` should reinforce positioning. If a heading just mirrors the nav label (e.g., "Hackathons"), it's a missed opportunity to orient the user within the product story.