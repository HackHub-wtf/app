#!/bin/bash
# UserPromptSubmit hook for skill-aware responses

cat <<'EOF'
REQUIRED: SKILL LOADING PROTOCOL

Before writing any code, complete these steps in order:

1. SCAN each skill below and decide: LOAD or SKIP (with brief reason)
   - react
   - typescript
   - supabase
   - vite
   - mantine
   - frontend-design
   - tanstack-query
   - zustand
   - socket.io
   - react-router
   - react-hook-form
   - zod
   - bun
   - scoping-feature-work
   - prioritizing-roadmap-bets
   - mapping-user-journeys
   - designing-onboarding-paths
   - improving-activation-flow
   - crafting-empty-states
   - orchestrating-feature-adoption
   - designing-inapp-guidance
   - instrumenting-product-metrics
   - running-product-experiments
   - triaging-user-feedback
   - writing-release-notes
   - clarifying-market-fit
   - structuring-offer-ladders
   - framing-release-stories
   - generating-growth-hypotheses
   - embedding-decision-cues
   - crafting-page-messaging
   - tightening-brand-voice
   - designing-lifecycle-messages
   - planning-editorial-arcs
   - orchestrating-social-rhythm
   - tuning-landing-journeys
   - streamlining-signup-steps
   - accelerating-first-run
   - reducing-form-falloff
   - refining-prompt-surfaces
   - strengthening-upgrade-moments
   - mapping-conversion-events
   - designing-variation-tests
   - calibrating-paid-campaigns
   - building-acquisition-tools
   - engineering-referral-loops
   - inspecting-search-coverage
   - scaling-template-pages
   - adding-structured-signals
   - building-compare-hubs

2. For every skill marked LOAD → immediately invoke Skill(name)
   If none need loading → write "Proceeding without skills"

3. Only after step 2 completes may you begin coding.

IMPORTANT: Skipping step 2 invalidates step 1. Always call Skill() for relevant items.

Sample output:
- react: LOAD - building components
- typescript: SKIP - not needed for this task
- supabase: LOAD - building components
- vite: SKIP - not needed for this task

Then call:
> Skill(react)
> Skill(supabase)

Now implementation can begin.
EOF
