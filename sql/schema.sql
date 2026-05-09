-- FoodConnectMarkt — full schema
-- Run: npm run migrate

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id               VARCHAR(36)  NOT NULL PRIMARY KEY,
  email            VARCHAR(255) NOT NULL UNIQUE,
  username         VARCHAR(50)  NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  role             ENUM('user','moderator','admin') NOT NULL DEFAULT 'user',
  email_verified   TINYINT(1)   NOT NULL DEFAULT 0,
  verify_token     VARCHAR(64)  NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Forum posts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_posts (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  author_id  VARCHAR(36)  NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts (created_at);

-- ─── Forum comments ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_comments (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  post_id    VARCHAR(36) NOT NULL,
  author_id  VARCHAR(36) NOT NULL,
  body       TEXT        NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id)   REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments (post_id);

-- ─── Votes ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_votes (
  id          VARCHAR(36)             NOT NULL PRIMARY KEY,
  user_id     VARCHAR(36)             NOT NULL,
  target_type ENUM('post','comment')  NOT NULL,
  target_id   VARCHAR(36)             NOT NULL,
  value       TINYINT                 NOT NULL,   -- 1 upvote / -1 downvote
  created_at  DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vote (user_id, target_type, target_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_forum_votes_target ON forum_votes (target_type, target_id);

-- ─── Newsletter subscribers ───────────────────────────────────────────────────

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
