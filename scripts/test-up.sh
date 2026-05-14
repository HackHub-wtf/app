#!/usr/bin/env bash
# test-up.sh — Provision E2E test fixtures and write state to tests/e2e/.test-state.json
#
# Usage:
#   ./scripts/test-up.sh                         # default http://localhost:8080
#   API_URL=http://staging.example.com ./scripts/test-up.sh
#
# Users created (stable emails, same password every run):
#
#   admin@test.hackhub   / Password123   — platform admin, can do everything
#   manager@test.hackhub / Password123   — org manager, creates hackathons
#   user@test.hackhub    / Password123   — participant, team leader
#   user2@test.hackhub   / Password123   — participant, team member
#   user3@test.hackhub   / Password123   — participant, no team (solo)
#   judge@test.hackhub   / Password123   — judging panel member
#
# Fixtures:
#   - 1 organisation  (Test Org)
#   - 1 hackathon     (Test Hackathon, status: open, blended judging 70/30)
#   - 3 voting criteria summing to 100%
#   - 1 team          (Team Alpha — user is leader, user2 is member)
#   - judge assigned to hackathon
#
# Output: tests/e2e/.test-state.json  (consumed by Playwright helpers)
#
# Copyright (C) 2024-2026 Kinn Coelho Juliao <kinncj@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
if [[ -t 1 && -z "${NO_COLOR:-}" && "${TERM:-}" != "dumb" ]]; then
  GRN='\033[0;32m'; YLW='\033[0;33m'; RED='\033[0;31m'; CYN='\033[0;36m'
  BOLD='\033[1m'; DIM='\033[2m'; RST='\033[0m'
else
  GRN=''; YLW=''; RED=''; CYN=''; BOLD=''; DIM=''; RST=''
fi

ok()   { printf "  ${GRN}✓${RST}  %s\n" "$1"; }
step() { printf "\n${CYN}${BOLD}▶ %s${RST}\n" "$1"; }
warn() { printf "  ${YLW}⚠${RST}  %s\n" "$1"; }
die()  { printf "\n${RED}${BOLD}✗ %s${RST}\n\n" "$1" >&2; exit 1; }
info() { printf "  ${DIM}%s${RST}\n" "$1"; }

# ── Config ────────────────────────────────────────────────────────────────────
API_URL="${API_URL:-http://localhost:8080}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_FILE="$ROOT_DIR/tests/e2e/.test-state.json"

# Stable credentials — same every run so you can log in manually too
PASS="Password123"

ADMIN_EMAIL="admin@test.hackhub"
ADMIN_NAME="Test Admin"

MGR_EMAIL="manager@test.hackhub"
MGR_NAME="Test Manager"

USER_EMAIL="user@test.hackhub"
USER_NAME="Test User"

USER2_EMAIL="user2@test.hackhub"
USER2_NAME="Test User Two"

USER3_EMAIL="user3@test.hackhub"
USER3_NAME="Test User Three"

JUDGE_EMAIL="judge@test.hackhub"
JUDGE_NAME="Test Judge"

# ── Helpers ───────────────────────────────────────────────────────────────────
api() {
  local method="$1" path="$2" body="${3:-}" auth="${4:-}"
  local args=(-s -X "$method" "${API_URL}${path}" -H "Content-Type: application/json")
  [[ -n "$auth" ]] && args+=(-H "Authorization: Bearer $auth")
  [[ -n "$body" ]] && args+=(-d "$body")
  curl "${args[@]}"
}

# Returns access token or empty string on failure
try_login() {
  local email="$1" pass="$2"
  api POST /api/v1/auth/login "{\"email\":\"$email\",\"password\":\"$pass\"}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken',''))" 2>/dev/null || true
}

