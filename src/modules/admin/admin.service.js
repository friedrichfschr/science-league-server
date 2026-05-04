const { getPool } = require('../../db/pool');
const { ApiError } = require('../../lib/errors');
const { sendMail } = require('../../lib/mailer');
const { config } = require('../../config');

function translateDbError(err) {
  console.error('[admin] Database error:', err);
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

const adminService = {
  async listSubscribers() {
    const db = getPool();
    const [rows] = await db
      .query(
        `SELECT id, email, status, subscribed_at, confirmed_at, unsubscribed_at
         FROM newsletter_subscribers
         ORDER BY subscribed_at DESC`,
      )
      .catch(translateDbError);
    return rows;
  },

  async sendBroadcast({ subject, html, text }) {
    const db = getPool();
    const [rows] = await db
      .query(
        `SELECT email, unsubscribe_token FROM newsletter_subscribers WHERE status = 'confirmed'`,
      )
      .catch(translateDbError);

    if (rows.length === 0) {
      return { sent: 0 };
    }

    let sent = 0;
    const errors = [];

    for (const { email, unsubscribe_token } of rows) {
      const unsubscribeUrl = `${config.serverUrl}/api/newsletter/unsubscribe?token=${unsubscribe_token}`;
      const footer = `<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;"><a href="${unsubscribeUrl}" style="color:#9ca3af;">Newsletter abbestellen</a></p>`;
      const textFooter = `\n\n---\nAbmelden: ${unsubscribeUrl}`;

      try {
        await sendMail({
          to: email,
          subject,
          html: html + footer,
          text: text + textFooter,
        });
        sent++;
      } catch (err) {
        console.error('[admin] Failed to send to', email, ':', err.message);
        errors.push({ email, error: err.message });
      }
    }

    return { sent, total: rows.length, errors };
  },
};

module.exports = { adminService };
