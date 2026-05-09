const { verifyToken } = require('../lib/jwt');
const { ApiError } = require('../lib/errors');

/**
 * Verifies the Bearer JWT in the Authorization header and attaches
 * req.user = { id, role } for downstream handlers.
 */
function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, 'Authentication required.'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Like authenticate but optional — attaches req.user if a valid token is
 * present, otherwise continues without error. Useful for public routes that
 * show extra info to logged-in users (e.g. their own vote on a post).
 */
function authenticateOptional(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // ignore invalid token for optional auth
    }
  }
  return next();
}

module.exports = { authenticate, authenticateOptional };
