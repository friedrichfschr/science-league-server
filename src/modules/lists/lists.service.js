const crypto = require('node:crypto');

const { getPool } = require('../../db/pool');
const { ApiError } = require('../../lib/errors');

const listsService = {
  async getLists(userId) {
    const db = getPool();
    const [rows] = await db.query(
      'SELECT id, name, items, created_at FROM saved_lists WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
    );
    return rows.map((r) => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
    }));
  },

  async createList({ userId, name, items }) {
    const db = getPool();
    const id = crypto.randomUUID();
    const createdAt = new Date();
    await db.query(
      'INSERT INTO saved_lists (id, user_id, name, items, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, userId, name, JSON.stringify(items), createdAt],
    );
    return { id, name, items, created_at: createdAt.toISOString() };
  },

  async deleteList({ userId, listId }) {
    const db = getPool();
    const [result] = await db.query(
      'DELETE FROM saved_lists WHERE id = ? AND user_id = ?',
      [listId, userId],
    );
    if (result.affectedRows === 0) throw new ApiError(404, 'Liste nicht gefunden.');
  },
};

module.exports = { listsService };
