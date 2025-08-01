# Database Migrations

This directory contains SQL migration scripts for the hackathon project.

## Migration Files

### `add_project_fields_to_ideas.sql`
Adds proper database columns for project data to the `ideas` table:
- `repository_url`: URL to the project repository (GitHub, GitLab, etc.)
- `demo_url`: URL to the live demo or deployed project  
- `project_attachments`: JSON string containing ProjectAttachment objects

**Purpose**: Move away from storing project data as JSON in the generic `attachments` array to proper typed columns.

### `migrate_project_data.sql`
Data migration script that moves existing project data from the JSON stored in the `attachments` array to the new dedicated columns.

**Purpose**: Preserve existing project data when upgrading to the new schema.

## How to Run Migrations

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of each migration file
4. Run them in order:
   1. First run `add_project_fields_to_ideas.sql`
   2. Then run `migrate_project_data.sql`

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset --linked
# Then apply the migrations manually through the dashboard
```

### Option 3: Direct Database Access
If you have direct access to your PostgreSQL database:
```bash
psql -h your-db-host -U your-username -d your-database -f add_project_fields_to_ideas.sql
psql -h your-db-host -U your-username -d your-database -f migrate_project_data.sql
```

## After Running Migrations

Once the migrations are complete, you can update your TypeScript types in `src/lib/supabase.ts` to include the new fields:

```typescript
ideas: {
  Row: {
    // ... existing fields ...
    repository_url?: string
    demo_url?: string
    project_attachments?: string // JSON string containing ProjectAttachment[]
  }
  Insert: {
    // ... existing fields ...
    repository_url?: string
    demo_url?: string
    project_attachments?: string
  }
  Update: {
    // ... existing fields ...
    repository_url?: string
    demo_url?: string
    project_attachments?: string
  }
}
```

## Rollback

If you need to rollback these changes:

```sql
-- Remove the new columns
ALTER TABLE ideas DROP COLUMN IF EXISTS repository_url;
ALTER TABLE ideas DROP COLUMN IF EXISTS demo_url;
ALTER TABLE ideas DROP COLUMN IF EXISTS project_attachments;

-- Drop the indexes
DROP INDEX IF EXISTS idx_ideas_repository_url;
DROP INDEX IF EXISTS idx_ideas_demo_url;
```

Note: This will lose any project data that was stored in the new columns.
