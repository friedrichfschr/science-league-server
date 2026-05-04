const crypto = require('node:crypto');

/** Generate a URL-safe opaque token of the given byte length. */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { generateToken };
