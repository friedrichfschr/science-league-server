const path = require('node:path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const config = {
  port: Number(process.env.PORT || 3100),
  nodeEnv: process.env.NODE_ENV || 'development',
  projectRoot,
  appOrigins: parseCsv(
    process.env.APP_ORIGIN ||
      'http://localhost:5173,http://localhost:5174',
  ),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  db: {
    host: process.env.DB_HOST || '',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
  },
  email: {
    host: process.env.EMAIL_HOST || '',
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || '',
  },
  serverUrl: process.env.SERVER_URL || 'http://localhost:3100',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
};

config.db.isConfigured = Boolean(config.db.host && config.db.name && config.db.user);
config.email.isConfigured = Boolean(
  config.email.host && config.email.user && config.email.password && config.email.from,
);

module.exports = { config };
