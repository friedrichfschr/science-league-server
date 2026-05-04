const { asyncHandler } = require('../../lib/async-handler');
const { subscribeSchema, tokenQuerySchema } = require('./newsletter.schemas');
const { newsletterService } = require('./newsletter.service');
const { config } = require('../../config');

function unsubscribePageHtml({ success, message }) {
  const icon = success ? '✓' : '✗';
  const iconColor = success ? '#065f46' : '#dc2626';
  const heading = success ? 'Du wurdest abgemeldet' : 'Ungültiger Link';
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:60px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    <tr>
      <td style="background:linear-gradient(135deg,#1c1917,#064e3b);padding:32px 40px;">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#6ee7b7;">FoodConnectMarkt</p>
        <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#ffffff;">${heading}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:48px;color:${iconColor};">${icon}</span>
        </div>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;text-align:center;">${message}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const newsletterController = {
  /**
   * POST /api/newsletter/subscribe
   * Body: { email: string }
   */
  subscribe: asyncHandler(async (req, res) => {
    const { email } = subscribeSchema.parse(req.body);
    const result = await newsletterService.subscribe(email);
    res.status(202).json({
      message:
        'Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte bestätige deine Anmeldung.',
      ...result,
    });
  }),

  /**
   * GET /api/newsletter/confirm?token=...
   * Redirects to frontend with ?confirmed=1 on success.
   */
  confirm: asyncHandler(async (req, res) => {
    const { token } = tokenQuerySchema.parse(req.query);
    const { unsubscribeToken } = await newsletterService.confirm(token);
    const redirect = `${config.frontendUrl}/index.html?newsletter=confirmed&unsubscribe=${unsubscribeToken}`;
    res.redirect(302, redirect);
  }),

  /**
   * GET /api/newsletter/unsubscribe?token=...
   * Serves a self-contained HTML confirmation page.
   */
  unsubscribe: asyncHandler(async (req, res) => {
    const { token } = tokenQuerySchema.parse(req.query);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    try {
      await newsletterService.unsubscribe(token);
      res.send(
        unsubscribePageHtml({
          success: true,
          message: 'Deine E-Mail-Adresse wurde aus unserem Newsletter entfernt. Du erhältst keine weiteren E-Mails von uns.',
        }),
      );
    } catch {
      res.status(404).send(
        unsubscribePageHtml({
          success: false,
          message: 'Dieser Abmeldelink ist ungültig oder wurde bereits verwendet.',
        }),
      );
    }
  }),
};

module.exports = { newsletterController };
