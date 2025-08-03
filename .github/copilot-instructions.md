# Copilot Instructions

<!-- 
This file provides workspace-specific custom instructions to GitHub Copilot.
For more details, visit: https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot

IMPORTANT: This file works in conjunction with AGENTS.md in the root directory.
When making changes to project guidelines, technology stack, or development practices:
- Update both copilot-instructions.md (this file) AND AGENTS.md
- Keep the core information synchronized between both files
- copilot-instructions.md focuses on general GitHub Copilot guidance
- AGENTS.md provides detailed patterns and examples for autonomous AI agents
-->

This is a modern hackathon management system built with React, TypeScript, Vite, and Mantine UI. When working on tasks, please follow these comprehensive guidelines to ensure consistency and quality.

## Documentation Maintenance

### File Synchronization
- **copilot-instructions.md** (this file): General GitHub Copilot guidance and project overview
- **AGENTS.md** (root directory): Detailed AI agent instructions with code patterns and examples
- **Keep synchronized**: When updating project technology, standards, or guidelines, update both files
- **Update triggers**: New dependencies, architectural changes, coding standards updates, security policies

## Code Standards

### Required Before Each Commit
- Run `npm run lint` and `npm run build` before committing changes
- Ensure all TypeScript types are properly defined with no `any` usage
- Follow the existing file structure and naming conventions
- Write unit tests for new functionality using Vitest
- Update documentation when adding new features or APIs

### Development Flow
- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build for production: `npm run build`
- Run linting: `npm run lint`

### Copilot Environment Setup
- **Pre-configured Environment**: Copilot uses `.github/workflows/copilot-setup-steps.yml` for automatic environment setup
- **Dependencies**: Node.js 20, npm dependencies, Supabase CLI, and TypeScript are pre-installed
- **Build Validation**: Project is pre-compiled and linted before Copilot starts working
- **Cache Optimization**: Build artifacts and dependencies are cached for faster execution
- **Environment Variables**: Development environment variables are automatically configured

## Repository Structure
- `src/`: Main application source code
  - `components/`: Reusable UI components organized by feature
  - `pages/`: Page-level components and routes
  - `services/`: API services and data fetching logic
  - `store/`: Zustand state management stores
  - `utils/`: Utility functions and helpers
  - `types/`: TypeScript type definitions
  - `hooks/`: Custom React hooks
- `public/`: Static assets (images, icons, etc.)
- `supabase/`: Database migrations and configuration
- `.github/`: GitHub workflows and repository configuration

## Copilot Environment Customization

### Pre-installed Tools and Dependencies
The `.github/workflows/copilot-setup-steps.yml` file pre-configures Copilot's environment with:

- **Node.js 20**: Latest LTS version with npm caching
- **Dependencies**: All npm packages installed via `npm ci`
- **TypeScript**: Pre-compiled and validated
- **Linting**: ESLint validation completed
- **Supabase CLI**: Available for database operations
- **Environment Variables**: Development configuration pre-loaded
- **Build Cache**: Optimized caching for faster subsequent builds

### Environment Variables Available to Copilot
- `VITE_SUPABASE_URL`: Local Supabase instance URL
- `VITE_SUPABASE_ANON_KEY`: Anonymous access key for frontend
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations

### Performance Optimizations
- **Ubuntu Latest**: Standard GitHub Actions runner
- **30-minute timeout**: Reasonable time limit for complex operations
- **Dependency caching**: Node modules and build artifacts cached
- **Pre-validation**: Project structure and dependencies verified before work begins
## Project Overview
- **Frontend**: React 18 with TypeScript
- **UI Library**: Mantine v7 with modern components
- **Build Tool**: Vite for fast development and building
- **Styling**: Emotion React for CSS-in-JS
- **Routing**: React Router DOM for navigation
- **State Management**: Zustand for global state
- **Forms**: React Hook Form with Zod validation
- **API**: TanStack Query for server state management
- **Icons**: Tabler Icons React
- **Database**: Supabase with PostgreSQL
- **Authentication**: Supabase Auth with RLS policies
- **Deployment**: Modern cloud platforms (Vercel, Netlify)

## Database & Backend
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **RLS Policies**: Row Level Security for data access control
- **Real-time**: Live updates for collaborative features
- **Storage**: File uploads and media management
- **Migrations**: Version-controlled database schema changes

## Key Features
1. **Hackathon Management**
   - Create and manage hackathons
   - Set access keys for registration
   - Timeline and milestone tracking
   - Event configuration

2. **User Management**
   - User registration with access keys
   - Role-based access (Manager, Participant)
   - Profile management

3. **Team Management**
   - Team creation and joining
   - Team member management
   - Team collaboration tools

4. **Ideas Board**
   - Idea submission and management
   - Voting and commenting system
   - Idea categorization and tagging

5. **Modern UI/UX**
   - Responsive design with Mantine components
   - Dark/light theme support
   - Modern card layouts and animations
   - Dashboard with analytics

## Development Guidelines
- Use TypeScript for all components and utilities
- Follow Mantine design system patterns
- Use Zustand for global state management
- Implement proper error handling and loading states
- Use React Query for API data fetching
- Follow modern React patterns (hooks, functional components)
- Ensure responsive design for mobile and desktop
- Use proper TypeScript interfaces for data models

## Code Style
- Use functional components with hooks
- Prefer composition over inheritance
- Use proper TypeScript typing
- Follow consistent naming conventions
- Use ESLint and Prettier for code formatting

## Task Guidelines for AI Assistance

### Suitable Tasks for Copilot
- Bug fixes and error handling improvements
- UI component creation and styling with Mantine
- Form validation and data handling
- API integration and data fetching
- Unit test creation using Vitest
- Documentation updates
- Accessibility improvements
- Code refactoring within single files or components
- TypeScript type definitions and interface creation

### Tasks Requiring Human Review
- Database schema changes and migrations
- Authentication and security implementations
- Complex state management across multiple components
- Performance optimization requiring profiling
- Cross-component architectural decisions
- Production deployment configurations
- Third-party service integrations
- Business logic requiring domain knowledge

## Testing Requirements
- Write unit tests for new components using Vitest
- Use React Testing Library for component testing
- Test error states and edge cases
- Ensure accessibility compliance in tests
- Mock external API calls in tests

## Security Considerations
- Never commit API keys or sensitive credentials
- Use environment variables for configuration
- Implement proper input validation
- Follow Supabase RLS policies for data access
- Sanitize user inputs and prevent XSS attacks

## Performance Guidelines
- Use React.memo for expensive components
- Implement proper loading states with React Query
- Optimize images and assets
- Use code splitting for large components
- Monitor bundle size with Vite analyzer

---

## 📝 Documentation Maintenance Reminder

**When updating this file, also update AGENTS.md in the root directory:**
- Technology stack changes → Update both files
- New coding standards → Sync guidelines  
- Security policies → Keep security sections aligned
- Development workflow changes → Update commands and processes
- New dependencies or tools → Document in both locations

This ensures consistent guidance for both GitHub Copilot and autonomous AI agents.
