const crypto = require('node:crypto');

const { config } = require('../config');
const { ApiError } = require('../lib/errors');

function adminAuth(req, _res, next) {
  if (!config.adminPassword) {
    return next(new ApiError(503, 'Admin panel is not configured. Set ADMIN_PASSWORD in .env.'));
  }

  const provided = req.headers['x-admin-password'] || '';

  let authorized = false;
  try {
    const a = Buffer.from(provided.padEnd(64));
    const b = Buffer.from(config.adminPassword.padEnd(64));
    authorized =
      a.length === b.length && crypto.timingSafeEqual(a, b) && provided === config.adminPassword;
  } catch {
    authorized = false;
  }

  if (!authorized) {
    return next(new ApiError(401, 'Unauthorized. Wrong or missing admin password.'));
  }

  return next();
}

module.exports = { adminAuth };
