// data/run-migrations.js
// CLI entry: node data/run-migrations.js
// Applies pending migrations in db/migrations to the PostgreSQL database named
// by DATABASE_URL. Requires real PostgreSQL — pg-mem mode is inherently up to
// date because it seeds from sql/schema.sql on every boot.
import dotenv from 'dotenv';
import { runMigrations, migrationsDir } from './migrations.js';
import { createPgPool } from './db.js';

dotenv.config();

const url = (process.env.DATABASE_URL || '').trim();
if (!url || url.includes('${')) {
  console.error('DATABASE_URL is required to run migrations (point it at a real PostgreSQL database).');
  process.exit(1);
}

const pool = await createPgPool(url);
try {
  await runMigrations(pool);
  console.log(`Migrations up to date (${migrationsDir}).`);
} catch (err) {
  console.error(`Migrations failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}