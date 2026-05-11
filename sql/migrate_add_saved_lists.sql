-- Migration: add saved_lists table for user shopping list persistence
-- Run once against the production database.

CREATE TABLE IF NOT EXISTS saved_lists (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  name       VARCHAR(100) NOT NULL,
  items      JSON         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_saved_lists_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_saved_lists_user (user_id),
  INDEX idx_saved_lists_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
