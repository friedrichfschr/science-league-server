const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const { config } = require('./config');
const { errorHandler } = require('./middleware/error-handler');
const { newsletterRouter } = require('./modules/newsletter/newsletter.routes');
const { authRouter } = require('./modules/auth/auth.routes');
const { forumRouter } = require('./modules/forum/forum.routes');
const { usersRouter } = require('./modules/users/users.routes');
const { ordersRouter } = require('./modules/orders/orders.routes');
const { adminRouter } = require('./modules/admin/admin.routes');
const { adminController } = require('./modules/admin/admin.controller');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);

  app.use(
    cors({
      origin(origin, callback) {
        if (config.nodeEnv !== 'production') return callback(null, true);
        if (!origin || config.appOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
    }),
  );

  app.use(helmet());
  app.use(express.json({ limit: '64kb' }));
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

  // Admin panel serves inline scripts — remove CSP header after helmet sets it
  app.use('/admin', (_req, res, next) => { res.removeHeader('Content-Security-Policy'); next(); });

  app.get('/', (_req, res) => {
    res.json({
      app: 'foodconnect-server',
      status: 'ok',
      endpoints: [
        'POST /api/auth/register',
        'GET  /api/auth/verify',
        'POST /api/auth/login',
        'POST /api/auth/logout',
        'GET  /api/auth/me',
        'DELETE /api/auth/me',
        'POST /api/auth/forgot-password',
        'GET|POST /api/auth/reset-password',
        'GET|POST /api/forum/posts',
        'GET|PATCH|DELETE /api/forum/posts/:id',
        'POST /api/forum/posts/:id/comments',
        'PATCH|DELETE /api/forum/comments/:id',
        'POST /api/forum/posts/:id/vote',
        'POST /api/forum/comments/:id/vote',
        'GET|PATCH /api/users/:id/role',
        'POST /api/newsletter/subscribe',
        'GET  /api/newsletter/confirm',
        'GET  /api/newsletter/unsubscribe',
        'POST /api/orders',
        'GET /api/admin/users',
        'PATCH /api/admin/users/:id/role',
        'GET /api/admin/orders',
        'GET  /admin',
      ],
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/forum', forumRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/newsletter', newsletterRouter);
  app.use('/api/orders', ordersRouter);

  // Admin panel
  app.get('/admin', adminController.panel);
  app.use('/api/admin', adminRouter);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
