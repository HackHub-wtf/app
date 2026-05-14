# Form Validation with Zod

## When to use
Define all form validation as a Zod schema. Never duplicate rules in both the schema and component-level logic.

### Schema definition and type inference
```typescript
import { z } from 'zod'

const ideaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().min(10, 'Too short'),
  teamId: z.string().uuid('Select a team'),
  tags: z.array(z.string()).max(5, 'Max 5 tags')
})

type IdeaFormValues = z.infer<typeof ideaSchema>
```

### Wiring the resolver
```typescript
const form = useForm<IdeaFormValues>({
  resolver: zodResolver(ideaSchema),
  defaultValues: { title: '', description: '', teamId: '', tags: [] }
})
```

### Conditional/dependent fields with `superRefine`
```typescript
const schema = z.object({
  projectType: z.enum(['internal', 'external']),
  repoUrl: z.string().optional()
}).superRefine((val, ctx) => {
  if (val.projectType === 'external' && !val.repoUrl) {
    ctx.addIssue({ code: 'custom', path: ['repoUrl'], message: 'Required for external projects' })
  }
})
```

## Pitfalls
- Zod 4.x changed some APIs from Zod 3.x — `z.string().nonempty()` is replaced by `z.string().min(1)`. Use `min(1)` consistently.