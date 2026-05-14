.PHONY: up up-infra down down-clean ps logs \
        build build-api build-app \
        test-all test-api test-app test-e2e test-e2e-clean reset-db \
        lint lint-api lint-app \
        migrate migrate-info seed clean \
        test-features-sync sdlc-report sdlc-rotate-logs sdlc-branch-protection help

# ── Stack ──────────────────────────────────────────────────────────────────────

## Start full stack (Postgres + MinIO + API + App)
up:
	docker compose up -d --wait

## Start infrastructure only (Postgres + MinIO) — for local Spring Boot dev
up-infra:
	docker compose up -d --wait postgres minio

## Stop all containers
down:
	docker compose down

## Stop all containers and remove volumes (destructive)
down-clean:
	docker compose down -v

## Show running containers
ps:
	docker compose ps

## Tail logs — pass service=api|app|postgres|minio for a single service
logs:
	docker compose logs -f $(service)

# ── Build ──────────────────────────────────────────────────────────────────────

## Build API + frontend
build: build-api build-app

## Build Spring Boot API jar
build-api:
	cd api && mvn package -DskipTests -q

## Build React frontend
build-app:
	cd app && npm run build

# ── Tests ──────────────────────────────────────────────────────────────────────

## Run all suites (CI gate — must pass before merge to main)
test-all: test-api test-app test-e2e
	@echo "All test suites passed."

## Run everything including integration tests (requires Docker)
test-all-with-integration: test-api test-api-integration test-app test-e2e
	@echo "All test suites (including integration) passed."

## Spring Boot unit tests + coverage gate (JaCoCo ≥60%)
test-api:
	cd api && mvn verify -DskipSpotlessCheck

## Spring Boot integration tests (requires Docker for TestContainers)
test-api-integration:
	cd api && mvn test -Pintegration

## Frontend Vitest suite
test-app:
	cd app && npm run test

## Playwright E2E suite (requires full stack running via make up)
test-e2e:
	cd tests && npx playwright test --reporter=line

## Clean-slate E2E: wipe DB, re-seed, then run Playwright suite
test-e2e-clean: reset-db
	bash scripts/test-up.sh
	cd tests && npx playwright test --reporter=line

## Wipe all application data (keeps Flyway history)
reset-db:
	bash scripts/reset-db.sh

# ── Lint ───────────────────────────────────────────────────────────────────────

## Lint everything
lint: lint-api lint-app

## Spotless format check
lint-api:
	cd api && mvn spotless:check -q

## ESLint + TypeScript check
lint-app:
	cd app && npm run lint

# ── Database ───────────────────────────────────────────────────────────────────

## Run Flyway migrations against local Postgres
migrate:
	cd api && mvn flyway:migrate \
	  -Dflyway.url=jdbc:postgresql://localhost:5432/hackhub \
	  -Dflyway.user=hackhub \
	  -Dflyway.password=hackhub

## Show Flyway migration status
migrate-info:
	cd api && mvn flyway:info \
	  -Dflyway.url=jdbc:postgresql://localhost:5432/hackhub \
	  -Dflyway.user=hackhub \
	  -Dflyway.password=hackhub

## Seed development data (requires full stack: make up first)
seed:
	bash scripts/seed-dev.sh

# ── Housekeeping ───────────────────────────────────────────────────────────────

## Remove build artifacts
clean:
	cd api && mvn clean -q
	cd app && rm -rf dist

## Sync Gherkin from docs/stories/ → tests/features/
test-features-sync:
	@python3 scripts/sdlc/sync-features.py 2>/dev/null || \
	  echo "Run: pip install -q pathlib && python3 scripts/sdlc/sync-features.py"

sdlc-report:
	@if [ ! -f .claude/logs/skills.jsonl ]; then echo "No skills log found."; exit 0; fi
	@python3 -c "\
import json, collections; \
lines = [json.loads(l) for l in open('.claude/logs/skills.jsonl') if l.strip()]; \
by_story = collections.defaultdict(list); \
[by_story[l.get('story','unknown')].append(l) for l in lines]; \
print(f'Stories: {len(by_story)}  Total invocations: {len(lines)}'); \
[print(f'  {s}: {len(v)} invocations') for s,v in sorted(by_story.items())] \
"

sdlc-rotate-logs:
	@bash scripts/sdlc/rotate-logs.sh

sdlc-branch-protection:
	@bash scripts/sdlc/branch-protection.sh

# ── Help ───────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "HackHub — make targets"
	@echo ""
	@echo "  Stack:    up | up-infra | down | down-clean | ps | logs [service=X]"
	@echo "  Build:    build | build-api | build-app"
	@echo "  Tests:    test-all | test-api | test-app | test-e2e"
	@echo "  Lint:     lint | lint-api | lint-app"
	@echo "  DB:       migrate | migrate-info | seed"
	@echo "  Other:    clean | help"
	@echo ""
