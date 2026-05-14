#!/usr/bin/env bash
# install.sh — HackHub first-run installer
#
# Usage: ./scripts/install.sh [OPTIONS]
#   --api-url URL          API base URL (default: http://localhost:8080)
#   --admin-email EMAIL    Admin email
#   --admin-name NAME      Admin display name
#   --admin-password PASS  Admin password (min 8 chars, 1 upper, 1 number)
#   --platform-name NAME   Platform display name (default: HackHub)
#   --demo                 Also create demo org, hackathon, and sample users
#   --force                Re-run even if data already exists
#   --non-interactive      Fail if required flags are missing (for CI)
#   -h, --help             Show this help

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
API_URL="http://localhost:8080"
ADMIN_EMAIL=""
ADMIN_NAME=""
ADMIN_PASSWORD=""
PLATFORM_NAME="HackHub"
DEMO=false
FORCE=false
NON_INTERACTIVE=false

# ── Parse flags ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-url)         API_URL="$2";        shift 2 ;;
    --admin-email)     ADMIN_EMAIL="$2";    shift 2 ;;
    --admin-name)      ADMIN_NAME="$2";     shift 2 ;;
    --admin-password)  ADMIN_PASSWORD="$2"; shift 2 ;;
    --platform-name)   PLATFORM_NAME="$2";  shift 2 ;;
    --demo)            DEMO=true;           shift ;;
    --force)           FORCE=true;          shift ;;
    --non-interactive) NON_INTERACTIVE=true; shift ;;
    -h|--help)         usage ;;
    *) die "Unknown option: $1. Use -h for help." ;;
  esac
done

# ── Helpers ────────────────────────────────────────────────────────────────────
validate_email() {
  [[ "$1" =~ ^[^@]+@[^@]+\.[^@]+$ ]]
}

