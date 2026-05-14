#!/usr/bin/env bash
# seed-dev.sh — Populate the dev database with realistic fixture data.
#
# Requires the full stack to be running: make up
#
# Usage: ./scripts/seed-dev.sh [OPTIONS]
#   --api-url URL         API base URL (default: http://localhost:8080)
#   --skip-if-exists      Exit 0 instead of failing when data already exists
#   -h, --help            Show this help

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

usage() {
  grep '^#   ' "$0" | sed 's/^# //'
  exit 0
}

# ── Defaults ───────────────────────────────────────────────────────────────────
API="http://localhost:8080"
SKIP_IF_EXISTS=false

# ── Parse flags ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-url)        API="$2"; shift 2 ;;
    --skip-if-exists) SKIP_IF_EXISTS=true; shift ;;
    -h|--help)        usage ;;
    *) die "Unknown option: $1. Use -h for help." ;;
  esac
done

# ── Wait for API ───────────────────────────────────────────────────────────────
MAX_RETRIES=20
RETRY_INTERVAL=3

step "Waiting for API"
info "Target: $API"

for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{}' 2>/dev/null || echo "000")
  if [[ "$STATUS" != "000" ]]; then
    ok "API is responding (HTTP $STATUS)"
    break
  fi
  if [[ "$i" -eq "$MAX_RETRIES" ]]; then
    die "API did not respond after $((MAX_RETRIES * RETRY_INTERVAL))s. Is the stack running? (make up)"
  fi
  printf "  Attempt %d/%d — retrying in %ds ...\r" "$i" "$MAX_RETRIES" "$RETRY_INTERVAL"
  sleep "$RETRY_INTERVAL"
done

