-- V006 — Rename boolean columns to match Hibernate 6 naming convention
-- Hibernate 6 derives column names from getter methods, not field names.
-- Boolean getters isRead() / isRevoked() produce is_read / is_revoked.
-- This migration aligns the DB schema with what Hibernate generates.

-- notifications: read → is_read
ALTER TABLE notifications RENAME COLUMN read TO is_read;

-- Also update the performance index from V004
DROP INDEX IF EXISTS idx_notifications_user_read;
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read);

-- refresh_tokens: revoked → is_revoked
ALTER TABLE refresh_tokens RENAME COLUMN revoked TO is_revoked;
