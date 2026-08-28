// data/db.js
// -----------------------------------------------------------------------------
// Dual-mode PostgreSQL access layer.
//
//   • If DATABASE_URL is set  -> connect to a real PostgreSQL server via `pg`.
//   • Otherwise               -> spin up an in-process PostgreSQL (`pg-mem`)
//                                seeded from sql/schema.sql + sql/seed.sql.
//
// Either way the rest of the app calls the SAME `query(text, params)` function,
// so controllers are database-agnostic. To go to production, set DATABASE_URL
// (and run sql/schema.sql + sql/seed.sql against that database once).
// -----------------------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.join(__dirname, '..', 'sql');

let pool;

export async function initDb() {
  // Treat blank/whitespace and unsubstituted templates (e.g. "${{ Postgres.DATABASE_URL }}")
  // as "not set" so a misconfigured value falls back to pg-mem instead of crashing startup.
  const databaseUrl = (process.env.DATABASE_URL || '').trim();
  const hasRealDatabaseUrl = databaseUrl !== '' && !databaseUrl.includes('${');

  if (hasRealDatabaseUrl) {
    const { Pool } = await import('pg');
    // Supabase enforces TLS. Its certificates chain to a private CA and node-postgres
    // would treat `?sslmode=require` in the URL as verify-full, so set SSL explicitly.
    // `rejectUnauthorized: false` is acceptable for development; in production pin the
    // Supabase CA (ssl: { ca }) and use sslmode=verify-full instead.
    const host = databaseUrl.split('@').pop()?.split('/')[0]?.toLowerCase() || '';
    // Matches both `db.<ref>.supabase.co` (direct) and `aws-0-<region>.pooler.supabase.com` (pooler).
    const ssl = host.includes('supabase') ? { rejectUnauthorized: false } : undefined;
    pool = new Pool({ connectionString: databaseUrl, ssl });
    pool.on('error', (err) => console.error(`[db] idle client error: ${err.message}`));
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL via DATABASE_URL.');
  } else {
    const { newDb } = await import('pg-mem');
    const mem = newDb();
    mem.public.none(fs.readFileSync(path.join(sqlDir, 'schema.sql'), 'utf8'));
    mem.public.none(fs.readFileSync(path.join(sqlDir, 'seed.sql'), 'utf8'));
    const { Pool } = mem.adapters.createPg();
    pool = new Pool();
    console.log('Using in-memory PostgreSQL (pg-mem) seeded from sql/schema.sql + sql/seed.sql.');
    console.log('Set DATABASE_URL in .env to point at a real PostgreSQL database.');
  }
  return pool;
}

export function query(text, params) {
  if (!pool) throw new Error('Database not initialised — call initDb() first.');
  return pool.query(text, params);
}
