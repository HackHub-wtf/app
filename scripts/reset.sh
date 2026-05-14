#!/usr/bin/env bash
# reset.sh — Wipe all data and restart the stack from a clean state.
#
# Drops Docker volumes (database, MinIO), recreates all containers,
# then waits for the stack to be healthy.
#
# Usage: ./scripts/reset.sh [--yes]
#   --yes   Skip the confirmation prompt (for scripts/CI)

set -euo pipefail

# ── Colour output ──────────────────────────────────────────────────────────────
if [[ -n "${NO_COLOR:-}" || "${TERM:-}" == "dumb" || ! -t 1 ]]; then
  GREEN=''; RED=''; YELLOW=''; BOLD=''; RESET=''
else
  GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'
  BOLD='\033[1m'; RESET='\033[0m'
fi

ok()   { printf "  ${GREEN}✓${RESET}  %s\n" "$*"; }
err()  { printf "  ${RED}✗${RESET}  %s\n" "$*" >&2; }
warn() { printf "  ${YELLOW}!${RESET}  %s\n" "$*"; }
info() { printf "      %s\n" "$*"; }
step() { printf "\n${BOLD}%s${RESET}\n" "$*"; }

die() {
  err "$*"
  exit 1
}

# ── Parse flags ────────────────────────────────────────────────────────────────
SKIP_CONFIRM=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) SKIP_CONFIRM=true; shift ;;
    -h|--help)
      echo "Usage: ./scripts/reset.sh [--yes]"
      echo "  --yes   Skip confirmation prompt"
      exit 0
      ;;
    *) die "Unknown option: $1" ;;
  esac
done

# ── Locate compose file ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"

[[ -f "$COMPOSE_FILE" ]] || die "docker-compose.yml not found at $COMPOSE_FILE"

# ── Confirm ────────────────────────────────────────────────────────────────────
printf "\n"
printf "${YELLOW}${BOLD}  WARNING: This will delete ALL HackHub data.${RESET}\n"
printf "${YELLOW}  Database, MinIO buckets, and all volumes will be wiped.${RESET}\n"
printf "${YELLOW}  This cannot be undone.${RESET}\n"
printf "\n"

if [[ "$SKIP_CONFIRM" == "false" ]]; then
  read -r -p "  Are you sure? [y/N] " confirm
  case "$confirm" in
    [yY]|[yY][eE][sS]) ;;
    *) echo "  Aborted."; exit 0 ;;
  esac
fi

# ── Tear down ──────────────────────────────────────────────────────────────────
step "Stopping containers and removing volumes"

docker compose -f "$COMPOSE_FILE" down -v --remove-orphans 2>&1 | \
  sed 's/^/      /' || die "docker compose down failed"

ok "All containers stopped and volumes removed"

# ── Bring up ───────────────────────────────────────────────────────────────────
step "Starting fresh stack"

docker compose -f "$COMPOSE_FILE" up -d 2>&1 | \
  sed 's/^/      /' || die "docker compose up failed"

ok "Containers started"

# ── Wait for API ───────────────────────────────────────────────────────────────
step "Waiting for API to become healthy"

API="http://localhost:8080"
MAX_RETRIES=40
RETRY_INTERVAL=5

for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null || echo "000")

  if [[ "$STATUS" != "000" ]]; then
    ok "API is up (HTTP $STATUS)"
    break
  fi

  if [[ "$i" -eq "$MAX_RETRIES" ]]; then
    warn "API did not respond after $((MAX_RETRIES * RETRY_INTERVAL))s."
    warn "The stack may still be starting — check with: docker compose ps"
    break
  fi

  printf "  Waiting for API — attempt %d/%d ...\r" "$i" "$MAX_RETRIES"
  sleep "$RETRY_INTERVAL"
done

# ── Done ───────────────────────────────────────────────────────────────────────
printf "\n"
printf "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
printf "${GREEN}${BOLD}  Reset complete. Stack is running with no data.${RESET}\n"
printf "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
printf "\n"
printf "  Next step:\n"
printf "    ${BOLD}./scripts/install.sh${RESET}          (set up a fresh instance)\n"
printf "    ${BOLD}./scripts/install.sh --demo${RESET}   (set up with demo data)\n"
printf "\n"
