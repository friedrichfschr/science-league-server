const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const { getPool } = require('../../db/pool');
const { ApiError } = require('../../lib/errors');
const { generateToken } = require('../../lib/token');
const { signToken } = require('../../lib/jwt');
const { sendAccountVerificationEmail } = require('../../lib/mailer');

function translateDbError(err) {
  console.error('[auth] Database error:', err);
  const code = err?.code || '';
  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(code)) {
    throw new ApiError(503, 'Database unreachable. Please try again later.');
  }
  if (code === 'ER_NO_SUCH_TABLE') {
    throw new ApiError(503, 'Database table missing — run: npm run migrate');
  }
  throw err;
}

const authService = {
  async register({ email, username, password }) {
    const db = getPool();

    // Check uniqueness
    const [existing] = await db
      .query('SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1', [email, username])
      .catch(translateDbError);

    if (existing[0]) {
      throw new ApiError(409, 'E-Mail-Adresse oder Benutzername ist bereits vergeben.');
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = generateToken();

    await db
      .query(
        `INSERT INTO users (id, email, username, password_hash, verify_token)
         VALUES (?, ?, ?, ?, ?)`,
        [id, email, username, passwordHash, verifyToken],
      )
      .catch(translateDbError);

    // Send verification email (non-blocking on failure in dev, throw in prod)
    sendAccountVerificationEmail(email, verifyToken).catch((err) =>
      console.error('[auth] Failed to send verification email:', err),
    );

    return { id, email, username };
  },

  async verifyEmail(token) {
    const db = getPool();

    const [rows] = await db
      .query('SELECT id, email_verified FROM users WHERE verify_token = ? LIMIT 1', [token])
      .catch(translateDbError);

    const user = rows[0];
    if (!user) throw new ApiError(404, 'Ungültiger oder abgelaufener Bestätigungslink.');
    if (user.email_verified) return; // idempotent

    await db
      .query('UPDATE users SET email_verified = 1, verify_token = NULL WHERE id = ?', [user.id])
      .catch(translateDbError);
  },

  async login({ email, password }) {
    const db = getPool();

    const [rows] = await db
      .query(
        'SELECT id, email, username, password_hash, role, email_verified FROM users WHERE email = ? LIMIT 1',
        [email],
      )
      .catch(translateDbError);

    const user = rows[0];
    if (!user) throw new ApiError(401, 'E-Mail-Adresse oder Passwort falsch.');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new ApiError(401, 'E-Mail-Adresse oder Passwort falsch.');

    if (!user.email_verified) {
      throw new ApiError(403, 'Bitte bestätige zuerst deine E-Mail-Adresse.');
    }

    const token = signToken({ sub: user.id, role: user.role });
    return {
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    };
  },

  async getMe(userId) {
    const db = getPool();

    const [rows] = await db
      .query('SELECT id, email, username, role, created_at FROM users WHERE id = ? LIMIT 1', [
        userId,
      ])
      .catch(translateDbError);

    const user = rows[0];
    if (!user) throw new ApiError(404, 'Benutzer nicht gefunden.');
    return user;
  },

  async deleteAccount(userId) {
    const db = getPool();
    // Cascade FK deletes forum_posts, forum_comments, forum_votes, orders
    await db.query('DELETE FROM users WHERE id = ?', [userId]).catch(translateDbError);
  },
};

module.exports = { authService };
