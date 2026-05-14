#!/bin/bash

# DevContainer Post-Create Setup Script
# This script runs after the container is created

set -e

echo "🚀 Setting up HackHub development environment..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm ci

# Install Playwright browsers for testing
echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps

# Set up Git configuration if not already configured
if [ -z "$(git config --global user.name)" ]; then
    echo "⚙️  Configuring Git..."
    git config --global user.name "Developer"
    git config --global user.email "developer@example.com"
    echo "⚠️  Please update your Git configuration with your actual details:"
    echo "   git config --global user.name 'Your Name'"
    echo "   git config --global user.email 'your.email@example.com'"
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔐 Creating .env.local file..."
    cat > .env.local << 'EOF'
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
EOF
    echo "✅ Created .env.local with default development settings"
else
    echo "✅ .env.local already exists"
fi

# Initialize Supabase project if not already initialized
if [ ! -f supabase/config.toml ]; then
    echo "🗄️  Initializing Supabase project..."
    supabase init
    echo "✅ Supabase project initialized"
else
    echo "✅ Supabase project already initialized"
fi

# Set up pre-commit hooks
echo "🪝 Setting up Git hooks..."
npm run prepare || echo "⚠️  Husky setup skipped (may not be configured yet)"

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p src/components src/pages src/hooks src/stores src/utils src/lib
mkdir -p src/__tests__/mocks src/__tests__/utils
mkdir -p src/e2e
mkdir -p screenshots
mkdir -p docs

echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start Supabase: npm run supabase:start"
echo "  2. Run database setup: npm run db:setup"
echo "  3. Start development server: npm run dev"
echo ""
echo "Happy coding! 🚀"