# Returns access token (tries login first, registers if needed)
register_or_login() {
  local email="$1" name="$2" pass="$3"
  local tok
  tok=$(try_login "$email" "$pass")
  if [[ -n "$tok" ]]; then
    echo "$tok"
    return
  fi
  # Not yet registered — create account
  local resp
  resp=$(api POST /api/v1/auth/register \
    "{\"email\":\"$email\",\"name\":\"$name\",\"password\":\"$pass\",\"organization\":\"\"}" \
    2>/dev/null || true)
  tok=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken',''))" 2>/dev/null || true)
  if [[ -z "$tok" ]]; then
    # Some backends require non-empty org — retry with a placeholder
    resp=$(api POST /api/v1/auth/register \
      "{\"email\":\"$email\",\"name\":\"$name\",\"password\":\"$pass\",\"organization\":\"test\"}" 2>/dev/null || true)
    tok=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken',''))" 2>/dev/null || true)
  fi
  echo "$tok"
}

# Get user ID from admin /users endpoint
get_user_id() {
  local email="$1" admin_tok="$2"
  api GET "/api/v1/admin/users?size=200" "" "$admin_tok" \
    | python3 -c "
import sys, json
users = json.load(sys.stdin).get('content', [])
match = [u for u in users if u['email'] == '$email']
print(match[0]['id'] if match else '')
" 2>/dev/null || true
}

db() { docker exec hackhub-postgres psql -U hackhub -d hackhub -c "$1" > /dev/null 2>&1; }

# ── Preflight ─────────────────────────────────────────────────────────────────
step "Checking API"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/v1/hackathons" 2>/dev/null || echo "000")
[[ "$HTTP" == "000" ]] && die "API at ${API_URL} is not responding. Is the stack running?"
ok "API up at ${API_URL} (HTTP ${HTTP})"

# ── Wipe previous test fixtures (orgs/hackathons by name) ────────────────────
step "Clearing previous fixtures"
db "DELETE FROM hackathons WHERE title='Test Hackathon';" 2>/dev/null || true
db "DELETE FROM org_invitations WHERE organization_id IN (SELECT id FROM organizations WHERE name='Test Org');" 2>/dev/null || true
db "DELETE FROM organization_members WHERE organization_id IN (SELECT id FROM organizations WHERE name='Test Org');" 2>/dev/null || true
db "DELETE FROM organizations WHERE name='Test Org';" 2>/dev/null || true
db "DELETE FROM org_invitations WHERE organization_id IN (SELECT id FROM organizations WHERE name='E2E Org');" 2>/dev/null || true
db "DELETE FROM organization_members WHERE organization_id IN (SELECT id FROM organizations WHERE name='E2E Org');" 2>/dev/null || true
db "DELETE FROM organizations WHERE name='E2E Org';" 2>/dev/null || true
db "DELETE FROM hackathons WHERE title IN ('Admin Perm Test','Mgr Perm Test','E2E Hackathon');" 2>/dev/null || true
db "DELETE FROM org_invitations WHERE invited_email LIKE 'invitee+%@e2e.test';" 2>/dev/null || true
db "DELETE FROM organization_members WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE 'invitee+%@e2e.test');" 2>/dev/null || true
db "DELETE FROM profiles WHERE email LIKE 'invitee+%@e2e.test';" 2>/dev/null || true
ok "Old fixtures cleared"

# ── Users ─────────────────────────────────────────────────────────────────────
step "Provisioning users"

ADMIN_TOK=$(register_or_login "$ADMIN_EMAIL" "$ADMIN_NAME" "$PASS")
[[ -n "$ADMIN_TOK" ]] || die "Could not register or login as admin"

# Promote to platform admin via DB, then re-login for fresh token
db "UPDATE profiles SET role='admin' WHERE email='${ADMIN_EMAIL}';" \
  && ok "${ADMIN_EMAIL}  →  admin (promoted)" \
  || warn "DB promote failed (may already be admin)"
ADMIN_TOK=$(try_login "$ADMIN_EMAIL" "$PASS")
[[ -n "$ADMIN_TOK" ]] || die "Admin re-login failed after promotion"

