# Deployment Runbook

## Quick deploy (Docker Compose)

```bash
# Full stack — first time or after config changes
docker compose up -d --build

# Frontend only — after hackhub-app changes
cd hackhub-app && npm run build
docker compose cp hackhub-app/dist/. app:/usr/share/nginx/html/

# API only — after hackhub-api changes
docker compose build api --no-cache
docker compose up -d --force-recreate api
```

> **Important**: `docker compose restart api` reuses the old image. Always use `up -d --force-recreate api` after a `build` to guarantee the new image is running.

## Environment variables

Copy `.env.example` to `.env` before first run. Required:

| Variable | Where set | Notes |
|---|---|---|
| `JWT_PRIVATE_KEY` | `.env` | RS256 PEM — generate with `scripts/generate-keys.sh` |
| `JWT_PUBLIC_KEY` | `.env` | Matching public key |
| `SPRING_DATASOURCE_PASSWORD` | `.env` | Postgres password |
| `MINIO_SECRET_KEY` | `.env` | MinIO secret |
| `APP_CORS_ALLOWED_ORIGINS` | `.env` | Comma-separated origins, e.g. `http://localhost,https://yourdomain.com` |

## Database

Flyway runs automatically on API startup and applies any pending migrations. To reset:

```bash
# Wipe app data, keep Flyway history
bash scripts/reset-db.sh

# Re-seed test data
bash scripts/test-up.sh
```

## Health check

```bash
# API health (management port)
curl http://localhost:8081/actuator/health

# Frontend
curl -I http://localhost
```

## Rollback

```bash
# Roll back to previous API image
docker compose up -d --force-recreate api  # if previous image is still tagged

# Roll back database: not supported automatically
# Restore from pg_dump snapshot taken before the deployment
```

## Production checklist

- [ ] `APP_CORS_ALLOWED_ORIGINS` set to production domain only
- [ ] `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` generated fresh (not dev defaults)
- [ ] PostgreSQL running with persistent volume
- [ ] MinIO running with persistent volume
- [ ] HTTPS termination in front of Nginx (Caddy or similar)
- [ ] Port 8081 (management) NOT exposed publicly
