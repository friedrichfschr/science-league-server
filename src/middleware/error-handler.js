const { ZodError } = require('zod');

const { ApiError } = require('../lib/errors');

function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      issues: error.flatten(),
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  console.error('[error-handler]', error);
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { errorHandler };
