# 🤝 Contributing to HackHub

Thank you for your interest in contributing to HackHub! This document provides guidelines and information for contributors to help make the development process smooth and collaborative.

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Contribution Types](#contribution-types)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)
7. [Testing Guidelines](#testing-guidelines)
8. [Documentation Standards](#documentation-standards)
9. [Issue Guidelines](#issue-guidelines)
10. [Review Process](#review-process)
11. [Community Guidelines](#community-guidelines)

## 📜 Code of Conduct

### Our Commitment

We are committed to providing a welcoming and inspiring community for all. Please read and follow our code of conduct:

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Inclusive**: Welcome people of all backgrounds and identities
- **Be Collaborative**: Work together constructively
- **Be Professional**: Maintain professional communication
- **Be Supportive**: Help others learn and grow

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing private information without permission
- Any conduct that could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 24.1.0+** installed
- **Git** configured with your GitHub account
- **Basic knowledge** of React, TypeScript, and modern web development
- **Supabase** familiarity (helpful but not required)

### Initial Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/hackathon.git
   cd hackathon
   ```

2. **Set Up Development Environment**
   ```bash
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start Local Development**
   ```bash
   # Start Supabase
   npm run supabase:start
   
   # Initialize database
   npm run db:setup
   
   # Start development server
   npm run dev
   ```

4. **Verify Setup**
   ```bash
   # Run tests
   npm run test:run
   
   # Check linting
   npm run lint
   ```

## 🔄 Development Workflow

### Branch Strategy

We use a **feature branch workflow**:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - Individual feature branches
- `hotfix/issue-description` - Critical bug fixes
- `docs/documentation-update` - Documentation changes

### Creating a Feature Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Start developing...
```

### Making Changes

1. **Write Code**: Follow our coding standards
2. **Add Tests**: Ensure your changes are tested
3. **Update Documentation**: Keep docs current
4. **Commit Changes**: Use conventional commit messages

```bash
# Stage your changes
git add .

# Commit with conventional message
git commit -m "feat: add team collaboration features"

# Push to your fork
git push origin feature/your-feature-name
```

## 🎯 Contribution Types

### 🐛 Bug Fixes

- Fix reported issues
- Include tests that verify the fix
- Update documentation if needed
- Reference the issue number in your PR

### ✨ New Features

- Implement new functionality
- Follow existing patterns and conventions
- Add comprehensive tests
- Update relevant documentation
- Consider backward compatibility

### 📚 Documentation

- Improve existing documentation
- Add missing documentation
- Fix typos and formatting
- Update screenshots when UI changes
- Ensure documentation stays current

### 🧪 Testing

- Add missing test coverage
- Improve existing tests
- Add integration or E2E tests
- Performance testing improvements

### 🎨 UI/UX Improvements

- Follow Mantine design system
- Ensure responsive design
- Maintain accessibility standards
- Test across different devices/browsers

## 📝 Pull Request Process

### Before Creating a PR

1. **Sync with main**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature
   git rebase main
   ```

2. **Run quality checks**:
   ```bash
   npm run lint          # Check code style
   npm run type-check    # TypeScript validation
   npm run test:run      # Unit tests
   npm run test:e2e      # E2E tests
   ```

3. **Update documentation**:
   - Update relevant docs in `docs/`
   - Add screenshots if UI changed
   - Update API documentation if needed

### Creating the PR

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub**:
   - Use our PR template
   - Provide clear title and description
   - Link related issues
   - Add screenshots for UI changes
   - Request appropriate reviewers

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Include screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] Tests added for new functionality
- [ ] All tests pass
- [ ] No breaking changes introduced
```

## 💻 Coding Standards

### TypeScript Guidelines

```typescript
// Use explicit types when beneficial
interface User {
  id: string;
  email: string;
  name: string;
  role: 'manager' | 'participant';
}

// Use functional components with proper typing
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  // Component implementation
};
```

### React Patterns

```typescript
// Use hooks properly
const useHackathon = (id: string) => {
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Effect implementation
  }, [id]);
  
  return { hackathon, loading };
};

// Prefer composition over prop drilling
const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Context implementation
};
```

### Naming Conventions

- **Components**: PascalCase (`UserCard`, `HackathonList`)
- **Files**: kebab-case (`user-card.tsx`, `hackathon-list.tsx`)
- **Variables**: camelCase (`userName`, `hackathonId`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_TEAM_SIZE`)
- **Types/Interfaces**: PascalCase (`User`, `HackathonData`)

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   └── feature/        # Feature-specific components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── services/           # API and external services
└── assets/             # Static assets
```

### .gitignore Best Practices

Our comprehensive `.gitignore` file covers various categories. When contributing:

#### ✅ What Should Be Ignored
- **Environment files**: `.env*`, configuration files with secrets
- **Build artifacts**: `dist/`, `build/`, compiled files
- **Dependencies**: `node_modules/`, package lock files (except the one your team uses)
- **IDE files**: `.vscode/*` (except shared settings), `.idea/`
- **OS files**: `.DS_Store`, `Thumbs.db`
- **Testing artifacts**: `coverage/`, `playwright-report/`
- **Temporary files**: `*.tmp`, `.cache/`, log files
- **Personal files**: `NOTES.md`, `TODO.md`, personal configurations

#### ❌ What Should NOT Be Ignored
- **Source code**: All `.js`, `.ts`, `.tsx`, `.css` files
- **Configuration**: Shared VS Code settings, ESLint/Prettier configs
- **Documentation**: `README.md`, docs, license files
- **Package definitions**: `package.json`, deployment configs
- **Shared tools**: Shared development scripts and tools

#### 🔧 Adding New Ignore Patterns
When adding new patterns to `.gitignore`:

```bash
# Add the pattern to .gitignore
echo "new-pattern/" >> .gitignore

# If files are already tracked, remove them from tracking
git rm -r --cached new-pattern/

# Commit the changes
git add .gitignore
git commit -m "chore: add new-pattern to .gitignore"
```

#### 📂 Special Considerations

- **Screenshots**: Project screenshots are tracked, but test screenshots are ignored
- **Database files**: Local development databases are ignored, but schema/migrations are tracked
- **Certificates**: All certificate files are ignored for security
- **Lock files**: Choose one package manager and ignore others' lock files

## 🧪 Testing Guidelines

### Test Types

1. **Unit Tests** (Vitest)
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { render, screen } from '@testing-library/react';
   import { UserCard } from './user-card';
   
   describe('UserCard', () => {
     it('displays user information correctly', () => {
       const user = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'participant' };
       render(<UserCard user={user} />);
       
       expect(screen.getByText('John Doe')).toBeInTheDocument();
       expect(screen.getByText('john@example.com')).toBeInTheDocument();
     });
   });
   ```

2. **Integration Tests**
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { render, screen, waitFor } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import { HackathonForm } from './hackathon-form';
   
   describe('HackathonForm Integration', () => {
     it('creates hackathon successfully', async () => {
       const user = userEvent.setup();
       const onSubmit = vi.fn();
       
       render(<HackathonForm onSubmit={onSubmit} />);
       
       await user.type(screen.getByLabelText('Title'), 'Test Hackathon');
       await user.click(screen.getByRole('button', { name: 'Create' }));
       
       await waitFor(() => {
         expect(onSubmit).toHaveBeenCalledWith(
           expect.objectContaining({ title: 'Test Hackathon' })
         );
       });
     });
   });
   ```

3. **E2E Tests** (Playwright)
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test('manager can create hackathon', async ({ page }) => {
     await page.goto('/login');
     await page.fill('[data-testid="email"]', 'manager@example.com');
     await page.fill('[data-testid="password"]', 'password123');
     await page.click('[data-testid="login-button"]');
     
     await page.click('[data-testid="create-hackathon"]');
     await page.fill('[data-testid="hackathon-title"]', 'Test Hackathon');
     await page.click('[data-testid="submit-hackathon"]');
     
     await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
   });
   ```

### Testing Best Practices

- **Test Behavior, Not Implementation**: Focus on what the user sees and does
- **Use Data Test IDs**: Add `data-testid` attributes for reliable element selection
- **Mock External Dependencies**: Use mocks for API calls and external services
- **Test Edge Cases**: Include error states, loading states, and boundary conditions
- **Keep Tests Focused**: One test should verify one specific behavior

## 📖 Documentation Standards

### Code Documentation

```typescript
/**
 * Creates a new hackathon with the provided information.
 * 
 * @param hackathonData - The hackathon information to create
 * @param creatorId - The ID of the user creating the hackathon
 * @returns Promise resolving to the created hackathon
 * 
 * @throws {ValidationError} When hackathon data is invalid
 * @throws {AuthError} When user lacks permission to create hackathons
 * 
 * @example
 * ```typescript
 * const hackathon = await createHackathon({
 *   title: 'Innovation Challenge',
 *   description: 'A 48-hour coding challenge',
 *   startDate: new Date('2025-08-01'),
 *   endDate: new Date('2025-08-03')
 * }, 'user-123');
 * ```
 */
