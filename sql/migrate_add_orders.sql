CREATE TABLE IF NOT EXISTS orders (
  id          VARCHAR(36)    NOT NULL PRIMARY KEY,
  user_id     VARCHAR(36)    NOT NULL,
  items       JSON           NOT NULL,
  total       DECIMAL(10,2)  NOT NULL,
  notes       TEXT,
  status      ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_orders_user    (user_id),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
