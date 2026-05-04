-- FoodConnectMarkt newsletter subscribers
-- Run: npm run migrate

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              VARCHAR(36)     NOT NULL PRIMARY KEY,
  email           VARCHAR(255)    NOT NULL UNIQUE,
  status          ENUM('pending', 'confirmed', 'unsubscribed') NOT NULL DEFAULT 'pending',
  confirm_token   VARCHAR(64)     NULL,
  unsubscribe_token VARCHAR(64)   NOT NULL,
  subscribed_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at    DATETIME        NULL,
  unsubscribed_at DATETIME        NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers (status);