# Manager
register_or_login "$MGR_EMAIL" "$MGR_NAME" "$PASS" > /dev/null
db "UPDATE profiles SET role='manager' WHERE email='${MGR_EMAIL}';" || true
ok "${MGR_EMAIL}  →  manager"

# Participants
register_or_login "$USER_EMAIL"  "$USER_NAME"  "$PASS" > /dev/null
register_or_login "$USER2_EMAIL" "$USER2_NAME" "$PASS" > /dev/null
register_or_login "$USER3_EMAIL" "$USER3_NAME" "$PASS" > /dev/null
ok "${USER_EMAIL}, ${USER2_EMAIL}, ${USER3_EMAIL}  →  participant"

# Judge
register_or_login "$JUDGE_EMAIL" "$JUDGE_NAME" "$PASS" > /dev/null
ok "${JUDGE_EMAIL}  →  participant (judge role assigned at hackathon level)"

# Collect IDs
ADMIN_ID=$(get_user_id "$ADMIN_EMAIL" "$ADMIN_TOK")
MGR_ID=$(get_user_id "$MGR_EMAIL" "$ADMIN_TOK")
USER_ID=$(get_user_id "$USER_EMAIL" "$ADMIN_TOK")
USER2_ID=$(get_user_id "$USER2_EMAIL" "$ADMIN_TOK")
USER3_ID=$(get_user_id "$USER3_EMAIL" "$ADMIN_TOK")
JUDGE_ID=$(get_user_id "$JUDGE_EMAIL" "$ADMIN_TOK")

[[ -n "$ADMIN_ID" ]]  || die "Could not resolve admin ID"
[[ -n "$MGR_ID" ]]    || die "Could not resolve manager ID"
[[ -n "$USER_ID" ]]   || die "Could not resolve user ID"
[[ -n "$USER2_ID" ]]  || die "Could not resolve user2 ID"
[[ -n "$USER3_ID" ]]  || die "Could not resolve user3 ID"
[[ -n "$JUDGE_ID" ]]  || die "Could not resolve judge ID"

# ── Organisation ──────────────────────────────────────────────────────────────
step "Creating organisation"

ORG=$(api POST /api/v1/organizations '{"name":"Test Org","slug":"test-org"}' "$ADMIN_TOK")
ORG_ID=$(echo "$ORG" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)
[[ -n "$ORG_ID" ]] || die "Failed to create organisation"
ok "Test Org  (id: ${ORG_ID})"

# Add all users as org members via DB
db "INSERT INTO organization_members (id, organization_id, user_id, role) VALUES
  (gen_random_uuid(), '${ORG_ID}', '${MGR_ID}',    'manager'),
  (gen_random_uuid(), '${ORG_ID}', '${USER_ID}',   'member'),
  (gen_random_uuid(), '${ORG_ID}', '${USER2_ID}',  'member'),
  (gen_random_uuid(), '${ORG_ID}', '${USER3_ID}',  'member'),
  (gen_random_uuid(), '${ORG_ID}', '${JUDGE_ID}',  'judge')
  ON CONFLICT DO NOTHING;" && ok "All users added to org"

# ── Hackathon ─────────────────────────────────────────────────────────────────
step "Creating hackathon"

MGR_TOK=$(try_login "$MGR_EMAIL" "$PASS")
[[ -n "$MGR_TOK" ]] || die "Manager login failed"

START=$(date -u -d "+1 day" '+%Y-%m-%dT00:00:00Z' 2>/dev/null \
  || date -u -v+1d '+%Y-%m-%dT00:00:00Z')
END=$(date -u -d "+8 days" '+%Y-%m-%dT00:00:00Z' 2>/dev/null \
  || date -u -v+8d '+%Y-%m-%dT00:00:00Z')

