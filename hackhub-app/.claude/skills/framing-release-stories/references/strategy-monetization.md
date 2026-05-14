# Strategy & Monetization

## When to use
When a feature release has implications for how HackHub is positioned, priced, or differentiated — typically features that affect admin-level configuration or multi-organization use cases.

## Patterns

**Map to user roles with purchasing power.** In HackHub, Hackathon Managers and Admins make platform adoption decisions. When a feature release strengthens their workflow (e.g., flexible voting criteria, custom scoring), frame the release story around manager-level outcomes, not participant-level convenience.

**Identify tier differentiation signals.** Features that touch `src/utils/permissions.ts` role checks or organization-level config in `src/utils/organizations.ts` are natural candidates for plan-level gating. Note in the release story if a feature is currently ungated but has obvious premium differentiation potential.

**Competitive positioning in the narrative.** If the feature closes a gap with generic tools (e.g., replacing a spreadsheet-based scoring process), name the displacement explicitly in the narrative paragraph. "Teams no longer need to export to a spreadsheet to score ideas" is a positioning statement, not just a feature description.

## Pitfalls
Avoid overpromising on features that are partially implemented. Before writing a positioning claim, grep for `TODO`, `FIXME`, or `// temporary` in the relevant component and service files. Unfinished edges in the code become support escalations if the release story oversells the capability.