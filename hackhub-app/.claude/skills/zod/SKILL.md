---
name: zod
description: Validates schemas and infers types with Zod validation for HackHub's React/TypeScript frontend
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# Zod Skill

Handles schema definition, runtime validation, and TypeScript type inference using Zod 4.x across HackHub's service layer, form validation, and API boundary checks. Works alongside React Hook Form via `@hookform/resolvers/zod` for form schemas and validates external data from Supabase before it enters application state.

## Quick Start

```typescript
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const teamSchema = z.object({
  name: z.string().min(1).max(100),
  hackathonId: z.string().uuid(),
})

type TeamInput = z.infer<typeof teamSchema>

const form = useForm<TeamInput>({ resolver: zodResolver(teamSchema) })
```

## Key Concepts

**Type inference** — derive TypeScript types from schemas with `z.infer<typeof schema>`. Never duplicate type definitions by hand.

**Parse vs safeParse** — use `.parse()` inside service methods where a thrown error is acceptable; use `.safeParse()` at component boundaries where you need to handle failure without try/catch.

**Schema composition** — build complex schemas from primitives using `.merge()`, `.extend()`, `.pick()`, `.omit()`, and `.partial()` rather than redefining fields.

**Discriminated unions** — model variant shapes (e.g. different role payloads) with `z.discriminatedUnion('type', [...])` for exhaustive type narrowing.

## Common Patterns

**Service boundary validation**
```typescript
const ideaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10),
  teamId: z.string().uuid(),
  hackathonId: z.string().uuid(),
})

type IdeaInput = z.infer<typeof ideaSchema>

async function submitIdea(raw: unknown): Promise<Idea> {
  const input = ideaSchema.parse(raw)
  const { data, error } = await supabase.from('ideas').insert(input).select().single()
  if (error) throw new Error(error.message)
  return data
}
```

**React Hook Form integration**
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type LoginInput = z.infer<typeof loginSchema>

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })
}
```

**Safe parsing at API boundaries**
```typescript
const result = userSchema.safeParse(supabaseResponse)
if (!result.success) {
  console.error(result.error.flatten())
  return null
}
return result.data
```

**Optional and nullable fields**
```typescript
const profileSchema = z.object({
  displayName: z.string().min(1),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().max(500).optional(),
})
```

**Enum validation for roles**
```typescript
const userRoleSchema = z.enum(['admin', 'manager', 'participant'])
type UserRole = z.infer<typeof userRoleSchema>
```

**Reusable partial schemas for updates**
```typescript
const updateTeamSchema = teamSchema.partial().required({ id: true })
type UpdateTeamInput = z.infer<typeof updateTeamSchema>
```