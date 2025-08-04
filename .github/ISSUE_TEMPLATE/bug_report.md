---
name: 🐛 Bug Report
about: Report a bug to help us improve the hackathon management system
title: '[BUG] '
labels: ['bug']
assignees: ''
---

## 🐛 Bug Description
<!-- A clear and concise description of what the bug is -->

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## 🎯 Expected Behavior
<!-- What you expected to happen -->

## 📱 Actual Behavior
<!-- What actually happened -->

## 🖼️ Screenshots
<!-- If applicable, add screenshots to help explain your problem -->

## 🌐 Environment
- **Browser:** [e.g., Chrome, Firefox, Safari]
- **Version:** [e.g., 22]
- **OS:** [e.g., macOS, Windows, Linux]
- **Device:** [e.g., Desktop, Mobile]

## 📋 Additional Context
<!-- Any other context about the problem -->

---

## 📝 Development Guidelines

When fixing this bug, please follow our branching convention:

**Branch naming:** `fix/bug-description`

**Examples:**
- `fix/login-validation`
- `fix/team-creation-error`
- `fix/memory-leak`

**Getting started:**
```bash
git checkout main
git pull origin main
git checkout -b fix/bug-description
```

**Before submitting PR:**
- [ ] Follow the branch naming convention
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Add tests to prevent regression
- [ ] Verify the fix works as expected
