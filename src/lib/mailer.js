const nodemailer = require('nodemailer');

const { config } = require('../config');
const { ApiError } = require('./errors');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });

  return _transporter;
}

async function sendMail({ to, subject, html, text }) {
  if (!config.email.isConfigured) {
    console.warn('[mailer] Email not configured — skipping send to:', to);
    console.warn('[mailer] Subject:', subject);
    return;
  }

  const transporter = getTransporter();
  try {
    await transporter.sendMail({ from: config.email.from, to, subject, html, text });
  } catch (err) {
    console.error('[mailer] Failed to send email to', to, ':', err);
    const msg = String(err?.message || '').toLowerCase();
    const code = err?.code || '';
    if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(code)) {
      throw new ApiError(502, 'Mail server unreachable. Please try again later.');
    }
    if (msg.includes('authentication') || msg.includes('auth') || err?.responseCode === 535) {
      throw new ApiError(502, 'Mail server authentication failed. Check EMAIL_USER and EMAIL_PASSWORD.');
    }
    throw new ApiError(502, `Failed to send confirmation email: ${err.message}`);
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

function confirmationEmailHtml(confirmUrl, unsubscribeUrl) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <tr>
      <td style="background:linear-gradient(135deg,#1c1917,#064e3b);padding:32px 40px;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#6ee7b7;">FoodConnectMarkt</p>
        <h1 style="margin:12px 0 0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.2;">
          Bitte bestätige deine Anmeldung
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:36px 40px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">
          Du hast dich für den Newsletter des FoodConnectMarkts angemeldet. Klicke auf den Button, um deine E-Mail-Adresse zu bestätigen.
        </p>
        <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#374151;">
          Der Link ist <strong>24 Stunden</strong> gültig.
        </p>
        <a href="${confirmUrl}"
           style="display:inline-block;background:#065f46;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:0.01em;">
          E-Mail bestätigen →
        </a>
        <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">
          Oder kopiere diesen Link in deinen Browser:<br />
          <a href="${confirmUrl}" style="color:#065f46;">${confirmUrl}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 32px;border-top:1px solid #f3f4f6;">
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
          Wenn du dich nicht angemeldet hast, kannst du diese E-Mail ignorieren. Deine Adresse wird nicht gespeichert.<br />
          <a href="${unsubscribeUrl}" style="color:#9ca3af;">Abmelden</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function confirmationEmailText(confirmUrl) {
  return `Hallo,\n\nbitte bestätige deine Newsletter-Anmeldung beim FoodConnectMarkt:\n\n${confirmUrl}\n\nDer Link ist 24 Stunden gültig.\n\nWenn du dich nicht angemeldet hast, kannst du diese E-Mail ignorieren.`;
}

function welcomeEmailHtml(unsubscribeUrl) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <tr>
      <td style="background:linear-gradient(135deg,#064e3b,#065f46);padding:32px 40px;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#6ee7b7;">FoodConnectMarkt</p>
        <h1 style="margin:12px 0 0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.2;">
          Willkommen im Newsletter! 🌱
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:36px 40px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">
          Deine Anmeldung ist bestätigt. Du erhältst ab sofort Neuigkeiten rund um urbane Lebensmittelproduktion, soziale Teilhabe und den Fortschritt unseres Projekts.
        </p>
        <p style="margin:0 0 0;font-size:15px;line-height:1.7;color:#374151;">
          Das Team bre-delicious freut sich auf dich.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 32px;border-top:1px solid #f3f4f6;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          <a href="${unsubscribeUrl}" style="color:#9ca3af;">Newsletter abbestellen</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function welcomeEmailText(unsubscribeUrl) {
  return `Willkommen beim FoodConnectMarkt-Newsletter!\n\nDeine Anmeldung ist bestätigt. Du erhältst ab sofort Neuigkeiten zu unserem Projekt.\n\nAbmelden: ${unsubscribeUrl}`;
}

async function sendConfirmationEmail(to, confirmToken, unsubscribeToken) {
  const confirmUrl = `${config.serverUrl}/api/newsletter/confirm?token=${confirmToken}`;
  const unsubscribeUrl = `${config.serverUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

  await sendMail({
    to,
    subject: 'Bitte bestätige deinen FoodConnectMarkt-Newsletter',
    html: confirmationEmailHtml(confirmUrl, unsubscribeUrl),
    text: confirmationEmailText(confirmUrl),
  });
}

async function sendWelcomeEmail(to, unsubscribeToken) {
  const unsubscribeUrl = `${config.serverUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

  await sendMail({
    to,
    subject: 'Willkommen beim FoodConnectMarkt-Newsletter 🌱',
    html: welcomeEmailHtml(unsubscribeUrl),
    text: welcomeEmailText(unsubscribeUrl),
  });
}

module.exports = { sendConfirmationEmail, sendWelcomeEmail };
