# �️ Local Development Setup

This comprehensive guide will walk you through setting up HackHub for local development on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 24.1.0** or higher (LTS recommended)
- **npm 10.x** or **yarn 1.22.x** or **pnpm 8.x**
- **Git** 2.34 or higher
- **VS Code** (recommended) with suggested extensions

## 🚀 Quick Setup (5 minutes)

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/kinncj/hackathon.git
cd hackathon

# Or using GitHub CLI
gh repo clone kinncj/hackathon
cd hackathon
```

### 2. Install Dependencies

```bash
# Install all project dependencies
npm install

# This will install:
# - React, TypeScript, Vite
# - Mantine UI components
# - Supabase client
# - Testing tools (Vitest, Playwright)
# - Development tools (ESLint, Prettier)
```

### 3. Environment Configuration

```bash
# Create your local environment file
cp .env.local.example .env.local

# Edit the file with your preferred editor
nano .env.local
# or
code .env.local
```

**Default `.env.local` content:**
```bash
# Supabase Configuration (Local Development)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# App Configuration
VITE_APP_NAME=HackHub
VITE_APP_ENVIRONMENT=development
VITE_APP_VERSION=1.0.0

# Development Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=false
VITE_ENABLE_DEBUG_MODE=true
```

### 4. Start Supabase Local Development

```bash
# Install Supabase CLI globally (if not already installed)
npm install -g @supabase/cli

# Start local Supabase instance
npm run supabase:start

# This will:
# - Start PostgreSQL database
# - Start Supabase Auth service
# - Start Supabase Storage service
# - Start Supabase Real-time service
# - Apply database migrations
```

**Expected output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Initialize Database

```bash
# Set up database schema and seed data
npm run db:setup

# This will:
# - Create all necessary tables
# - Set up Row Level Security policies
# - Insert sample data for development
# - Create test user accounts
```

### 6. Start Development Server

```bash
# Start the frontend development server
npm run dev

# The application will be available at:
# http://localhost:5173
```

🎉 **You're ready to go!** Open your browser and navigate to `http://localhost:5173`

### Verify Your Setup

You should now see the HackHub application running. You can also access Supabase Studio at `http://localhost:54323` to manage your database:

![Supabase Studio Interface](../screenshots/supabase/Screenshot_2025-07-29_at_5.27.21PM.png)

*Supabase Studio provides a comprehensive interface for managing your database schema, viewing data, and monitoring real-time subscriptions.*

## 🗄️ Detailed Supabase Setup

### Understanding the Local Stack

HackHub uses Supabase as its backend, which provides:
- **PostgreSQL Database** - Data storage and queries
- **Authentication** - User registration and login
- **Real-time Subscriptions** - Live updates
- **File Storage** - Avatar and file uploads
- **Row Level Security** - Fine-grained permissions

### Supabase Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 54321 | Main API endpoint |
| PostgreSQL | 54322 | Database connections |
| Studio | 54323 | Database management UI |
| Inbucket | 54324 | Email testing |

### Database Schema

The setup script creates these main tables:

```sql
-- User profiles
profiles (id, email, name, role, bio, avatar_url, skills)

-- Hackathon events
hackathons (id, title, description, start_date, end_date, status, registration_key)

-- Teams and memberships
teams (id, name, hackathon_id, created_by, is_open)
team_members (team_id, user_id, role, joined_at)

-- Ideas and interactions
ideas (id, title, description, hackathon_id, team_id, category, votes)
votes (id, idea_id, user_id)
comments (id, idea_id, user_id, content)

-- Notifications
notifications (id, user_id, title, message, type, read)
```

### Sample Data

The seed script creates:
- **2 Manager accounts** - `manager@example.com` / `manager2@example.com`
- **8 Participant accounts** - `participant1@example.com` through `participant8@example.com`
- **3 Sample hackathons** - With different statuses and configurations
- **Multiple teams** - With various member compositions
- **Sample ideas** - With votes and comments

**Default password for all accounts:** `password123`

## 🔧 Development Tools

### VS Code Setup

Install these recommended extensions:

```bash
# Essential extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss

# Supabase and database
code --install-extension supabase.supabase

# Testing tools
code --install-extension ms-playwright.playwright
code --install-extension vitest.explorer

# Helpful utilities
code --install-extension github.copilot
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
```

### Useful VS Code Settings

Add these to your `.vscode/settings.json`:

```json
{
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## 🧪 Testing Setup

### Running Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run different types of tests
npm run test              # Unit tests (watch mode)
npm run test:run          # Unit tests (single run)
npm run test:coverage     # Unit tests with coverage
npm run test:e2e          # End-to-end tests
npm run test:e2e:ui       # E2E tests with UI
```

### Test Database

Tests use a separate test database to avoid conflicts:

