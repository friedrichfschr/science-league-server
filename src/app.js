const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const { config } = require('./config');
const { errorHandler } = require('./middleware/error-handler');
const { newsletterRouter } = require('./modules/newsletter/newsletter.routes');
const { adminRouter } = require('./modules/admin/admin.routes');
const { adminController } = require('./modules/admin/admin.controller');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);

  app.use(
    cors({
      origin(origin, callback) {
        // In development, allow all origins (incl. Postman, curl, no-origin requests)
        if (config.nodeEnv !== 'production') {
          return callback(null, true);
        }
        // In production, restrict to configured origins
        if (!origin || config.appOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
    }),
  );

  app.use(helmet());
  app.use(express.json({ limit: '64kb' }));
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/', (_req, res) => {
    res.json({
      app: 'foodconnect-newsletter-server',
      status: 'ok',
      endpoints: [
        'POST /api/newsletter/subscribe',
        'GET  /api/newsletter/confirm',
        'GET  /api/newsletter/unsubscribe',
        'GET  /admin',
        'GET  /api/admin/subscribers',
        'POST /api/admin/send',
      ],
    });
  });

  app.use('/api/newsletter', newsletterRouter);

  // Admin panel HTML (no auth — login is handled client-side)
  app.get('/admin', adminController.panel);
  app.use('/api/admin', adminRouter);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