# ── Helper: register or log in, returns access token ──────────────────────────
get_token() {
  local email="$1" name="$2" password="$3"
  local resp token

  resp=$(curl -s -X POST "$API/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"name\":\"$name\",\"password\":\"$password\"}" 2>&1) || true

  if echo "$resp" | grep -q '"accessToken"'; then
    token=$(echo "$resp" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "$token"
    return
  fi

  resp=$(curl -s -X POST "$API/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>&1) || true

  if echo "$resp" | grep -q '"accessToken"'; then
    token=$(echo "$resp" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "$token"
    return
  fi

  if [[ "$SKIP_IF_EXISTS" == "true" ]]; then
    warn "Could not authenticate $email — skipping"
    echo ""
  else
    die "Could not register or log in as $email. Response: $resp"
  fi
}

# ── Create accounts ────────────────────────────────────────────────────────────
step "Creating user accounts"

ADMIN_TOKEN=$(get_token "admin@hackhub.wtf" "HackHub Admin" "Admin1234!")
ok "admin@hackhub.wtf"

MANAGER_TOKEN=$(get_token "manager@hackhub.wtf" "Demo Manager" "Manager1234!")
ok "manager@hackhub.wtf"

# Promote roles in DB
if docker exec hackhub-postgres psql -U hackhub -d hackhub \
    -c "UPDATE profiles SET role='admin'   WHERE email='admin@hackhub.wtf';" \
    -c "UPDATE profiles SET role='manager' WHERE email='manager@hackhub.wtf';" \
    > /dev/null 2>&1; then
  ok "Roles promoted in DB"
else
  warn "Could not reach hackhub-postgres — promote roles manually if needed."
fi

# Re-login to get tokens with updated roles
ADMIN_TOKEN=$(get_token "admin@hackhub.wtf" "HackHub Admin" "Admin1234!")
MANAGER_TOKEN=$(get_token "manager@hackhub.wtf" "Demo Manager" "Manager1234!")

ALICE_TOKEN=$(get_token "alice@example.com" "Alice Chen"  "Alice1234!")
ok "alice@example.com (participant)"

BOB_TOKEN=$(get_token "bob@example.com" "Bob Smith" "Bob12345!")
ok "bob@example.com (participant)"

CAROL_TOKEN=$(get_token "carol@example.com" "Carol Davis" "Carol123!")
ok "carol@example.com (participant)"

# ── Create organization ────────────────────────────────────────────────────────
step "Creating organization"

ORG_RESP=$(curl -s -X POST "$API/api/v1/organizations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Demo Corp","slug":"demo-corp"}' 2>&1) || true

if echo "$ORG_RESP" | grep -q '"id"'; then
  ORG_ID=$(echo "$ORG_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  ok "Demo Corp ($ORG_ID)"
else
  if [[ "$SKIP_IF_EXISTS" == "true" ]]; then
    warn "Org already exists or failed: $(echo "$ORG_RESP" | head -c 80)"
  else
    warn "Org response: $(echo "$ORG_RESP" | head -c 120)"
  fi
fi

# ── Create hackathon ───────────────────────────────────────────────────────────
step "Creating hackathon"

START=$(date -u -v+7d '+%Y-%m-%dT00:00:00Z' 2>/dev/null || date -u -d '+7 days' '+%Y-%m-%dT00:00:00Z')
END=$(date -u -v+9d '+%Y-%m-%dT00:00:00Z' 2>/dev/null || date -u -d '+9 days' '+%Y-%m-%dT00:00:00Z')

HACK_RESP=$(curl -s -X POST "$API/api/v1/hackathons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"title\": \"Spring 2026 Hackathon\",
    \"description\": \"Build something amazing in 48 hours. Open to all skill levels.\",
    \"startDate\": \"$START\",
    \"endDate\": \"$END\",
    \"maxTeamSize\": 5,
    \"allowedParticipants\": 100,
    \"tags\": [\"AI\",\"Web\",\"Mobile\"],
    \"prizes\": [\"\$5000 first\",\"\$2000 second\",\"\$1000 third\"]
  }" 2>&1) || true

REG_KEY=""
HACK_ID=""

if echo "$HACK_RESP" | grep -q '"id"'; then
  HACK_ID=$(echo "$HACK_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  ok "Spring 2026 Hackathon ($HACK_ID)"

  curl -s -X PATCH "$API/api/v1/hackathons/$HACK_ID/status" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"status":"open"}' > /dev/null 2>&1 || true
  ok "Status -> OPEN"

  REG_KEY=$(curl -s "$API/api/v1/hackathons/$HACK_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null | \
    grep -o '"registrationKey":"[^"]*"' | cut -d'"' -f4 || true)

  if [[ -n "$REG_KEY" ]]; then
    for _tok in "$ALICE_TOKEN" "$BOB_TOKEN" "$CAROL_TOKEN" "$MANAGER_TOKEN"; do
      [[ -z "$_tok" ]] && continue
      curl -s -X POST "$API/api/v1/hackathons/join" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $_tok" \
        -d "{\"registrationKey\":\"$REG_KEY\"}" > /dev/null 2>&1 || true
    done
    ok "Participants joined with key: $REG_KEY"
  fi

  # ── Create team ──────────────────────────────────────────────────────────────
  step "Creating team"

  TEAM_RESP=$(curl -s -X POST "$API/api/v1/hackathons/$HACK_ID/teams" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ALICE_TOKEN" \
    -d '{"name":"Pixel Pirates","description":"We build things that matter."}' 2>&1) || true

  if echo "$TEAM_RESP" | grep -q '"id"'; then
    TEAM_ID=$(echo "$TEAM_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    ok "Pixel Pirates ($TEAM_ID)"

    # ── Create ideas ────────────────────────────────────────────────────────────
    step "Creating ideas"

    for entry in "AI-Powered Code Review:AI" "Real-Time Collaboration Board:Web"; do
      title="${entry%%:*}"
      category="${entry##*:}"
      IDEA_RESP=$(curl -s -X POST "$API/api/v1/hackathons/$HACK_ID/ideas" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ALICE_TOKEN" \
        -d "{\"title\":\"$title\",\"description\":\"A great idea by the Pixel Pirates.\",\"category\":\"$category\",\"teamId\":\"$TEAM_ID\",\"tags\":[\"$category\"]}" 2>&1) || true
      if echo "$IDEA_RESP" | grep -q '"id"'; then
        ok "$title"
      else
        warn "Idea failed: $(echo "$IDEA_RESP" | head -c 100)"
      fi
    done
  else
    if [[ "$SKIP_IF_EXISTS" == "true" ]]; then
      warn "Team Pixel Pirates already exists or failed"
    else
      warn "Team response: $(echo "$TEAM_RESP" | head -c 120)"
    fi
  fi
else
  if [[ "$SKIP_IF_EXISTS" == "true" ]]; then
    warn "Hackathon already exists or failed — skipping"
  else
    warn "Hackathon response: $(echo "$HACK_RESP" | head -c 120)"
  fi
fi

# ── Summary ────────────────────────────────────────────────────────────────────
printf "\n"
printf "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
printf "${GREEN}${BOLD}  Dev seed complete.${RESET}\n"
printf "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
printf "\n"
printf "  Accounts:\n"
printf "    admin@hackhub.wtf    / Admin1234!    (admin)\n"
printf "    manager@hackhub.wtf  / Manager1234!  (manager)\n"
printf "    alice@example.com    / Alice1234!    (participant)\n"
printf "    bob@example.com      / Bob12345!     (participant)\n"
printf "    carol@example.com    / Carol123!     (participant)\n"
printf "\n"
if [[ -n "$REG_KEY" ]]; then
  printf "  Hackathon join key: ${BOLD}%s${RESET}\n" "$REG_KEY"
  printf "\n"
fi
printf "  Swagger UI: %s/swagger-ui/index.html\n" "$API"
printf "\n"