export async function createHackathon(
  hackathonData: CreateHackathonRequest,
  creatorId: string
): Promise<Hackathon> {
  // Implementation
}
```

### README Updates

When adding new features, update the relevant README sections:

- Add new prerequisites if needed
- Update setup instructions
- Document new environment variables
- Add usage examples

### Screenshot Documentation

When UI changes affect existing screenshots:

1. **Take New Screenshots**: Follow naming conventions
2. **Update Documentation**: Replace outdated screenshot references
3. **Update SCREENSHOTS.md**: Add descriptions for new screenshots

## 🐛 Issue Guidelines

### Reporting Bugs

Use our bug report template:

```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 1.0.0]
- Node.js version: [e.g. 24.1.0]

**Additional Context**
Any other context about the problem.
```

### Feature Requests

Use our feature request template:

```markdown
**Feature Description**
A clear description of what you want to happen.

**Problem Statement**
Describe the problem this feature would solve.

**Proposed Solution**
Describe the solution you'd like to see.

**Alternatives Considered**
Describe any alternative solutions you've considered.

**Additional Context**
Any other context, mockups, or examples.
```

## 👀 Review Process

### Review Criteria

PRs are reviewed for:

- **Functionality**: Does it work as intended?
- **Code Quality**: Is it readable, maintainable, and efficient?
- **Testing**: Are there adequate tests?
- **Documentation**: Is documentation updated?
- **Security**: Are there any security concerns?
- **Performance**: Does it impact performance?
- **Accessibility**: Is it accessible to all users?

### Review Timeline

- **Small Changes**: 1-2 business days
- **Medium Changes**: 2-4 business days
- **Large Changes**: 4-7 business days
- **Urgent Fixes**: Same day (if critical)

### Getting Your PR Reviewed

1. **Request Reviewers**: Add appropriate team members
2. **Respond to Feedback**: Address comments promptly
3. **Make Changes**: Update code based on feedback
4. **Re-request Review**: After making changes

## 🌟 Community Guidelines

### Getting Help

- **GitHub Discussions**: For questions and community support
- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: Check existing docs first
- **Stack Overflow**: Tag questions with `hackhub`

### Mentoring

We welcome new contributors! If you're new to open source:

- **Good First Issues**: Look for issues labeled `good first issue`
- **Mentorship**: Reach out to maintainers for guidance
- **Pair Programming**: Available for complex features
- **Code Review**: Learn from feedback on your PRs

### Recognition

Contributors are recognized through:

- **Contributors File**: Listed in project contributors
- **Release Notes**: Mentioned in release announcements
- **Community Highlights**: Featured in project updates
- **Swag**: Stickers and merchandise for regular contributors

## 🔄 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Schedule

- **Major Releases**: Quarterly
- **Minor Releases**: Monthly
- **Patch Releases**: As needed for critical fixes

## 📞 Contact

### Maintainers

- **Project Lead**: [@kinncj](https://github.com/kinncj)
- **Core Team**: See [MAINTAINERS.md](MAINTAINERS.md)

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Community discussions and Q&A
- **Email**: For security issues or sensitive matters

---

## 🙏 Thank You

Thank you for contributing to HackHub! Your contributions help make this platform better for hackathon organizers and participants worldwide.

**Happy coding! 🚀**
