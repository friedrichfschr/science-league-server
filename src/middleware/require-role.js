const { ApiError } = require('../lib/errors');

const ROLE_RANK = { user: 0, moderator: 1, admin: 2 };

/**
 * Returns middleware that requires the authenticated user to have at least
 * the given role. Must be used after `authenticate`.
 *
 * requireRole('moderator') — allows moderators and admins
 * requireRole('admin')     — allows only admins
 */
function requireRole(minRole) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }
    const userRank = ROLE_RANK[req.user.role] ?? -1;
    const minRank = ROLE_RANK[minRole] ?? 99;
    if (userRank < minRank) {
      return next(new ApiError(403, 'Insufficient permissions.'));
    }
    return next();
  };
}

module.exports = { requireRole };
