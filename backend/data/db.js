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
  if (process.env.DATABASE_URL) {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
