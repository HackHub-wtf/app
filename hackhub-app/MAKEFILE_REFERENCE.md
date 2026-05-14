# 🛠️ Development Commands Reference

This project uses a Makefile to simplify common development tasks. Here's a quick reference of available commands:

## 🚀 Quick Start

```bash
# Complete setup for new developers
make setup

# Start development environment
make start

# View all available commands
make help
```

## 📖 Common Commands

| Command | Description |
|---------|-------------|
| `make setup` | Complete local development setup |
| `make start` | Start all development servers |
| `make stop` | Stop all development servers |
| `make status` | Check status of services |
| `make build` | Build the application |
| `make lint` | Run code linting |
| `make clean` | Clean node_modules and build artifacts |

## 🏗️ Development Workflow

1. **First time setup:**
   ```bash
   make setup
   ```

2. **Daily development:**
   ```bash
   make start
   # Your app will be available at http://localhost:5173
   ```

3. **Before committing:**
   ```bash
   make qa/quick
   ```

4. **Troubleshooting:**
   ```bash
   make dev/reset  # Reset everything
   make validate   # Check project health
   ```

## 🗄️ Database Commands

| Command | Description |
|---------|-------------|
| `make db/reset` | Reset local database |
| `make db/seed` | Seed with sample data |
| `make db/status` | Show database status |

## 💡 Tips

- Run `make help` to see all available commands with descriptions
- Use `make validate` to check if your environment is properly configured
- All commands use the Node.js version specified in the Makefile (24.1.0)
- Supabase CLI is required for database operations

## 🔧 Prerequisites

- Node.js 24.1.0
- npm
- Supabase CLI (`npm install -g supabase`)

For detailed setup instructions, see the main [README.md](README.md) file.
