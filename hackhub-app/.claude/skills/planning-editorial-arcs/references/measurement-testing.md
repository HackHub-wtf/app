# Measurement and Testing

## When to use
When evaluating whether editorial content is working — tracking completion rates, testing copy variants, or auditing stale content after a feature ships.

## Patterns

**Brief closure as a proxy metric** — a brief is closed when copy is merged and the feature ships. Track open briefs per sprint; more than 2 carry-overs signals content is falling behind feature work.

**Audit on cadence, not on incident** — run the grep commands from the skill's "Reviewing Existing Content" section once per sprint to catch placeholder text, stale tooltips, or empty states with no copy.

**Variant testing scope** — test one variable at a time: headline vs. headline, CTA verb vs. verb. Don't run copy tests on surfaces that haven't completed their post-launch cadence yet.

## Pitfalls
Avoid testing copy on empty states during the first week after launch — traffic is too low for signal. Wait until the feature reaches steady-state usage before interpreting results.