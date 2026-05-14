# Distribution

## When to use
When deciding where and how a prompt surface appears — which page, which component, which user segment, and how often.

## Patterns

### Phase-gated placement
HackHub prompts should map to hackathon lifecycle phases. Use `currentHackathon.status` to decide which surfaces are active.

| Phase | Appropriate surfaces |
|-------|---------------------|
| `draft` | Manager-only setup banners |
| `active` | Participant idea and team prompts |
| `voting` | Voting nudges, submission confirmations |
| `closed` | Result announcements, feedback prompts |

### Role-scoped rendering
Gate entire surfaces by role. Participants should never see manager review prompts — even as disabled states — because it creates confusion about permissions.

```tsx
if (user?.role !== 'manager') return null
```

### Frequency capping via localStorage
Persistent dismissal prevents re-showing prompts to users who've already seen and ignored them.

```tsx
const [seen, setSeen] = useLocalStorage({ key: 'voting-reminder-v1', defaultValue: false })
if (seen) return null
```

## Pitfalls
- Don't distribute the same message across multiple surfaces simultaneously (banner + modal + notification). Pick one channel per message.
- Version your localStorage keys (`-v1`, `-v2`) when copy changes — otherwise dismissed users never see updated prompts.