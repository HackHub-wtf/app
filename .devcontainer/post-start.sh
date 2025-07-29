#!/bin/bash

# DevContainer Post-Start Script
# This script runs every time the container starts

set -e

echo "🔄 Container started - running startup tasks..."

# Update npm packages if needed
echo "📦 Checking for package updates..."
npm outdated || true

# Check Supabase status
echo "🗄️  Checking Supabase status..."
if ! supabase status 2>/dev/null; then
    echo "⚠️  Supabase is not running. Start it with: npm run supabase:start"
else
    echo "✅ Supabase is running"
fi

# Check if .env.local exists and is properly configured
if [ -f .env.local ]; then
    if grep -q "your-project" .env.local; then
        echo "⚠️  Please update .env.local with your actual Supabase credentials"
    else
        echo "✅ Environment configuration looks good"
    fi
else
    echo "⚠️  .env.local not found. Create it for local development."
fi

# Show available npm scripts
echo "📋 Available npm scripts:"
npm run --silent | head -10

echo "✅ Startup tasks complete!"
echo ""
echo "Quick start commands:"
echo "  npm run dev              - Start development server"
echo "  npm run supabase:start   - Start Supabase local instance"
echo "  npm run test             - Run tests in watch mode"
echo "  npm run storybook        - Start Storybook (if configured)"
echo ""