HACK=$(api POST /api/v1/hackathons \
  "{\"title\":\"Test Hackathon\",\"description\":\"Full-featured test fixture for all user journeys.\",
    \"startDate\":\"${START}\",\"endDate\":\"${END}\",
    \"maxTeamSize\":5,\"allowedParticipants\":100,
    \"organizationId\":\"${ORG_ID}\",\"tags\":[\"test\",\"ai\",\"web\"]}" "$ADMIN_TOK")
HACK_ID=$(echo "$HACK" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)
[[ -n "$HACK_ID" ]] || die "Failed to create hackathon"

REG_KEY=$(echo "$HACK" | python3 -c "import sys,json; print(json.load(sys.stdin)['registrationKey'])")

# Open for registration
api PATCH "/api/v1/hackathons/${HACK_ID}/status" '{"status":"open"}' "$ADMIN_TOK" > /dev/null
ok "Test Hackathon  (key: ${REG_KEY})"

# Judging: blended 70% panel / 30% community
api PATCH "/api/v1/hackathons/${HACK_ID}/config" \
  '{"judgingMode":"blended","panelWeight":70,"visibility":"public","joinPolicy":"self_register"}' \
  "$ADMIN_TOK" > /dev/null
ok "Judging: blended 70/30"

# ── Voting criteria ───────────────────────────────────────────────────────────
step "Creating voting criteria"

C1=$(api POST "/api/v1/hackathons/${HACK_ID}/voting-criteria" \
  '{"name":"Innovation","description":"How novel and creative is the solution?","weight":40}' "$ADMIN_TOK")
C1_ID=$(echo "$C1" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)
ok "Innovation (40%)"

C2=$(api POST "/api/v1/hackathons/${HACK_ID}/voting-criteria" \
  '{"name":"Execution","description":"How well is it built and presented?","weight":40}' "$ADMIN_TOK")
C2_ID=$(echo "$C2" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)
ok "Execution (40%)"

C3=$(api POST "/api/v1/hackathons/${HACK_ID}/voting-criteria" \
  '{"name":"Impact","description":"What real-world problem does it solve?","weight":20}' "$ADMIN_TOK")
C3_ID=$(echo "$C3" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)
ok "Impact (20%)"

# ── Participants join hackathon ────────────────────────────────────────────────
step "Joining hackathon"

USER_TOK=$(try_login "$USER_EMAIL" "$PASS")
USER2_TOK=$(try_login "$USER2_EMAIL" "$PASS")
USER3_TOK=$(try_login "$USER3_EMAIL" "$PASS")

for tok in "$USER_TOK" "$USER2_TOK" "$USER3_TOK"; do
  api POST /api/v1/hackathons/join "{\"registrationKey\":\"${REG_KEY}\"}" "$tok" > /dev/null 2>&1 || true
done
ok "user, user2, user3 joined"

# ── Team ─────────────────────────────────────────────────────────────────────
step "Creating team"

TEAM=$(api POST "/api/v1/hackathons/${HACK_ID}/teams" \
  "{\"name\":\"Team Alpha\",\"description\":\"Main test team — user leads, user2 is member.\",
    \"hackathonId\":\"${HACK_ID}\",\"skills\":[\"python\",\"react\",\"ai\"]}" "$USER_TOK")
TEAM_ID=$(echo "$TEAM" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || true)
[[ -n "$TEAM_ID" ]] || die "Failed to create team"
ok "Team Alpha  (leader: user)"

# user2 joins team
api POST "/api/v1/teams/${TEAM_ID}/members" "" "$USER2_TOK" > /dev/null 2>&1 || true
ok "user2 joined Team Alpha"

# user3 stays solo (no team) — intentional for testing that path

# ── Judge assignment ──────────────────────────────────────────────────────────
step "Assigning judge"

api POST "/api/v1/hackathons/${HACK_ID}/judging/judges" \
  "{\"userId\":\"${JUDGE_ID}\"}" "$ADMIN_TOK" > /dev/null 2>&1 \
  && ok "${JUDGE_EMAIL} assigned to judging panel" \
  || warn "Could not assign judge via API (non-fatal)"

