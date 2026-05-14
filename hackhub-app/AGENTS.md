# AI Agent Instructions

<!-- 
This file provides specific instructions for AI coding agents working on this repository.
It complements copilot-instructions.md with agent-specific guidance and best practices.

IMPORTANT: This file works in conjunction with .github/copilot-instructions.md.
When making changes to project guidelines, technology stack, or development practices:
- Update both AGENTS.md (this file) AND .github/copilot-instructions.md
- Keep the core information synchronized between both files
- AGENTS.md provides detailed patterns and examples for autonomous AI agents
- copilot-instructions.md focuses on general GitHub Copilot guidance
-->

## Project Context

This is a **modern hackathon management system** built with React, TypeScript, Vite, and Mantine UI. As an AI agent, you are working on a production-ready application that handles user authentication, team collaboration, and event management.

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Mantine v7 with Emotion React
- **State**: Zustand (global) + TanStack Query (server state)
- **Backend**: Supabase (PostgreSQL + Auth + RLS + Real-time)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel/Netlify

## Agent Task Classification

### ✅ Recommended Tasks for AI Agents

**High Success Rate Tasks:**
- Bug fixes and error handling improvements
- UI component creation using Mantine design system
- Form validation implementation with Zod schemas
- API service methods and data fetching logic
- Unit test creation with Vitest and React Testing Library
- TypeScript type definitions and interfaces
- Accessibility improvements (ARIA labels, keyboard navigation)
- Code refactoring within single components
- Documentation updates and code comments

**Medium Complexity Tasks:**
- Component integration and prop typing
- Custom hooks development
- Zustand store enhancements
- React Query integration for new endpoints
- CSS-in-JS styling with Emotion
- Error boundary implementations
- Loading state management

### ⚠️ Tasks Requiring Human Oversight

**Complex/Sensitive Tasks:**
- Database schema changes and Supabase migrations
- Authentication flows and security implementations
- Row Level Security (RLS) policy modifications
- Complex state management across multiple components
- Performance optimization requiring profiling
- Cross-component architectural decisions
- Production deployment configurations
- Business logic requiring domain knowledge

**Critical/Security Tasks:**
- Environment variable and secrets management
- Authentication token handling
- Data validation for security-sensitive operations
- File upload and storage configurations
- Real-time subscription management

## Development Workflow

### Pre-Commit Requirements
```bash
npm run lint          # ESLint + Prettier
npm run build         # TypeScript compilation via build
```

### Development Commands
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
```

### Copilot Environment Configuration
The `.github/workflows/copilot-setup-steps.yml` file ensures that when Copilot starts working, it has:

- **Pre-installed Dependencies**: All npm packages via `npm ci`
- **Validated Build**: TypeScript compilation and linting checks passed
- **Supabase CLI**: Available for database operations and migrations
- **Environment Variables**: Development configuration pre-loaded
- **Cached Artifacts**: Build outputs and dependencies cached for performance
- **Project Validation**: File structure and configuration verified

This means Copilot can immediately start working on tasks without spending time on setup.

## Branching Convention

### Required Naming Pattern
All branches must follow these patterns:
- **`feature/<description>`** - For new features and enhancements
- **`fix/<description>`** - For bug fixes and corrections

### Branch Naming Rules
- Use lowercase letters only
- Use hyphens (-) to separate words in descriptions
- Keep descriptions meaningful but concise (3-50 characters)
- Examples: `feature/user-auth`, `fix/login-validation`

### Automated Enforcement
- **GitHub Actions**: `.github/workflows/branch-naming.yml` validates branch names on pull requests
- **Husky Git Hooks**: Automatic installation via npm, pre-commit warnings and pre-push blocking
- **Protected Branches**: `main`, `master`, `develop` are exempt from naming convention
- **Zero Setup**: Hooks install automatically when developers run `npm install`
- **Multi-layered**: Both local hooks and CI checks prevent invalid branch names

### For AI Agents
When creating branches or suggesting branch names, always follow this convention:
```bash
# For new features
git checkout -b feature/feature-name

