// data/bootstrap-db.js
// CLI entry: node data/bootstrap-db.js [--seed] [--force-seed]
//
// One-shot provisioning for a fresh managed PostgreSQL database (Supabase).
// Unlike sql/schema.sql — which DROPs every table and destroys data — this path
// is built on db/migrations, whose statements are all idempotent
// (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS), so it is safe to
// re-run against a database that already holds data.
//
//   node data/bootstrap-db.js              -> create/align schema only
//   node data/bootstrap-db.js --seed       -> ...and insert demo data if the DB is empty
//   node data/bootstrap-db.js --force-seed -> ...and insert demo data even if rows exist
//
// Seed passwords: every seeded account uses "password123"; the admin is
// sysadmin / theadmin. Never seed a production database that holds real users.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { runMigrations } from './migrations.js';
import { createPgPool } from './db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedFile = path.join(__dirname, '..', 'sql', 'seed.sql');

const args = new Set(process.argv.slice(2));
const wantsSeed = args.has('--seed') || args.has('--force-seed');
const forceSeed = args.has('--force-seed');

const url = (process.env.DATABASE_URL || '').trim();
if (!url || url.includes('${')) {
  console.error('DATABASE_URL is required (point it at your Supabase project).');
  process.exit(1);
}

const pool = await createPgPool(url);

async function isEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM students');
  return rows[0].count === 0;
}

try {
  await runMigrations(pool);
  console.log('Schema is up to date (idempotent migrations applied).');

  if (wantsSeed) {
    const empty = await isEmpty();
    if (!empty && !forceSeed) {
      console.log('Skipping seed: students table is not empty. Re-run with --force-seed to override.');
    } else {
      const sql = fs.readFileSync(seedFile, 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Demo data seeded (passwords: password123 / admin: theadmin).');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Seeding failed: ${err.message}`);
      } finally {
        client.release();
      }
    }
  }

  const tables = ['admins', 'universities', 'firms', 'students', 'placements', 'applications', 'logbooks'];
  const counts = await Promise.all(
    tables.map(async (t) => {
      const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM ${t}`);
      return `${t}=${rows[0].count}`;
    })
  );
  console.log(`Row counts: ${counts.join(' ')}`);
  console.log('Bootstrap complete.');
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