validate_password() {
  local p="$1"
  [[ ${#p} -ge 8 ]]
}

password_is_strong() {
  local p="$1"
  [[ "$p" =~ [A-Z] ]] && [[ "$p" =~ [0-9] ]]
}

prompt_required() {
  local var_name="$1" prompt_text="$2" secret="${3:-false}"
  local value=""
  while [[ -z "$value" ]]; do
    if [[ "$secret" == "true" ]]; then
      read -r -s -p "  $prompt_text: " value
      echo ""
    else
      read -r -p "  $prompt_text: " value
    fi
    [[ -z "$value" ]] && warn "This field is required."
  done
  printf '%s' "$value"
}

# ── Wait for API ───────────────────────────────────────────────────────────────
MAX_RETRIES=20
RETRY_INTERVAL=3

step "Checking API connectivity"
info "Target: $API_URL"

for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/api/v1/auth/login" \
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

# ── Already installed check ────────────────────────────────────────────────────
step "Checking install state"

USERS_RESP=$(curl -s -o /dev/null -w "%{http_code}" \
  "$API_URL/api/v1/admin/users" 2>/dev/null || echo "000")

# A 200 with users means already installed; 401/403 is ambiguous at this point
# We use the register endpoint: if it rejects because a user already exists, we
# fall back to checking the login endpoint with a sentinel. Simplest reliable
# check: attempt register with a dummy payload and see if the service is virgin.
# Actually: hit GET /api/v1/admin/users without auth — 401 expected when not
# installed yet too. Best signal is: try to register, if it works we're first.
# Use the explicit flag to decide.

if [[ "$FORCE" == "false" ]]; then
  # Try a login with a clearly-wrong credential and look for a structured JSON
  # error (not a 503 or connection error). If the API is up and returns any
  # structured response, a previous install may exist. We rely on the user
  # passing --force to override, keeping the check lightweight.
  PROBE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"__probe__@hackhub-install-check.invalid","password":"__probe__"}' 2>/dev/null || true)

  if echo "$PROBE" | grep -q '"accessToken"'; then
    warn "HackHub appears to already be installed (a user with probe credentials exists!)."
    warn "Use --force to reinstall."
    exit 1
  fi
fi

ok "Ready to install"

# ── Gather inputs ──────────────────────────────────────────────────────────────
step "Configuration"

if [[ "$NON_INTERACTIVE" == "true" ]]; then
  [[ -z "$ADMIN_EMAIL" ]]    && die "--admin-email is required in non-interactive mode"
  [[ -z "$ADMIN_NAME" ]]     && die "--admin-name is required in non-interactive mode"
  [[ -z "$ADMIN_PASSWORD" ]] && die "--admin-password is required in non-interactive mode"
else
  if [[ -z "$ADMIN_EMAIL" ]]; then
    while true; do
      ADMIN_EMAIL=$(prompt_required "ADMIN_EMAIL" "Admin email")
      validate_email "$ADMIN_EMAIL" && break
      warn "Invalid email format. Try again."
    done
  else
    validate_email "$ADMIN_EMAIL" || die "Invalid email: $ADMIN_EMAIL"
  fi

  if [[ -z "$ADMIN_NAME" ]]; then
    ADMIN_NAME=$(prompt_required "ADMIN_NAME" "Admin display name")
  fi

  if [[ -z "$ADMIN_PASSWORD" ]]; then
    while true; do
      ADMIN_PASSWORD=$(prompt_required "ADMIN_PASSWORD" "Admin password (min 8 chars)" "true")
      validate_password "$ADMIN_PASSWORD" && break
      warn "Password must be at least 8 characters."
    done
    if ! password_is_strong "$ADMIN_PASSWORD"; then
      warn "Weak password: consider adding an uppercase letter and a number."
    fi
  fi

  if [[ -z "$PLATFORM_NAME" || "$PLATFORM_NAME" == "HackHub" ]]; then
    read -r -p "  Platform name [HackHub]: " _pname
    [[ -n "$_pname" ]] && PLATFORM_NAME="$_pname"
  fi
fi

validate_password "$ADMIN_PASSWORD" || die "Password must be at least 8 characters."

info "Admin email:    $ADMIN_EMAIL"
info "Admin name:     $ADMIN_NAME"
info "Platform name:  $PLATFORM_NAME"
info "API URL:        $API_URL"
info "Demo data:      $DEMO"

# ── Register admin account ─────────────────────────────────────────────────────
step "Creating admin account"

REGISTER_RESP=$(curl -s -X POST "$API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"name\":\"$ADMIN_NAME\",\"password\":\"$ADMIN_PASSWORD\"}" 2>&1) || true

if echo "$REGISTER_RESP" | grep -q '"accessToken"'; then
  ADMIN_TOKEN=$(echo "$REGISTER_RESP" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  ok "Registered: $ADMIN_EMAIL"
else
  # Already exists — try login
  LOGIN_RESP=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>&1) || true

  if echo "$LOGIN_RESP" | grep -q '"accessToken"'; then
    ADMIN_TOKEN=$(echo "$LOGIN_RESP" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    warn "Account already exists — logged in as $ADMIN_EMAIL"
  else
    err "Register response: $REGISTER_RESP"
    die "Could not register or log in as $ADMIN_EMAIL. Check credentials or use --force."
  fi
fi

# ── Promote to admin role via DB ───────────────────────────────────────────────
step "Promoting to admin role"

if docker exec hackhub-postgres psql -U hackhub -d hackhub -c \
    "UPDATE profiles SET role='admin' WHERE email='$ADMIN_EMAIL';" > /dev/null 2>&1; then
  ok "Role set to admin in DB"
else
  warn "Could not reach hackhub-postgres container."
  warn "Run this SQL manually to promote the admin:"
  warn "  UPDATE profiles SET role='admin' WHERE email='$ADMIN_EMAIL';"
fi

# Re-login to pick up the updated role in the token
RELOGIN=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>&1) || true

if echo "$RELOGIN" | grep -q '"accessToken"'; then
  ADMIN_TOKEN=$(echo "$RELOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  ok "Re-authenticated with admin role"
fi

# ── Demo data (optional) ───────────────────────────────────────────────────────
if [[ "$DEMO" == "true" ]]; then
  step "Creating demo data"

  # Manager account
  MANAGER_RESP=$(curl -s -X POST "$API_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"manager@hackhub.wtf","name":"Demo Manager","password":"Manager1234!"}' 2>&1) || true

  if echo "$MANAGER_RESP" | grep -q '"accessToken"'; then
    MANAGER_TOKEN=$(echo "$MANAGER_RESP" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  else
    LOGIN2=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"manager@hackhub.wtf","password":"Manager1234!"}' 2>&1) || true
    MANAGER_TOKEN=$(echo "$LOGIN2" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)
  fi

  docker exec hackhub-postgres psql -U hackhub -d hackhub -c \
    "UPDATE profiles SET role='manager' WHERE email='manager@hackhub.wtf';" > /dev/null 2>&1 || true
  ok "manager@hackhub.wtf (manager)"

  # Participant accounts
  for spec in "alice@example.com:Alice Chen:Alice1234!" "bob@example.com:Bob Smith:Bob12345!" "carol@example.com:Carol Davis:Carol123!"; do
    IFS=':' read -r _email _name _pass <<< "$spec"
    curl -s -X POST "$API_URL/api/v1/auth/register" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$_email\",\"name\":\"$_name\",\"password\":\"$_pass\"}" > /dev/null 2>&1 || true
    ok "$_email (participant)"
  done

  ALICE_TOKEN=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"alice@example.com","password":"Alice1234!"}' 2>&1 | \
    grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)

  BOB_TOKEN=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"bob@example.com","password":"Bob12345!"}' 2>&1 | \
    grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)

  CAROL_TOKEN=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"carol@example.com","password":"Carol123!"}' 2>&1 | \
    grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || true)

  # Demo org
  ORG_RESP=$(curl -s -X POST "$API_URL/api/v1/organizations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"name":"Demo Corp","slug":"demo-corp"}' 2>&1) || true

  if echo "$ORG_RESP" | grep -q '"id"'; then
    ok "Organization: Demo Corp"
  else
    warn "Org already exists or error: $(echo "$ORG_RESP" | head -c 120)"
  fi

  # Hackathon
  START=$(date -u -v+7d '+%Y-%m-%dT00:00:00Z' 2>/dev/null || date -u -d '+7 days' '+%Y-%m-%dT00:00:00Z')
  END=$(date -u -v+9d '+%Y-%m-%dT00:00:00Z' 2>/dev/null || date -u -d '+9 days' '+%Y-%m-%dT00:00:00Z')

  HACK_RESP=$(curl -s -X POST "$API_URL/api/v1/hackathons" \
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
  if echo "$HACK_RESP" | grep -q '"id"'; then
    HACK_ID=$(echo "$HACK_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    ok "Hackathon: Spring 2026 ($HACK_ID)"

    curl -s -X PATCH "$API_URL/api/v1/hackathons/$HACK_ID/status" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -d '{"status":"open"}' > /dev/null 2>&1 || true
    ok "Status set to OPEN"

    REG_KEY=$(curl -s "$API_URL/api/v1/hackathons/$HACK_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null | \
      grep -o '"registrationKey":"[^"]*"' | cut -d'"' -f4 || true)

    if [[ -n "$REG_KEY" ]]; then
      for _tok in "$ALICE_TOKEN" "$BOB_TOKEN" "$CAROL_TOKEN" "${MANAGER_TOKEN:-}"; do
        [[ -z "$_tok" ]] && continue
        curl -s -X POST "$API_URL/api/v1/hackathons/join" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $_tok" \
          -d "{\"registrationKey\":\"$REG_KEY\"}" > /dev/null 2>&1 || true
      done
      ok "Participants joined hackathon"
    fi

    # Judging config
    if [[ -n "$ADMIN_TOKEN" && -n "$HACK_ID" ]]; then
      curl -s -X PATCH "$API_URL/api/v1/hackathons/$HACK_ID/config" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{"judgingMode":"blended","panelWeight":70}' > /dev/null && \
        ok "Judging mode: blended (70% panel / 30% community)"
    fi

    # Assign manager as judge
    MANAGER_ID=$(curl -s "$API_URL/api/v1/admin/users?size=200" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | \
      grep -o '"id":"[^"]*","[^"]*","[^"]*email":"manager@hackhub.wtf"' | \
      grep -o '"id":"[^"]*"' | cut -d'"' -f4 || true)
    if [[ -n "$MANAGER_ID" && -n "$HACK_ID" ]]; then
      curl -s -X POST "$API_URL/api/v1/hackathons/$HACK_ID/judging/judges" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{\"userId\":\"$MANAGER_ID\"}" > /dev/null && \
        ok "Assigned manager as judge"
    fi

    # Team
    TEAM_RESP=$(curl -s -X POST "$API_URL/api/v1/hackathons/$HACK_ID/teams" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ALICE_TOKEN" \
      -d '{"name":"Pixel Pirates","description":"We build things that matter."}' 2>&1) || true

    if echo "$TEAM_RESP" | grep -q '"id"'; then
      TEAM_ID=$(echo "$TEAM_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
      ok "Team: Pixel Pirates ($TEAM_ID)"

      # Ideas
      for entry in "AI-Powered Code Review:AI" "Real-Time Collaboration Board:Web"; do
        title="${entry%%:*}"
        category="${entry##*:}"
        IDEA_RESP=$(curl -s -X POST "$API_URL/api/v1/hackathons/$HACK_ID/ideas" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $ALICE_TOKEN" \
          -d "{\"title\":\"$title\",\"description\":\"A great idea submitted by the Pixel Pirates.\",\"category\":\"$category\",\"teamId\":\"$TEAM_ID\",\"tags\":[\"$category\"]}" 2>&1) || true
        if echo "$IDEA_RESP" | grep -q '"id"'; then
          ok "Idea: $title"
        else
          warn "Idea creation failed: $(echo "$IDEA_RESP" | head -c 100)"
        fi
      done
    else
      warn "Team creation failed or already exists"
    fi
  else
    warn "Hackathon already exists or error: $(echo "$HACK_RESP" | head -c 120)"
  fi
fi

# ── Success banner ─────────────────────────────────────────────────────────────
printf "\n"
printf "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
printf "${GREEN}${BOLD}  %s installed successfully!${RESET}\n" "$PLATFORM_NAME"
printf "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
printf "\n"
printf "  Admin email:   ${BOLD}%s${RESET}\n" "$ADMIN_EMAIL"
printf "  Platform URL:  ${BOLD}%s${RESET}\n" "http://localhost"
printf "  API / Swagger: ${BOLD}%s/swagger-ui/index.html${RESET}\n" "$API_URL"
printf "\n"

if [[ "$DEMO" == "true" ]]; then
  printf "  Demo accounts:\n"
  printf "    manager@hackhub.wtf  / Manager1234!  (manager)\n"
  printf "    alice@example.com    / Alice1234!    (participant)\n"
  printf "    bob@example.com      / Bob12345!     (participant)\n"
  printf "    carol@example.com    / Carol123!     (participant)\n"
  if [[ -n "${REG_KEY:-}" ]]; then
    printf "\n"
    printf "  Hackathon join key: ${BOLD}%s${RESET}\n" "$REG_KEY"
  fi
  printf "  Judging mode:  blended (70%% panel / 30%% community)\n"
  printf "  Panel judges:  manager@hackhub.wtf\n"
  printf "\n"
fi

printf "  Run ${BOLD}./scripts/reset.sh${RESET} to wipe all data and start over.\n"
printf "\n"
