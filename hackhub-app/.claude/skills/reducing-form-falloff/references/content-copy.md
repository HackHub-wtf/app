# Content Copy

## When to use
Apply when writing or reviewing label text, placeholder text, helper text, error messages, and CTA copy inside HackHub forms and empty states.

## Patterns

### Error messages: say what to do, not what went wrong
```typescript
// Bad
'Invalid input'

// Good
'Enter a name between 2 and 50 characters'
```

### Placeholder text: show an example, not a restatement of the label
```typescript
<TextInput
  label="Team name"
  placeholder="e.g. Rocket Pandas"
  {...register('name')}
/>
```

### CTA copy: verb + outcome, not generic labels
```typescript
// Bad
<Button>Submit</Button>

// Good
<Button>Join Hackathon</Button>
<Button>Submit Idea</Button>
<Button>Create Team</Button>
```

## Pitfalls
Avoid placeholder text that disappears on focus for required fields — users forget what the field expects mid-entry. Use `description` prop on Mantine inputs for persistent hints.