```bash
# Reset test database
npm run db:test:reset

# Run tests with fresh database
npm run test:integration
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use

```bash
# Kill processes on Supabase ports
sudo lsof -ti:54321,54322,54323,54324 | xargs kill -9

# Or use different ports
supabase start --db-port 54325
```

#### 2. Database Connection Issues

```bash
# Check Supabase status
supabase status

# Restart Supabase
npm run supabase:stop
npm run supabase:start
```

#### 3. Environment Variables Not Loading

```bash
# Verify .env.local exists and has correct values
cat .env.local

# Restart development server
npm run dev
```

#### 4. TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run type-check
```

#### 5. Database Schema Issues

```bash
# Reset and recreate database
npm run db:reset
npm run db:setup
```

#### 6. Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

1. **Check the logs** - Development server and Supabase logs provide detailed error information
2. **Verify prerequisites** - Ensure all required software is correctly installed
3. **Review environment** - Double-check your `.env.local` configuration
4. **Database state** - Use Supabase Studio at `http://localhost:54323` to inspect data
5. **Community support** - Open an issue on GitHub if problems persist

## 🚀 Advanced Development

### Using DevContainers

For a completely isolated development environment:

```bash
# Open in VS Code
code .

# VS Code will prompt to reopen in container
# Or use Command Palette: "Dev Containers: Reopen in Container"
```

The DevContainer includes:
- Pre-configured Node.js environment
- All required tools and extensions
- Automated setup scripts

### Multiple Environment Setup

Set up multiple environments for different development scenarios:

```bash
# Create environment-specific files
cp .env.local .env.development
cp .env.local .env.testing
cp .env.local .env.staging

# Switch environments
npm run dev --mode=development
npm run dev --mode=testing
```

### Database Migrations

When modifying the database schema:

```bash
# Create a new migration
supabase migration new your_migration_name

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.types.ts
```

### Performance Optimization

Enable development optimizations:

```bash
# Bundle analyzer
npm run build:analyze

# Performance profiling
npm run dev:profile
```

## 📚 Next Steps

Once your development environment is set up:

1. **Read the documentation** - Explore `docs/` for detailed guides
2. **Run the test suite** - Ensure everything works correctly
3. **Explore the codebase** - Start with `src/App.tsx` and `src/pages/`
4. **Make your first change** - Try updating a component or adding a feature
5. **Submit your first PR** - Follow the contributing guidelines

## 🔗 Related Documentation

- **[📋 User Guide](USER_GUIDE.md)** - How to use HackHub as an end user
- **[🏗️ Architecture](ARCHITECTURE.md)** - System design and technical decisions
- **[🔧 API Reference](API.md)** - Database schema and API endpoints
- **[🧪 Testing Guide](TESTING.md)** - Testing strategies and tools
- **[🚀 Deployment](DEPLOYMENT.md)** - Production deployment guide

---

**Happy coding! 🎉** If you run into any issues, don't hesitate to open an issue or reach out to the community.
- 📧 **Notifications**: Welcome messages and system notifications  
- 💬 **Chat Messages**: Team collaboration examples

## Step 3: Set Up Admin CLI

The admin CLI tool lets you manage the platform outside the web interface:

```bash
# Install CLI dependencies (if not already done)
npm install dotenv readline

# Launch the admin CLI
npm run admin-cli
```

**Key CLI Functions:**
- 👑 **Create Super Admins**: Add master admin accounts
- 📊 **View Statistics**: Monitor platform usage
- 🔧 **User Management**: Promote/demote users, reset passwords
- 🧹 **Data Cleanup**: Remove old notifications, completed hackathons
- 📧 **System Notifications**: Broadcast important messages

## Step 4: Test the Platform

Now you can test with realistic data:

1. **Login as Manager** (`manager@example.com` / `password`)
   - View hackathon analytics
   - Manage hackathon settings
   - Review submitted ideas

2. **Login as Participant** (`user@example.com` / `password`)  
   - Join teams
   - Submit ideas
   - Vote on ideas
   - Use team chat

3. **Admin Functions** (via CLI)
   - Create additional admin accounts
   - Monitor platform statistics
   - Send system-wide notifications

## Environment Variables

Ensure your `.env.local` has these variables for the CLI:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

**CLI Permission Issues:**
- Ensure you have the service role key in your environment
- Check that Supabase is running locally
- Verify database connection

**Seed Data Issues:**
- Make sure accounts exist before applying seed data
- Check that foreign key relationships are satisfied
- Verify UUIDs match between auth.users and profiles

**Login Issues:**
- Confirm accounts are email confirmed
- Check that profiles table has matching records
- Verify role assignments are correct

---

🎉 **You're all set!** Your hackathon platform now has:
- ✅ Test accounts with proper roles
- ✅ Comprehensive demo data  
- ✅ Admin CLI for management
- ✅ Realistic content for testing

Happy hacking! 🚀
