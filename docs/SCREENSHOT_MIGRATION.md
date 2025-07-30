# 📸 Screenshot Directory Structure

This document provides a quick reference for the new organized screenshot structure with descriptive filenames.

## 📁 Directory Structure

```
screenshots/
├── manager/                           # Manager interface screenshots
│   ├── manager_create_new_hackathon.png   # Hackathon creation form
│   ├── manager_create_team.png            # Team creation interface
│   ├── manager_dashboard.png              # Main manager dashboard
│   ├── manager_hackathon_detail.png       # Detailed hackathon view
│   ├── manager_hackathons.png             # Hackathons overview list
│   ├── manager_login.png                  # Manager login interface
│   ├── manager_profile_update.png         # Profile management
│   └── manager_submit_idea.png            # Idea submission form
├── user/                              # Participant interface screenshots
│   ├── user_dashboard.png                 # User dashboard (dark mode)
│   ├── user_dashboard_light_mode.png      # User dashboard (light mode)
│   ├── user_hackathon_details.png         # Hackathon details for users
│   ├── user_hackathons.png                # Available hackathons list
│   └── user_login_page.png                # User login interface
└── supabase/                          # Database management screenshots
    └── Screenshot_2025-07-29_at_5.27.21PM.png  # Supabase Studio interface
```

## 🔄 Migration Summary

### What Changed
- **Old Format**: `Screenshot_2025-07-29_at_[TIME].png`
- **New Format**: `[role]_[feature]_[description].png`

### Benefits
- ✅ **Descriptive Names**: Immediately know what each screenshot shows
- ✅ **Better Organization**: Grouped by user role (manager/user/supabase)
- ✅ **Easier Maintenance**: Simple to find and update specific screenshots
- ✅ **Documentation Clarity**: Clear references in documentation files

### Updated Files
1. **`docs/SCREENSHOTS.md`** - Complete rewrite with new filenames
2. **`docs/USER_GUIDE.md`** - Updated all screenshot references
3. **`docs/SETUP.md`** - Supabase screenshot reference maintained
4. **All documentation files** - Now reference descriptive filenames

## 📖 Usage in Documentation

Each screenshot now has a clear, descriptive filename that makes it easy to:
- Find the right screenshot for documentation
- Understand what feature is being shown
- Maintain and update visual documentation
- Organize screenshots by user role and functionality

## 🎯 Best Practices

When adding new screenshots:
1. **Follow naming convention**: `[role]_[feature]_[specific_detail].png`
2. **Use appropriate directory**: manager/, user/, or supabase/
3. **Update documentation**: Add references in relevant docs
4. **Maintain consistency**: Use same browser, theme, and data quality

---

This organized structure makes the HackHub documentation more maintainable and user-friendly! 🚀
