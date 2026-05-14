# Content Copy

## When to use
Apply when writing headlines, CTA labels, placeholder text, empty states, and success messages for acquisition pages and lead magnets.

## Patterns

**Outcome-led headlines**
Lead with what the user gets, not what the tool does.
```
✓ "Find the right team size for your hackathon in 30 seconds"
✗ "Hackathon Team Size Calculator"
```

**CTA labels that name the reward**
```typescript
// ✓ Specific
<Button>Send me the planning checklist</Button>

// ✗ Generic
<Button>Submit</Button>
```

**Placeholder copy as micro-guidance**
Use `placeholder` on Mantine inputs to reduce blank-page anxiety and set format expectations.
```typescript
<TextInput
  label="Hackathon name"
  placeholder="e.g. Spring Innovation Sprint 2026"
/>
<NumberInput
  label="Expected participants"
  placeholder="e.g. 80"
/>
```

## Pitfalls
- Avoid "leverage", "streamline", "empower", or "seamless" — they read as filler and reduce credibility.
- Error messages must say what to fix, not just that something is wrong: "Enter a valid email" beats "Invalid input".