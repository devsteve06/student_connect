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
// (and run `npm run db:bootstrap -- --seed` against that database once).
//
// Safety rail: with NODE_ENV=production a missing or unsubstituted DATABASE_URL
// is fatal rather than a silent fall back to disposable in-memory data.
// -----------------------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { runMigrations } from './migrations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.join(__dirname, '..', 'sql');

let pool;

// Builds a pg Pool for a real PostgreSQL connection string. Supabase enforces
// TLS, its certificates chain to a private CA, and node-postgres would treat
// `?sslmode=require` in the URL as verify-full — so set SSL explicitly.
//
// TLS verification is controlled by env so the same code works in dev and prod:
//   DATABASE_SSL_CA_FILE  path to a PEM CA bundle (e.g. Supabase's SupabaseCA.crt).
//                       When set, the chain is verified (rejectUnauthorized: true).
//   DATABASE_SSL_REJECT_UNAUTHORIZED=false  opt out of chain verification.
// Default: verified when a CA file is supplied, unverified otherwise (dev default).
export async function createPgPool(connectionString) {
  const { Pool } = await import('pg');
  const host = connectionString.split('@').pop()?.split('/')[0]?.toLowerCase() || '';

  // Matches both `db.<ref>.supabase.co` (direct) and
  // `aws-0-<region>.pooler.supabase.com` (session pooler).
  const isManagedTlsHost = host.includes('supabase');

  let ssl;
  if (isManagedTlsHost) {
    const caFile = (process.env.DATABASE_SSL_CA_FILE || '').trim();
    const flag = (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || '').trim();
    const ca = caFile ? fs.readFileSync(caFile, 'utf8') : undefined;

    // Verification is on whenever a CA bundle is supplied or explicitly
    // requested; the only way to end up with it off is the dev default (no CA
    // file) or an explicit opt-out.
    const wantsVerification = ca !== undefined || /^(1|true|yes|on)$/i.test(flag);
    const optedOut = /^(0|false|no|off)$/i.test(flag);
    const rejectUnauthorized = wantsVerification && !optedOut;

    ssl = { ...(ca !== undefined ? { ca } : {}), rejectUnauthorized };

    if (!rejectUnauthorized) {
      logger.warn(
        'database TLS chain verification is off — set DATABASE_SSL_CA_FILE to the provider CA bundle before production'
      );
    }
  }

  return new Pool({ connectionString, ssl });
}

export async function initDb() {
  // Treat blank/whitespace and unsubstituted templates (e.g. "${{ Postgres.DATABASE_URL }}")
  // as "not set" so a misconfigured value falls back to pg-mem instead of crashing startup.
  const databaseUrl = (process.env.DATABASE_URL || '').trim();
  const hasRealDatabaseUrl = databaseUrl !== '' && !databaseUrl.includes('${');

  // In production a missing/unsubstituted DATABASE_URL must not silently boot a
  // throwaway in-memory database — that serves fake, non-persistent data.
  if (!hasRealDatabaseUrl && process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL is required when NODE_ENV=production. Refusing to start against the in-memory pg-mem store.'
    );
  }

  if (hasRealDatabaseUrl) {
    pool = await createPgPool(databaseUrl);
    pool.on('error', (err) => logger.error('db idle client error', { error: err.message }));
    await pool.query('SELECT 1');
    // Apply pending migrations so schema drift (e.g. students.phone) self-heals
    // on boot instead of being a manual Supabase SQL Editor step.
    await runMigrations(pool);
    logger.info('Connected to PostgreSQL via DATABASE_URL.');
  } else {
    const { newDb } = await import('pg-mem');
    const mem = newDb();
    mem.public.none(fs.readFileSync(path.join(sqlDir, 'schema.sql'), 'utf8'));
    mem.public.none(fs.readFileSync(path.join(sqlDir, 'seed.sql'), 'utf8'));
    const { Pool } = mem.adapters.createPg();
    pool = new Pool();
    logger.info('Using in-memory PostgreSQL (pg-mem) seeded from sql/schema.sql + sql/seed.sql.');
    logger.info('Set DATABASE_URL in .env to point at a real PostgreSQL database.');
  }
  return pool;
}

export function query(text, params) {
  if (!pool) throw new Error('Database not initialised — call initDb() first.');
  return pool.query(text, params);
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
