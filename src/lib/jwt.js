const jwt = require('jsonwebtoken');

const { config } = require('../config');
const { ApiError } = require('./errors');

function signToken(payload) {
  if (!config.jwtSecret) {
    throw new ApiError(503, 'JWT is not configured. Set JWT_SECRET in .env.');
  }
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function verifyToken(token) {
  if (!config.jwtSecret) {
    throw new ApiError(503, 'JWT is not configured. Set JWT_SECRET in .env.');
  }
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token.');
  }
}

module.exports = { signToken, verifyToken };
