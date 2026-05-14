---
name: planning-editorial-arcs
description: Defines content themes, briefs, and editorial cadence for HackHub's documentation, release notes, and in-app messaging
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Planning Editorial Arcs Skill

Helps structure the flow of content across HackHub's docs, release notes, onboarding copy, and in-app guidance. It maps themes to product phases, defines brief templates, and sets cadence so content ships consistently alongside features.

## Quick Start

1. Identify the surface: docs, release notes, onboarding, empty states, or in-app tooltips.
2. Map it to a product phase: activation, adoption, retention, or expansion.
3. Draft a brief using the template below.
4. Slot it into the cadence matrix against upcoming feature work.

## Key Concepts

**Content Surface** — where the content lives: `docs/`, in-app Mantine components, notification copy, or external changelog.

**Editorial Theme** — the narrative thread tying content together across a sprint or quarter. Example themes for HackHub:
- "Make your first hackathon real" (activation)
- "Your team, your workflow" (team collaboration)
- "From idea to submission" (idea lifecycle)
- "Organizers in control" (manager tooling)

**Brief** — a scoped content unit with: surface, theme, audience (participant / manager / admin), target action, word budget, and owner.

**Cadence** — when content ships relative to the feature: pre-launch (docs + tooltips), at launch (release notes + notifications), post-launch (empty states + follow-up nudges).

## Common Patterns

### Brief Template

```
Surface: [docs page | release note | tooltip | empty state | notification]
Theme: [theme name from arc]
Audience: [participant | manager | admin]
Target action: [what the user should do after reading]
Word budget: [e.g. 80 words]
Linked feature: [feature or page, e.g. src/pages/Ideas.tsx]
Due: [relative to feature ship date, e.g. -1 day]
```

### Cadence Matrix

| Phase      | Surface                        | Timing vs. ship |
|------------|-------------------------------|-----------------|
| Pre-launch | Docs update, tooltip copy      | -2 to -1 days   |
| At launch  | Release note, notification     | Day 0           |
| Post-launch| Empty state, onboarding nudge  | +1 to +3 days   |

### Theme-to-Feature Mapping

When a new page or component lands in `src/pages/` or `src/components/`, assign it to the nearest active theme:

- `Hackathons.tsx`, `Teams.tsx` → "Make your first hackathon real"
- `TeamChat.tsx`, `TeamVideoCall.tsx`, `TeamFileManager.tsx` → "Your team, your workflow"
- `Ideas.tsx`, `FlexibleVotingInterface.tsx` → "From idea to submission"
- `VotingCriteriaManager.tsx`, admin pages → "Organizers in control"

### Reviewing Existing Content

```bash
# Find all in-app copy surfaces
grep -r "placeholder\|description\|label\|tooltip" src/components --include="*.tsx" -l

# Find empty state components
grep -r "empty\|no data\|no results" src/pages src/components --include="*.tsx" -l

# Check docs coverage
ls docs/
```

### Scheduling Content Work

Treat content briefs like code tasks: one brief per surface per feature. Close a brief when the copy is merged and the linked feature ships. Carry unfinished briefs into the next sprint rather than shipping placeholder text.