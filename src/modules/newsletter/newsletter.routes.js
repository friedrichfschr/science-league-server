const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const { newsletterController } = require('./newsletter.controller');

const subscribeLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Zu viele Anfragen. Bitte versuche es in 15 Minuten erneut.' },
});

const newsletterRouter = Router();

newsletterRouter.post('/subscribe', subscribeLimit, newsletterController.subscribe);
newsletterRouter.get('/confirm', newsletterController.confirm);
newsletterRouter.get('/unsubscribe', newsletterController.unsubscribe);

module.exports = { newsletterRouter };
