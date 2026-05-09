const { getPool } = require('../../db/pool');
const { ApiError } = require('../../lib/errors');

function translateDbError(err) {
  console.error('[users] Database error:', err);
  const code = err?.code || '';
  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(code)) {
    throw new ApiError(503, 'Database unreachable. Please try again later.');
  }
  throw err;
}

const VALID_ROLES = ['user', 'moderator', 'admin'];

const usersService = {
  async getUserRole(targetId) {
    const db = getPool();
    const [rows] = await db
      .query('SELECT id, username, role FROM users WHERE id = ? LIMIT 1', [targetId])
      .catch(translateDbError);
    if (!rows[0]) throw new ApiError(404, 'Benutzer nicht gefunden.');
    return rows[0];
  },

  async setUserRole({ targetId, role, requesterId, requesterRole }) {
    if (!VALID_ROLES.includes(role)) {
      throw new ApiError(400, `Ungültige Rolle. Erlaubt: ${VALID_ROLES.join(', ')}`);
    }

    // Only admins can promote to admin or demote admins
    if (role === 'admin' && requesterRole !== 'admin') {
      throw new ApiError(403, 'Nur Admins können andere Admins ernennen.');
    }

    const db = getPool();
    const [rows] = await db
      .query('SELECT id, username, role FROM users WHERE id = ? LIMIT 1', [targetId])
      .catch(translateDbError);

    if (!rows[0]) throw new ApiError(404, 'Benutzer nicht gefunden.');

    // Prevent admins from demoting other admins unless they are themselves admin
    if (rows[0].role === 'admin' && requesterRole !== 'admin') {
      throw new ApiError(403, 'Admins können nicht von Moderatoren demotiert werden.');
    }

    // Prevent self-demotion
    if (targetId === requesterId && role !== rows[0].role) {
      throw new ApiError(400, 'Du kannst deine eigene Rolle nicht ändern.');
    }

    await db
      .query('UPDATE users SET role = ? WHERE id = ?', [role, targetId])
      .catch(translateDbError);

    return { id: targetId, username: rows[0].username, role };
  },
};

module.exports = { usersService };
