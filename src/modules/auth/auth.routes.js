const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const { authenticate } = require('../../middleware/authenticate');
const { authController } = require('./auth.controller');

const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/register', authLimiter, authController.register);
authRouter.get('/verify', authController.verify);
authRouter.post('/login', authLimiter, authController.login);
authRouter.post('/logout', authenticate, authController.logout);
authRouter.get('/me', authenticate, authController.me);
authRouter.delete('/me', authenticate, authController.deleteAccount);

module.exports = { authRouter };
