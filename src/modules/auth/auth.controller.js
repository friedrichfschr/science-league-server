const { asyncHandler } = require('../../lib/async-handler');
const { registerSchema, loginSchema, tokenQuerySchema } = require('./auth.schemas');
const { authService } = require('./auth.service');
const { config } = require('../../config');

function verifySuccessHtml() {
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"/><title>Konto bestätigt</title></head>
<body style="margin:0;padding:0;background:#f7f4ee;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:60px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.07);">
    <tr><td style="background:linear-gradient(135deg,#1c1917,#064e3b);padding:32px 40px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:#6ee7b7;">FoodConnectMarkt</p>
      <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#fff;">Konto aktiviert ✓</h1>
    </td></tr>
    <tr><td style="padding:40px;text-align:center;">
      <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">Dein Konto wurde erfolgreich bestätigt. Du kannst dich jetzt einloggen.</p>
      <a href="${config.frontendUrl}" style="display:inline-block;margin-top:24px;background:#065f46;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:600;">Zur App →</a>
    </td></tr>
  </table>
</body></html>`;
}

const authController = {
  register: asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data);
    res.status(201).json({
      message: 'Konto erstellt. Bitte bestätige deine E-Mail-Adresse.',
      user,
    });
  }),

  verify: asyncHandler(async (req, res) => {
    const { token } = tokenQuerySchema.parse(req.query);
    await authService.verifyEmail(token);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(verifySuccessHtml());
  }),

  login: asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  }),

  logout: asyncHandler(async (_req, res) => {
    // JWT is stateless — client discards the token.
    res.json({ message: 'Erfolgreich abgemeldet.' });
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    res.json({ user });
  }),
};

module.exports = { authController };
