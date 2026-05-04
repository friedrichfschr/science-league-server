const fs = require('node:fs/promises');
const path = require('node:path');

// Load env before requiring pool
require('../src/config');

const { getPool } = require('../src/db/pool');

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function run() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  const statements = splitSqlStatements(sql);
  const pool = getPool();

  for (const statement of statements) {
    console.log('Running:', statement.slice(0, 80).replace(/\s+/g, ' ') + '…');
    await pool.query(statement);
  }

  console.log('\n✓ Database schema applied successfully.');
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
