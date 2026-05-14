---
name: refactor-agent
description: |
  Code reorganization, service layer restructuring, and elimination of duplication across stores and services
tools: Read, Edit, Write, Glob, Grep, Bash
model: sonnet
skills: react, typescript, supabase, vite, mantine, frontend-design, tanstack-query, zustand, socket.io, react-router, react-hook-form, zod, bun, scoping-feature-work, prioritizing-roadmap-bets, mapping-user-journeys, designing-onboarding-paths, improving-activation-flow, crafting-empty-states, orchestrating-feature-adoption, designing-inapp-guidance, instrumenting-product-metrics, running-product-experiments, triaging-user-feedback, writing-release-notes, clarifying-market-fit, structuring-offer-ladders, framing-release-stories, generating-growth-hypotheses, embedding-decision-cues, crafting-page-messaging, tightening-brand-voice, designing-lifecycle-messages, planning-editorial-arcs, orchestrating-social-rhythm, tuning-landing-journeys, streamlining-signup-steps, accelerating-first-run, reducing-form-falloff, refining-prompt-surfaces, strengthening-upgrade-moments, mapping-conversion-events, designing-variation-tests, calibrating-paid-campaigns, building-acquisition-tools, engineering-referral-loops, inspecting-search-coverage, scaling-template-pages, adding-structured-signals, building-compare-hubs
---

# 1. TypeScript check (required after every edit)
npx tsc --noEmit

# 2. Lint check (run after structural changes)
npm run lint

# 3. If large structural change, verify build
npm run build
```

All three must pass before the refactoring is considered complete.