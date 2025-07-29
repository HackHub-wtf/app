# 🔐 Test Accounts

## Quick Setup

After running `supabase db reset`, create the test accounts:

```bash
npm run create-accounts
```

This creates working login accounts with proper authentication.

## Demo Accounts

### 👨‍💼 Manager Account
- **Email**: `manager@example.com`
- **Password**: `password`
- **Role**: Manager (can create hackathons)

### 👤 Participant Account  
- **Email**: `user@example.com`
- **Password**: `password`
- **Role**: Participant (can join teams, submit ideas)

## Usage

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Login with either account** to test different user roles and permissions

3. **Manager capabilities**:
   - Create and manage hackathons
   - View analytics dashboard
   - Manage hackathon settings

4. **Participant capabilities**:
   - Join teams
   - Submit ideas
   - Vote on ideas
   - Use team chat

## Admin CLI

For additional admin operations, use the CLI tool:
```bash
npm run admin-cli
```

This allows you to:
- Create additional admin accounts
- Promote users to different roles
- Send system notifications
- View platform statistics

## Sample Data

After creating accounts, populate the database with demo content:
```bash
npm run seed-data
```

This creates:
- **2 Hackathons**: Winter AI Challenge 2024, Green Tech Innovation Sprint
- **2 Teams**: AI Innovators, EcoCoders  
- **2 Ideas**: AI Healthcare Assistant, Smart Carbon Tracker
- **Sample notifications** and user interactions

Perfect for testing all platform features! 🌱

---

**Setup Steps:**
1. `supabase db reset` - Reset database with clean schema
2. `npm run create-accounts` - Create working test accounts  
3. `npm run seed-data` - Add sample hackathons, teams, and ideas
4. `npm run dev` - Start the application

Complete setup with realistic demo data! 🎉
