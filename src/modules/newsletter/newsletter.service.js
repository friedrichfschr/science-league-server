const crypto = require('node:crypto');

const { getPool } = require('../../db/pool');
const { ApiError } = require('../../lib/errors');
const { generateToken } = require('../../lib/token');
const { sendConfirmationEmail, sendWelcomeEmail } = require('../../lib/mailer');

function translateDbError(err) {
  console.error('[newsletter] Database error:', err);
  const code = err?.code || '';
  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(code)) {
    throw new ApiError(503, 'Database unreachable. Please try again later.');
  }
  if (code === 'ER_NO_SUCH_TABLE') {
    throw new ApiError(503, 'Database table missing — run: npm run migrate');
  }
  if (code === 'ER_ACCESS_DENIED_ERROR') {
    throw new ApiError(503, 'Database access denied. Check DB_USER and DB_PASSWORD.');
  }
  throw err;
}

const newsletterService = {
  /**
   * Subscribe an email address.
   * - If already confirmed → return a 409 so the frontend can tell the user.
   * - If pending (never confirmed) → resend the confirmation email.
   * - If new → insert and send confirmation.
   */
  async subscribe(email) {
    const db = getPool();

    const [rows] = await db
      .query(
        'SELECT id, status, confirm_token, unsubscribe_token FROM newsletter_subscribers WHERE email = ? LIMIT 1',
        [email],
      )
      .catch(translateDbError);

    const existing = rows[0];

    if (existing) {
      if (existing.status === 'confirmed') {
        throw new ApiError(409, 'Diese E-Mail-Adresse ist bereits angemeldet.');
      }

      if (existing.status === 'unsubscribed') {
        // Re-activate: generate fresh tokens, set back to pending
        const confirmToken = generateToken();
        const unsubscribeToken = generateToken();
        await db
          .query(
            `UPDATE newsletter_subscribers
             SET status = 'pending', confirm_token = ?, unsubscribe_token = ?, subscribed_at = NOW(),
                 confirmed_at = NULL, unsubscribed_at = NULL
             WHERE id = ?`,
            [confirmToken, unsubscribeToken, existing.id],
          )
          .catch(translateDbError);
        await sendConfirmationEmail(email, confirmToken, unsubscribeToken);
        return { status: 'pending' };
      }

      // Status is 'pending' — resend the confirmation email
      await sendConfirmationEmail(email, existing.confirm_token, existing.unsubscribe_token);
      return { status: 'pending' };
    }

    // New subscriber
    const id = crypto.randomUUID();
    const confirmToken = generateToken();
    const unsubscribeToken = generateToken();

    await db
      .query(
        `INSERT INTO newsletter_subscribers (id, email, status, confirm_token, unsubscribe_token)
         VALUES (?, ?, 'pending', ?, ?)`,
        [id, email, confirmToken, unsubscribeToken],
      )
      .catch(translateDbError);

    await sendConfirmationEmail(email, confirmToken, unsubscribeToken);

    return { status: 'pending' };
  },

  /**
   * Confirm a subscription by token.
   * Returns the unsubscribe token (used in the redirect URL for welcome page).
   */
  async confirm(token) {
    const db = getPool();

    const [rows] = await db
      .query(
        `SELECT id, status, email, unsubscribe_token
         FROM newsletter_subscribers
         WHERE confirm_token = ?
         LIMIT 1`,
        [token],
      )
      .catch(translateDbError);

    const subscriber = rows[0];

    if (!subscriber) {
      throw new ApiError(404, 'Ungültiger oder abgelaufener Bestätigungslink.');
    }

    if (subscriber.status === 'confirmed') {
      // Already confirmed — just redirect gracefully
      return { email: subscriber.email, unsubscribeToken: subscriber.unsubscribe_token };
    }

    if (subscriber.status === 'unsubscribed') {
      throw new ApiError(410, 'Diese Anmeldung wurde bereits abgemeldet.');
    }

    await db
      .query(
        `UPDATE newsletter_subscribers
         SET status = 'confirmed', confirmed_at = NOW(), confirm_token = NULL
         WHERE id = ?`,
        [subscriber.id],
      )
      .catch(translateDbError);

    // Send a welcome email (fire-and-forget — don't block the redirect)
    sendWelcomeEmail(subscriber.email, subscriber.unsubscribe_token).catch((err) =>
      console.error('[newsletter] Failed to send welcome email:', err),
    );

    return { email: subscriber.email, unsubscribeToken: subscriber.unsubscribe_token };
  },

  /**
   * Unsubscribe by token. Idempotent.
   */
  async unsubscribe(token) {
    const db = getPool();

    const [rows] = await db
      .query(
        'SELECT id, status FROM newsletter_subscribers WHERE unsubscribe_token = ? LIMIT 1',
        [token],
      )
      .catch(translateDbError);

    const subscriber = rows[0];

    if (!subscriber) {
      throw new ApiError(404, 'Ungültiger Abmeldelink.');
    }

    if (subscriber.status !== 'unsubscribed') {
      await db
        .query(
          `UPDATE newsletter_subscribers
           SET status = 'unsubscribed', unsubscribed_at = NOW()
           WHERE id = ?`,
          [subscriber.id],
        )
        .catch(translateDbError);
    }

    return { unsubscribed: true };
  },
};

module.exports = { newsletterService };
