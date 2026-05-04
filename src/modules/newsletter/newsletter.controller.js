const { asyncHandler } = require('../../lib/async-handler');
const { subscribeSchema, tokenQuerySchema } = require('./newsletter.schemas');
const { newsletterService } = require('./newsletter.service');
const { config } = require('../../config');

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
   * Redirects to frontend with ?newsletter=unsubscribed on success.
   */
  unsubscribe: asyncHandler(async (req, res) => {
    const { token } = tokenQuerySchema.parse(req.query);
    await newsletterService.unsubscribe(token);
    const redirect = `${config.frontendUrl}/index.html?newsletter=unsubscribed`;
    res.redirect(302, redirect);
  }),
};

module.exports = { newsletterController };