# For bug fixes  
git checkout -b fix/bug-description
```

## Code Standards for AI Agents

### TypeScript Best Practices
- **Always use strict typing** - no `any` types unless absolutely necessary
- **Define interfaces** for all props, API responses, and data structures
- **Use type guards** for runtime type checking
- **Leverage utility types** (Pick, Omit, Partial) for type transformations

### React Patterns
- **Functional components only** - no class components
- **Custom hooks** for reusable logic
- **Proper dependency arrays** in useEffect and useCallback
- **Error boundaries** for component error handling
- **React.memo** for performance optimization when needed

### Mantine UI Guidelines
- **Use Mantine components** instead of native HTML elements
- **Follow Mantine theming** for colors, spacing, and typography
- **Responsive design** with Mantine's responsive props
- **Accessibility** - leverage Mantine's built-in accessibility features

### Supabase Integration
- **RLS policies** - understand and respect Row Level Security
- **Type safety** - use generated types from Supabase
- **Error handling** - proper error boundaries for database operations
- **Real-time** - implement optimistic updates where appropriate

## Agent Environment Capabilities

### Available Tools and Commands
Your environment includes these pre-configured tools:
- **Node.js 20**: For running JavaScript/TypeScript
- **npm**: Package management and script execution
- **TypeScript Compiler**: For type checking and compilation
- **ESLint**: Code linting and formatting
- **Vite**: Build tool for development and production
- **Supabase CLI**: Database operations and migrations

### Development Environment
- **Pre-built Project**: Dependencies installed, TypeScript compiled, linting passed
- **Environment Variables**: Development configuration automatically set
- **Cached Dependencies**: Faster subsequent operations
- **Validated Structure**: Project structure verified before you start

### Capabilities You Have
- Build and compile the project (`npm run build`)
- Run linting and fix code style issues (`npm run lint`)
- Create and modify files throughout the project
- Install additional dependencies if needed

### What This Means for Your Work
- **Start immediately**: No setup time required
- **Full project context**: Access to all source code and configuration
- **Validation tools**: Can verify your changes work correctly
- **Database access**: Can work with migrations and schema if needed

## File Organization

### Component Structure
```
src/components/
├── Layout/           # App shell components
├── Forms/           # Form components and validation
├── UI/              # Generic UI components
└── Feature/         # Feature-specific components
```

### Service Layer
```
src/services/        # API abstraction layer
├── authService.ts   # Authentication operations
├── hackathonService.ts # Hackathon CRUD
├── teamService.ts   # Team management
└── types.ts         # Service-related types
```

### State Management
```
src/store/           # Zustand stores
├── authStore.ts     # Authentication state
├── hackathonStore.ts # Hackathon state
└── uiStore.ts       # UI state (modals, notifications)
```

## Common Patterns and Examples

### API Service Pattern
```typescript
// Example: Create a new service method
export const HackathonService = {
  async getHackathons(): Promise<Hackathon[]> {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data || []
  }
}
```

### Form Component Pattern
```typescript
// Example: Form with Mantine + React Hook Form + Zod
interface CreateTeamFormData {
  name: string
  description: string
}

const createTeamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional()
})

export function CreateTeamForm() {
  const form = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema)
  })
  
  // Implementation...
}
```

### Store Pattern
```typescript
// Example: Zustand store with TypeScript
interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  login: async (email, password) => {
    // Implementation...
  },
  logout: async () => {
    // Implementation...
  }
}))
```

## Error Handling Guidelines

### API Error Handling
- Use consistent error response types
- Implement proper error boundaries
- Show user-friendly error messages
- Log errors for debugging (development only)

### Form Validation
- Use Zod schemas for validation
- Provide clear field-level error messages
- Handle async validation appropriately
- Implement proper loading states

## Testing Guidelines for AI Agents

### Unit Test Structure
```typescript
// Example: Component test pattern
describe('CreateTeamForm', () => {
  it('should validate required fields', async () => {
    render(<CreateTeamForm />)
    
    const submitButton = screen.getByRole('button', { name: /create team/i })
    await userEvent.click(submitButton)
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  })
})
```

### Mock Patterns
- Mock Supabase client for database operations
- Mock authentication state for protected components
- Use MSW (Mock Service Worker) for API mocking
- Mock external dependencies and services

## Security Considerations

### Data Protection
- Never expose sensitive data in client-side code
- Use environment variables for configuration
- Implement proper input validation and sanitization
- Follow Supabase RLS policies strictly

### Authentication
- Handle authentication state properly
- Implement proper session management
- Use secure token storage
- Validate user permissions on sensitive operations

## Performance Optimization

### React Performance
- Use React.memo for expensive components
- Implement proper dependency arrays
- Avoid unnecessary re-renders
- Use code splitting for large components

### Bundle Optimization
- Monitor bundle size with Vite analyzer
- Implement proper tree shaking
- Use dynamic imports for code splitting
- Optimize images and static assets

## Communication and Documentation

### Code Comments
- Document complex business logic
- Explain non-obvious TypeScript patterns
- Add JSDoc for public APIs
- Include TODO comments for future improvements

### Commit Messages
- Use conventional commit format
- Include clear descriptions of changes
- Reference issues and pull requests
- Explain the reasoning behind changes

## Agent Success Metrics

### Quality Indicators
- All TypeScript types properly defined
- Tests pass and provide good coverage
- Code follows established patterns
- No ESLint or TypeScript errors
- Accessibility requirements met
- Performance considerations addressed

### Delivery Expectations
- Working, tested code
- Proper error handling
- Clear documentation
- Consistent with existing codebase
- Security best practices followed

---

## 📝 Documentation Maintenance Reminder

**When updating this file, also update .github/copilot-instructions.md:**
- Technology stack changes → Update both files
- New coding standards → Sync guidelines  
- Security policies → Keep security sections aligned
- Development workflow changes → Update commands and processes
- New dependencies or tools → Document in both locations

This ensures consistent guidance for both GitHub Copilot and autonomous AI agents.
