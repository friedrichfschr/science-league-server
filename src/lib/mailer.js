const nodemailer = require('nodemailer');

const { config } = require('../config');

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
  await transporter.sendMail({ from: config.email.from, to, subject, html, text });
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

// ─── Account email verification ───────────────────────────────────────────────

function verifyAccountEmailHtml(verifyUrl) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);">
    <tr><td style="background:linear-gradient(135deg,#1c1917,#064e3b);padding:32px 40px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:#6ee7b7;">FoodConnectMarkt</p>
      <h1 style="margin:12px 0 0;font-size:26px;font-weight:700;color:#fff;">Bitte bestätige deine E-Mail-Adresse</h1>
    </td></tr>
    <tr><td style="padding:36px 40px;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">Du hast ein Konto beim FoodConnectMarkt erstellt. Klicke auf den Button, um deine E-Mail-Adresse zu bestätigen und dein Konto zu aktivieren.</p>
      <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#374151;">Der Link ist <strong>24 Stunden</strong> gültig.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#065f46;color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:14px;font-weight:600;">E-Mail bestätigen →</a>
      <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">Oder kopiere diesen Link:<br/><a href="${verifyUrl}" style="color:#065f46;">${verifyUrl}</a></p>
    </td></tr>
    <tr><td style="padding:20px 40px 32px;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Wenn du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.</p>
    </td></tr>
  </table>
</body></html>`;
}

async function sendAccountVerificationEmail(to, verifyToken) {
  const verifyUrl = `${config.serverUrl}/api/auth/verify?token=${verifyToken}`;
  await sendMail({
    to,
    subject: 'Bestätige dein FoodConnectMarkt-Konto',
    html: verifyAccountEmailHtml(verifyUrl),
    text: `Bitte bestätige dein Konto beim FoodConnectMarkt:\n\n${verifyUrl}\n\nDer Link ist 24 Stunden gültig.`,
  });
}

// ─── Order confirmation ───────────────────────────────────────────────────────

function orderConfirmationHtml(username, order) {
  const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const date = new Date(order.created_at).toLocaleDateString('de-DE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">${item.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:center;">${item.quantity} × ${item.unit}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:right;font-weight:600;">${fmt.format(item.price * item.quantity)}</td>
    </tr>`).join('');

  const notesRow = order.notes
    ? `<tr><td colspan="3" style="padding:12px 0 0;font-size:13px;color:#6b7280;">Anmerkung: ${order.notes}</td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);">
    <tr><td style="background:linear-gradient(135deg,#1c1917,#064e3b);padding:32px 40px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:#6ee7b7;">FoodConnectMarkt</p>
      <h1 style="margin:12px 0 0;font-size:26px;font-weight:700;color:#fff;">Bestellung bestätigt ✓</h1>
    </td></tr>
    <tr><td style="padding:36px 40px 24px;">
      <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#374151;">
        Hallo <strong>${username}</strong>,<br/>
        vielen Dank für deine Bestellung! Hier ist deine Quittung:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th style="text-align:left;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#9ca3af;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">Produkt</th>
            <th style="text-align:center;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#9ca3af;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">Menge</th>
            <th style="text-align:right;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#9ca3af;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">Preis</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          ${notesRow}
        </tbody>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr>
          <td style="font-size:16px;font-weight:700;color:#111827;">Gesamt</td>
          <td style="font-size:20px;font-weight:700;color:#065f46;text-align:right;">${fmt.format(order.total)}</td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:0 40px 36px;">
      <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;">
        <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
          🥬 Deine Produkte werden frisch aus unserem Vertical-Farming-Turm geerntet.<br/>
          Wir melden uns, sobald deine Bestellung zur Abholung bereit ist.
        </p>
      </div>
      <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Bestellnummer: ${order.id}<br/>Datum: ${date}</p>
    </td></tr>
  </table>
</body></html>`;
}

function orderConfirmationText(username, order) {
  const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const lines = order.items.map(
    (item) => `  ${item.name} — ${item.quantity} × ${item.unit} — ${fmt.format(item.price * item.quantity)}`
  );
  return [
    `Hallo ${username},`,
    '',
    'vielen Dank für deine Bestellung beim FoodConnectMarkt!',
    '',
    'Deine Quittung:',
    ...lines,
    '',
    `Gesamt: ${fmt.format(order.total)}`,
    order.notes ? `Anmerkung: ${order.notes}` : '',
    '',
    `Bestellnummer: ${order.id}`,
    '',
    'Deine Produkte werden frisch geerntet. Wir melden uns zur Abholung.',
  ].filter((l) => l !== undefined).join('\n');
}

async function sendOrderConfirmationEmail(to, username, order) {
  await sendMail({
    to,
    subject: `Deine Bestellung beim FoodConnectMarkt ✓`,
    html: orderConfirmationHtml(username, order),
    text: orderConfirmationText(username, order),
  });
}

module.exports = {
  sendMail,
  sendConfirmationEmail,
  sendWelcomeEmail,
  sendAccountVerificationEmail,
  sendOrderConfirmationEmail,
};
