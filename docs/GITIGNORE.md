# 🚫 .gitignore Documentation

This document explains the comprehensive `.gitignore` patterns used in the HackHub project.

## 📋 Overview

Our `.gitignore` file is organized into logical sections to handle various types of files that should not be tracked in version control. This helps keep the repository clean and prevents accidental commits of sensitive or generated files.

## 🗂️ File Categories

### 📦 Dependencies & Package Managers
```ignore
node_modules/
.npm
.yarn/
.pnp.*
```
**Why ignored**: These are installed dependencies that can be regenerated from `package.json`. Including them would make the repository massive and cause merge conflicts.

### 📝 Logs & Debug Files
```ignore
logs/
*.log
debug.log
npm-debug.log*
```
**Why ignored**: Log files contain runtime information and are generated during development/deployment. They're not part of the source code.

### 🏗️ Build & Distribution
```ignore
dist/
build/
.next/
.vercel/
```
**Why ignored**: These are compiled/built outputs generated from source code. They should be built fresh for each deployment.

### 🔐 Environment & Configuration
```ignore
.env
.env.local
.env.production
secrets.json
```
**Why ignored**: Environment files contain sensitive information like API keys, database URLs, and other secrets that should never be committed.

### 🗄️ Database & Supabase
```ignore
.supabase/
*.db
*.sqlite
supabase/logs/
```
**Why ignored**: Local database files and Supabase temporary files are environment-specific and can contain sensitive data.

### 🧪 Testing & Coverage
```ignore
coverage/
playwright-report/
test-results/
__snapshots__/
```
**Why ignored**: Test reports and coverage files are generated during testing. Only the test source code should be tracked.

### 🎯 IDE & Editor Files
```ignore
.vscode/*
!.vscode/settings.json
.idea/
*.sublime-*
```
**Why ignored**: Most IDE files are user-specific preferences. We only keep shared settings that benefit all developers.

### 💻 Operating System Files
```ignore
.DS_Store      # macOS
Thumbs.db      # Windows
*~             # Linux backup files
```
**Why ignored**: These are OS-generated files that provide no value to the project and differ between development environments.

### 🔧 Development Tools & Cache
```ignore
.eslintcache
.prettiercache
*.tsbuildinfo
.turbo/
```
**Why ignored**: Cache files speed up development tools but are machine-specific and can be regenerated.

## 🎯 Project-Specific Patterns

### 📸 Screenshots & Media
```ignore
# We track documentation screenshots but ignore test screenshots
screenshots/           # ❌ Ignored (test screenshots)
docs/screenshots/      # ✅ Tracked (documentation)
```

### 🔒 Security Files
```ignore
*.pem
*.key
*.crt
id_rsa*
```
**Why ignored**: All certificate and key files are ignored for security. These should never be committed to version control.

### 📚 Generated Documentation
```ignore
typedoc/
jsdoc/
.storybook-static/
```
**Why ignored**: Generated documentation can be rebuilt from source code and comments.

## 🛠️ Best Practices

### ✅ Do's

1. **Keep it organized**: Group related patterns together with comments
2. **Use specific patterns**: Prefer specific patterns over broad wildcards
3. **Document exceptions**: Use `!` syntax to include specific files when needed
4. **Test your patterns**: Use `git check-ignore filename` to test patterns

### ❌ Don'ts

1. **Don't ignore source code**: Never ignore `.js`, `.ts`, `.tsx`, `.css` files
2. **Don't ignore configs**: Keep shared configurations like `.eslintrc`, `vite.config.ts`
3. **Don't ignore package.json**: Always track dependency definitions
4. **Don't ignore too broadly**: Avoid patterns like `*` that might catch important files

## 🔍 Testing .gitignore Patterns

You can test if a file would be ignored:

```bash
# Check if a specific file is ignored
git check-ignore path/to/file

# Check if a file is ignored and show the rule
git check-ignore -v path/to/file

# Show all ignored files in directory
git status --ignored
```

## 🚨 Emergency: File Accidentally Committed

If you accidentally commit a file that should be ignored:

```bash
# Remove from tracking but keep local file
git rm --cached filename

# Remove directory from tracking
git rm -r --cached directory/

# Add to .gitignore
echo "filename" >> .gitignore

# Commit the removal
git add .gitignore
git commit -m "chore: remove accidentally committed file"
```

## 🔄 Updating .gitignore

When updating `.gitignore`:

1. **Understand the impact**: New patterns only affect untracked files
2. **Clean up existing files**: Use `git rm --cached` for already tracked files
3. **Test thoroughly**: Ensure important files aren't accidentally ignored
4. **Document changes**: Update this documentation if adding new categories

## 📚 Resources

- [Git Documentation - gitignore](https://git-scm.com/docs/gitignore)
- [GitHub's gitignore templates](https://github.com/github/gitignore)
- [gitignore.io](https://gitignore.io/) - Generate custom .gitignore files
- [VS Code GitIgnore Extension](https://marketplace.visualstudio.com/items?itemName=codezombiech.gitignore)

## 🤝 Contributing to .gitignore

When contributing changes to `.gitignore`:

1. **Discuss first**: For major changes, open an issue to discuss
2. **Be specific**: Include the reason for new patterns
3. **Test impact**: Ensure no important files are accidentally ignored
4. **Update documentation**: Keep this file current with changes
5. **Follow format**: Maintain the organized structure with comments

---

**Remember**: A good `.gitignore` file prevents problems before they happen! 🛡️
