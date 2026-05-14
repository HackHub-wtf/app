#!/usr/bin/env bash
# test-down.sh — Tear down E2E test data created by test-up.sh
#
# Usage:
#   ./scripts/test-down.sh                         # reads tests/e2e/.test-state.json
#   STATE_FILE=/path/to/state.json ./scripts/test-down.sh
#   ./scripts/test-down.sh --force                 # also removes all "e2e-*" leftovers
#
# Copyright (C) 2024-2026 Kinn Coelho Juliao <kinncj@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
if [[ -t 1 && -z "${NO_COLOR:-}" && "${TERM:-}" != "dumb" ]]; then
  GRN='\033[0;32m'; YLW='\033[0;33m'; RED='\033[0;31m'; CYN='\033[0;36m'
  BOLD='\033[1m'; DIM='\033[2m'; RST='\033[0m'
else
  GRN=''; YLW=''; RED=''; CYN=''; BOLD=''; DIM=''; RST=''
fi

ok()   { printf "  ${GRN}✓${RST}  %s\n" "$1"; }
step() { printf "\n${CYN}${BOLD}▶ %s${RST}\n" "$1"; }
warn() { printf "  ${YLW}⚠${RST}  %s\n" "$1"; }
info() { printf "  ${DIM}%s${RST}\n" "$1"; }
die()  { printf "\n${RED}${BOLD}✗ %s${RST}\n\n" "$1" >&2; exit 1; }

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_FILE="${STATE_FILE:-$ROOT_DIR/tests/e2e/.test-state.json}"
FORCE="${1:-}"

# ── Helpers ───────────────────────────────────────────────────────────────────
psql_exec() {
  docker exec hackhub-postgres psql -U hackhub -d hackhub -c "$1" > /dev/null 2>&1
}

psql_exec_silent() {
  docker exec hackhub-postgres psql -U hackhub -d hackhub -c "$1" 2>/dev/null | grep -v "^$\|^-\|row\b" || true
}

jq_field() {
  # Lightweight jq using python — no dependency on jq binary
  python3 -c "import sys,json; d=json.load(open('${STATE_FILE}')); print(d${1})" 2>/dev/null || echo ""
}

# ── State file check ──────────────────────────────────────────────────────────
if [[ ! -f "$STATE_FILE" ]]; then
  if [[ "$FORCE" == "--force" ]]; then
    warn "No state file found — running force cleanup of all e2e-* data"
  else
    die "State file not found: ${STATE_FILE}
Run ./scripts/test-up.sh first, or use --force to wipe all e2e-* data."
  fi
fi

printf "\n${BOLD}HackHub E2E Teardown${RST}\n"
[[ -f "$STATE_FILE" ]] && info "State: ${STATE_FILE}"

# ── Read IDs from state ───────────────────────────────────────────────────────
if [[ -f "$STATE_FILE" ]]; then
  HACK_ID=$(jq_field "['hackathon']['id']")
  ORG_ID=$(jq_field "['org']['id']")
  TEAM_ID=$(jq_field "['team']['id']")
  IDEA1_ID=$(jq_field "['ideas']['idea1']")
  IDEA2_ID=$(jq_field "['ideas']['idea2']")
  ADMIN_EMAIL=$(jq_field "['users']['admin']['email']")
  MGR_EMAIL=$(jq_field "['users']['manager']['email']")
  JUDGE_EMAIL=$(jq_field "['users']['judge']['email']")
  P1_EMAIL=$(jq_field "['users']['p1']['email']")
  P2_EMAIL=$(jq_field "['users']['p2']['email']")
  P3_EMAIL=$(jq_field "['users']['p3']['email']")
fi

# ── Delete via DB (cascade handles child rows) ────────────────────────────────
step "Removing test data"

# Ideas → teams → hackathons → orgs (cascade deletes linked rows)
if [[ -n "${IDEA1_ID:-}" ]]; then
  psql_exec "DELETE FROM ideas WHERE id IN ('${IDEA1_ID}','${IDEA2_ID}');" 2>/dev/null || true
  ok "Deleted test ideas"
fi

if [[ -n "${TEAM_ID:-}" ]]; then
  psql_exec "DELETE FROM teams WHERE id='${TEAM_ID}';" 2>/dev/null || true
  ok "Deleted team"
fi

if [[ -n "${HACK_ID:-}" ]]; then
  psql_exec "DELETE FROM hackathons WHERE id='${HACK_ID}';" 2>/dev/null || true
  ok "Deleted hackathon (cascades: members, criteria, scores, submissions, judges)"
fi

if [[ -n "${ORG_ID:-}" ]]; then
  psql_exec "DELETE FROM organizations WHERE id='${ORG_ID}';" 2>/dev/null || true
  ok "Deleted organisation (cascades: members, invitations)"
fi

# ── Delete test users ─────────────────────────────────────────────────────────
step "Removing test users"

ALL_EMAILS=""
for v in "${ADMIN_EMAIL:-}" "${MGR_EMAIL:-}" "${JUDGE_EMAIL:-}" \
          "${P1_EMAIL:-}" "${P2_EMAIL:-}" "${P3_EMAIL:-}"; do
  [[ -n "$v" ]] && ALL_EMAILS="${ALL_EMAILS}'${v}',"
done
ALL_EMAILS="${ALL_EMAILS%,}"  # trim trailing comma

if [[ -n "$ALL_EMAILS" ]]; then
  # Remove refresh tokens first (FK), then profiles
  psql_exec "DELETE FROM refresh_tokens
             WHERE user_id IN (SELECT id FROM profiles WHERE email IN (${ALL_EMAILS}));" 2>/dev/null || true
  psql_exec "DELETE FROM profiles WHERE email IN (${ALL_EMAILS});" 2>/dev/null || true
  ok "Deleted test user profiles"
fi

# ── Force mode: sweep any remaining e2e-* data ────────────────────────────────
if [[ "$FORCE" == "--force" ]]; then
  step "Force-sweeping all e2e-* data"

  # Profiles with test emails (stable pattern and legacy e2e-* pattern)
  psql_exec "DELETE FROM refresh_tokens WHERE user_id IN
             (SELECT id FROM profiles WHERE email LIKE '%@test.hackhub' OR email LIKE 'e2e-%@%');" \
             2>/dev/null || true
  psql_exec "DELETE FROM profiles WHERE email LIKE '%@test.hackhub' OR email LIKE 'e2e-%@%';" \
             2>/dev/null || true
  ok "Swept test profiles"

  # Orgs/hackathons by known fixture names and legacy E2E prefix
  psql_exec "DELETE FROM hackathons WHERE title IN ('Test Hackathon') OR title LIKE 'E2E %';" 2>/dev/null || true
  psql_exec "DELETE FROM organizations WHERE name IN ('Test Org') OR name LIKE 'E2E %' OR slug LIKE 'e2e-%' OR slug = 'test-org';" \
             2>/dev/null || true
  ok "Swept test hackathons and organisations"
fi

# ── Remove state file ─────────────────────────────────────────────────────────
step "Cleaning up"

if [[ -f "$STATE_FILE" ]]; then
  rm "$STATE_FILE"
  ok "Deleted ${STATE_FILE}"
fi

# Remove any Playwright traces/screenshots left by failed runs
ARTIFACTS_DIR="$ROOT_DIR/tests/test-results"
if [[ -d "$ARTIFACTS_DIR" ]]; then
  rm -rf "$ARTIFACTS_DIR"
  ok "Cleared test-results/"
fi

printf "\n${BOLD}${GRN}Teardown complete.${RST}\n\n"
