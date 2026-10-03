// data/migrations.js
// Minimal forward-only SQL migration runner with a schema_migrations table.
// Each *.sql file in db/migrations is applied in filename order inside a
// transaction and recorded, so applying is idempotent across restarts and
// across the live PostgreSQL / pg-mem split (pg-mem seeds from schema.sql and
// never runs migrations).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

async function ensureMigrationsTable(pool) {
  const { rows } = await pool.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schema_migrations'"
  );
  if (rows.length === 0) {
    await pool.query(`CREATE TABLE schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`);
  }
}

export async function runMigrations(pool) {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    logger.info('no migrations found', { migrationsDir });
    return;
  }

  await ensureMigrationsTable(pool);

  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      logger.info('migration applied', { name: file });
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${err.message}`);
    } finally {
      client.release();
    }
  }
}