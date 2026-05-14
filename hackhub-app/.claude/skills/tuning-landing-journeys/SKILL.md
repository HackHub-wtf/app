---
name: tuning-landing-journeys
description: Improves landing page flow, visual hierarchy, and conversion paths for HackHub's React/TypeScript/Mantine frontend
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Tuning Landing Journeys Skill

Audits and improves HackHub's landing page and entry flows — focusing on visual hierarchy, CTA placement, copy clarity, and the path from first visit to first meaningful action (registration, hackathon join, team creation). Works within the existing Mantine 8.x component system and React Router 7.x navigation structure.

## Quick Start

1. Read `src/pages/Home.tsx` and any landing-adjacent pages (`Login.tsx`, `Hackathons.tsx`)
2. Trace the entry routes in `src/App.tsx` to map what a new visitor sees first
3. Identify the primary CTA and check whether it's above the fold, visually dominant, and leads to a low-friction next step
4. Check `src/components/Layout/` for header/sidebar elements that compete with or support conversion
5. Apply changes using Mantine primitives (`Title`, `Text`, `Button`, `Stack`, `Group`, `Container`) with correct size/weight hierarchy

## Key Concepts

**Visual hierarchy** — Use Mantine's `Title` order (`order={1}` through `order={3}`), `Text` size/weight props, and whitespace (`Stack gap`, `Container size`) to guide eye flow from headline → value prop → CTA.

**Primary CTA** — One dominant action per screen. Use `Button` with `size="lg"` and a filled variant for the primary action. Secondary actions get `variant="subtle"` or `variant="outline"`.

**Friction audit** — Count the steps between landing and first value. Registration → onboarding → first hackathon join should be at most 3 decisions. Reduce form fields, pre-fill where possible, defer optional data collection.

**Route flow** — Landing → `/hackathons` (browse) → `/hackathons/:id` (detail) → join/register is the standard conversion funnel. Ensure each page has a clear forward action and no dead ends.

**Social proof placement** — Participant counts, active hackathons, and team stats should appear near CTAs, not at page bottom.

## Common Patterns

**Reordering hero content for scannability**
```tsx
<Container size="md">
  <Stack gap="xl" align="center" ta="center">
    <Title order={1}>Run better hackathons</Title>
    <Text size="lg" c="dimmed" maw={540}>
      HackHub handles teams, ideas, and voting — so you can focus on the event.
    </Text>
    <Button size="lg" component={Link} to="/hackathons">
      Browse hackathons
    </Button>
  </Stack>
</Container>
```

**Reducing signup friction — progressive disclosure**
```tsx
// Collect only email + password on first step
// Defer display name, avatar, org to post-login onboarding
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
```

**CTA hierarchy in list pages**
```tsx
// Primary: join/create action
<Button size="md">Join hackathon</Button>
// Secondary: learn more
<Button variant="subtle" size="md">View details</Button>
```

**Anchoring stats near CTAs**
```tsx
<Group gap="xl" justify="center">
  <Stat label="Active hackathons" value={activeCount} />
  <Stat label="Teams formed" value={teamCount} />
</Group>
<Button size="lg" mt="lg">Get started</Button>
```

**Checking route dead ends**
```bash
grep -r "useNavigate\|Link to" src/pages/ --include="*.tsx" | grep -v "return\|back"
```
Use this to find pages that don't offer a clear forward navigation path.