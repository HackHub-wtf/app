# Contributing to Hackathon Management System

Thank you for contributing! This guide will help you understand our development workflow and branching conventions.

## 🌿 Branching Convention

We enforce a strict branching naming convention to maintain consistency and clarity.

### Required Naming Pattern

All branches must follow one of these patterns:

- **`feature/<description>`** - For new features
- **`fix/<description>`** - For bug fixes

### Examples of Valid Branch Names

✅ **Good Examples:**
```
feature/user-authentication
feature/dashboard-ui
feature/team-collaboration
feature/voting-system
fix/login-validation
fix/memory-leak
fix/ui-responsive-issues
```

❌ **Invalid Examples:**
```
user-auth               # Missing prefix
feature-user-auth       # Wrong separator
feature/                # Missing description
FEATURE/user-auth       # Wrong case
hotfix/critical-bug     # Wrong prefix (use 'fix/')
```

### Naming Guidelines

1. **Use lowercase letters only**
2. **Use hyphens (-) to separate words**
3. **Use underscores (_) sparingly**
4. **Keep descriptions meaningful but concise**
5. **Maximum 50 characters total**
6. **Minimum 3 characters for description**

## 🚀 Development Workflow

### 1. Initial Setup

First time contributors should set up their development environment:

```bash
# Clone the repository
git clone https://github.com/your-username/hackathon.git
cd hackathon

# Install dependencies (this automatically sets up git hooks via Husky)
npm install
```

### 2. Git Hooks (Automatic Setup)

The project uses **Husky** for automatic git hooks that enforce branch naming conventions:

- **Pre-commit hook**: Shows warnings for invalid branch names (non-blocking)
- **Pre-push hook**: Blocks pushes for invalid branch names (except protected branches)
- **Automatic installation**: Hooks are installed automatically when you run `npm install`

**Protected branches** (exempt from naming conventions):
- `main`, `master`, `develop`

The git hooks provide immediate feedback and prevent invalid branches from being pushed, complementing our GitHub Actions validation.

### 3. Create a New Branch

```bash
# Start from main branch
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 2. Development Process

- Make your changes
- Follow our code standards (see below)
- Test your changes locally

### 3. Before Submitting

```bash
# Lint your code
npm run lint

# Build to check for TypeScript errors
npm run build

# Commit your changes
git add .
git commit -m "feat: add user authentication system"
```

### 4. Submit Pull Request

- Push your branch to GitHub
- Create a Pull Request to `main`
- Our branch naming workflow will validate your branch name
- Wait for code review

## 📋 Code Standards

### Required Before Each Commit
- Run `npm run lint` and fix any issues
- Run `npm run build` to ensure TypeScript compilation
- Follow existing file structure and naming conventions
- Update documentation when adding new features

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Mantine v7 with Emotion React
- **State**: Zustand + TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Forms**: React Hook Form + Zod validation

## 🛠️ Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint + Prettier
```

## 🧪 Testing

- Write unit tests for new functionality
- Test error states and edge cases
- Ensure accessibility compliance
- Mock external API calls in tests

## 🔒 Security

- Never commit API keys or sensitive credentials
- Use environment variables for configuration
- Follow Supabase RLS policies strictly
- Implement proper input validation

## 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication system
fix: resolve memory leak in team component
docs: update API documentation
style: fix code formatting
refactor: optimize database queries
test: add unit tests for login flow
```

## 🚨 Branch Protection

Our automated checks will:

1. **Validate branch naming** - Ensures your branch follows the convention
2. **Run linting** - Checks code quality and formatting
3. **Build verification** - Ensures TypeScript compilation succeeds
4. **Security scanning** - Checks for vulnerabilities

## 🆘 Getting Help

- 💬 [GitHub Discussions](https://github.com/kinncj/hackathon/discussions) - Ask questions and get community support
- 📖 [Documentation](https://github.com/kinncj/hackathon/tree/main/docs) - Read comprehensive guides
- 🔒 [Security Issues](https://github.com/kinncj/hackathon/security/advisories/new) - Report security vulnerabilities

## 📋 Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Branch name follows convention (`feature/*` or `fix/*`)
- [ ] Code passes linting (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Changes are tested
- [ ] Documentation is updated (if needed)
- [ ] Commit messages follow convention
- [ ] PR description explains what and why

## 🎉 Thank You!

Your contributions help make this hackathon management system better for everyone. We appreciate your time and effort!
