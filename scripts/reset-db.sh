#!/usr/bin/env bash
# reset-db.sh — Wipe ALL application data and reset DB to a clean migrated state.
# Leaves Flyway schema history intact. Use before E2E test runs.
#
# Usage:
#   ./scripts/reset-db.sh
#   ./scripts/reset-db.sh && ./scripts/test-up.sh
set -euo pipefail

GRN='\033[0;32m'; CYN='\033[0;36m'; RED='\033[0;31m'; BOLD='\033[1m'; RST='\033[0m'
ok()   { printf "  ${GRN}✓${RST}  %s\n" "$1"; }
step() { printf "\n${CYN}${BOLD}▶ %s${RST}\n" "$1"; }
die()  { printf "\n${RED}${BOLD}✗ %s${RST}\n\n" "$1" >&2; exit 1; }

DB_CONTAINER="${DB_CONTAINER:-hackhub-postgres}"
DB_USER="${DB_USER:-hackhub}"
DB_NAME="${DB_NAME:-hackhub}"

# Verify postgres is running
docker ps --filter "name=$DB_CONTAINER" --filter "status=running" --format '{{.Names}}' | \
  grep -q "$DB_CONTAINER" || die "Container $DB_CONTAINER is not running. Run: docker compose up -d"

db() { docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$1" > /dev/null 2>&1; }

step "Wiping all application data"

# Truncate in dependency order (children before parents)
db "TRUNCATE TABLE
  judge_scores,
  idea_scores,
  idea_votes,
  comments,
  final_submissions,
  hackathon_judges,
  voting_criteria,
  team_members,
  teams,
  ideas,
  chat_messages,
  notifications,
  org_invitations,
  organization_members,
  hackathons,
  organizations,
  refresh_tokens,
  profiles
RESTART IDENTITY CASCADE;" 2>/dev/null || \
db "DO \$\$
BEGIN
  EXECUTE (
    SELECT string_agg('TRUNCATE TABLE ' || tablename || ' CASCADE', '; ')
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('flyway_schema_history')
  );
END \$\$;"

ok "All tables truncated"

step "Verifying clean state"
COUNTS=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT 'profiles: ' || COUNT(*) FROM profiles
  UNION ALL SELECT 'hackathons: ' || COUNT(*) FROM hackathons
  UNION ALL SELECT 'organizations: ' || COUNT(*) FROM organizations;
")
echo "$COUNTS"
ok "Database is clean"

printf "\n${GRN}${BOLD}Clean slate ready.${RST} Run ./scripts/test-up.sh to seed.\n\n"
