const mysql = require('mysql2/promise');

const { config } = require('../config');
const { ApiError } = require('../lib/errors');

let pool;

function getPool() {
  if (!config.db.isConfigured) {
    throw new ApiError(
      503,
      'Database is not configured. Set DB_HOST, DB_NAME, DB_USER and DB_PASSWORD in .env.',
    );
  }

  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      connectTimeout: 5000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  return pool;
}

async function pingDatabase() {
  const db = getPool();
  const connection = await db.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

module.exports = { getPool, pingDatabase };
