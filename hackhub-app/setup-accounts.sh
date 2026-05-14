#!/bin/bash

# Development Account Setup Script
# This script helps set up test accounts for the hackathon platform

echo "🚀 Setting up development accounts for Hackathon Platform"
echo "========================================================="
echo ""

echo "📋 MANUAL STEPS REQUIRED:"
echo ""
echo "1. Create User Accounts in Supabase Dashboard:"
echo "   - Go to: https://supabase.com/dashboard"
echo "   - Navigate to your project > Authentication > Users"
echo "   - Click 'Add user' and create these accounts:"
echo ""
echo "   👨‍💼 MANAGER ACCOUNT:"
echo "   Email: manager@example.com"
echo "   Password: password"
echo ""
echo "   👤 PARTICIPANT ACCOUNT:"
echo "   Email: user@example.com"
echo "   Password: password"
echo ""

echo "2. Run the seed data (optional - adds sample hackathons, teams, ideas):"
echo "   supabase db reset"
echo "   # OR manually run: supabase/seed.sql"
echo ""

echo "3. Update manager role (run this SQL after creating the accounts):"
echo "   UPDATE public.profiles"
echo "   SET role = 'manager'"
echo "   WHERE email = 'manager@example.com';"
echo ""

echo "🔍 To verify setup:"
echo "   - Login as manager@example.com to create hackathons"
echo "   - Login as user@example.com to join hackathons and teams"
echo ""

echo "🎯 Test Features:"
echo "   ✅ Manager can create/edit hackathons"
echo "   ✅ Participant can join hackathons with registration key"
echo "   ✅ Users can create and join teams"
echo "   ✅ Teams can submit and vote on ideas"
echo "   ✅ Real-time notifications and updates"
echo ""

echo "📝 Sample Registration Key: WINTER2024"
echo ""
echo "Happy hacking! 🎉"
