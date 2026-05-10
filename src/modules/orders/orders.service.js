const crypto = require('node:crypto');

const { getPool } = require('../../db/pool');
const { ApiError } = require('../../lib/errors');
const { sendOrderConfirmationEmail } = require('../../lib/mailer');

const ordersService = {
  async createOrder({ userId, items, notes }) {
    const db = getPool();

    const [userRows] = await db.query(
      'SELECT id, email, username FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    const user = userRows[0];
    if (!user) throw new ApiError(404, 'Benutzer nicht gefunden.');

    const id = crypto.randomUUID();
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const createdAt = new Date();

    await db.query(
      `INSERT INTO orders (id, user_id, items, total, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, JSON.stringify(items), total.toFixed(2), notes ?? null, createdAt],
    );

    const order = { id, items, total, notes: notes ?? null, created_at: createdAt.toISOString() };

    // Non-blocking — don't let email failure abort the order
    sendOrderConfirmationEmail(user.email, user.username, order).catch((err) =>
      console.error('[orders] Failed to send confirmation email:', err),
    );

    return order;
  },
};

module.exports = { ordersService };