# ── Write state file ─────────────────────────────────────────────────────────
step "Writing state"

mkdir -p "$(dirname "$STATE_FILE")"
cat > "$STATE_FILE" << JSON
{
  "createdAt": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "users": {
    "admin":   { "id": "${ADMIN_ID}",  "email": "${ADMIN_EMAIL}",  "password": "${PASS}", "role": "admin"       },
    "manager": { "id": "${MGR_ID}",    "email": "${MGR_EMAIL}",    "password": "${PASS}", "role": "manager"     },
    "judge":   { "id": "${JUDGE_ID}",  "email": "${JUDGE_EMAIL}",  "password": "${PASS}", "role": "participant" },
    "p1":      { "id": "${USER_ID}",   "email": "${USER_EMAIL}",   "password": "${PASS}", "role": "participant" },
    "p2":      { "id": "${USER2_ID}",  "email": "${USER2_EMAIL}",  "password": "${PASS}", "role": "participant" },
    "p3":      { "id": "${USER3_ID}",  "email": "${USER3_EMAIL}",  "password": "${PASS}", "role": "participant" }
  },
  "org": {
    "id":   "${ORG_ID}",
    "slug": "test-org",
    "name": "Test Org"
  },
  "hackathon": {
    "id":              "${HACK_ID}",
    "title":           "Test Hackathon",
    "registrationKey": "${REG_KEY}",
    "judgingMode":     "blended",
    "panelWeight":     70
  },
  "team": {
    "id":   "${TEAM_ID}",
    "name": "Team Alpha"
  },
  "ideas": {
    "idea1": "",
    "idea2": ""
  },
  "criteria": {
    "innovation": "${C1_ID:-}",
    "execution":  "${C2_ID:-}",
    "impact":     "${C3_ID:-}"
  }
}
JSON

ok "State written → ${STATE_FILE}"

# ── Summary ───────────────────────────────────────────────────────────────────
printf "\n${BOLD}${GRN}Test environment ready.${RST}\n"
printf "\n  ${BOLD}All users share the same password: ${GRN}${PASS}${RST}\n\n"
printf "  ${BOLD}%-12s  %-28s  %s${RST}\n" "Role" "Email" "Can do"
printf "  ${DIM}%-12s  %-28s  %s${RST}\n" "────────────" "────────────────────────────" "──────────────────────────────────────"
printf "  %-12s  %-28s  %s\n" "admin"    "${ADMIN_EMAIL}"  "everything — orgs, users, hackathons"
printf "  %-12s  %-28s  %s\n" "manager"  "${MGR_EMAIL}"    "create hackathons, manage org members"
printf "  %-12s  %-28s  %s\n" "user"     "${USER_EMAIL}"   "participant, leader of Team Alpha"
printf "  %-12s  %-28s  %s\n" "user2"    "${USER2_EMAIL}"  "participant, member of Team Alpha"
printf "  %-12s  %-28s  %s\n" "user3"    "${USER3_EMAIL}"  "participant, no team (solo path)"
printf "  %-12s  %-28s  %s\n" "judge"    "${JUDGE_EMAIL}"  "assigned to judging panel"
printf "\n  ${BOLD}%-16s  %s${RST}\n" "Hackathon ID"  "${HACK_ID}"
printf "  ${BOLD}%-16s  %s${RST}\n"   "Org ID"        "${ORG_ID}"
printf "  ${BOLD}%-16s  %s${RST}\n"   "Team ID"       "${TEAM_ID}"
printf "  ${BOLD}%-16s  %s${RST}\n\n" "Reg key"       "${REG_KEY}"
printf "  Run tests:  ${BOLD}cd tests && npm run test:e2e${RST}\n"
printf "  Teardown:   ${BOLD}./scripts/test-down.sh${RST}\n\n"
