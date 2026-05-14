-- Postgres init script — runs once on first container start
-- Flyway handles all schema creation; this only ensures extensions exist.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
