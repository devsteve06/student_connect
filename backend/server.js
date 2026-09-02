import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { requestContext } from './middleware/requestContext.js';
import { initDb, closeDb, query } from './data/db.js';
import { logger } from './utils/logger.js';

dotenv.config();

// Fail fast if the JWT signing secret is missing — never fall back to a literal.
if (!process.env.JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET is not set. Refusing to start without a signing secret.');
  process.exit(1);
}

const app = express();

// Baseline HTTP security headers (CSP, X-Content-Type-Options, HSTS, etc.).
app.use(helmet());

// Restrict CORS to an explicit allowlist when CORS_ORIGIN is set (comma-separated
// origins). If unset, fall back to permissive CORS for local development.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors(
    allowedOrigins.length > 0
      ? {
          origin: (origin, cb) =>
            !origin || allowedOrigins.includes(origin)
              ? cb(null, true)
              : cb(new Error(`Origin ${origin} not allowed by CORS policy.`))
        }
      : undefined
  )
);

// Request id + structured completion log, then an explicit body-size cap.
app.use(requestContext);
app.use(express.json({ limit: '100kb' }));

// Liveness: the process is up. No DB dependency.
app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));

// Readiness: the process can serve traffic (DB reachable).
app.get('/readyz', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    logger.error('readyz check failed', { error: err.message });
    res.status(503).json({ status: 'unavailable' });
  }
});

// Static info root (kept for humans; probes should use /healthz + /readyz).
app.get('/', (_req, res) => res.send('Industrial Attachment API Engine Operational.'));

app.use('/api/v1', apiRouter);

// 404 + central error handling (must be last).
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialise the database (real PostgreSQL via DATABASE_URL, else seeded pg-mem)
// before accepting traffic.
initDb()
  .then(() => {
    const server = app.listen(PORT, () =>
      logger.info('backend started', {
        mode: process.env.NODE_ENV || 'development',
        port: PORT,
        url: `http://localhost:${PORT}`
      })
    );

    // Graceful shutdown: stop accepting connections, drain in-flight requests,
    // close the DB pool, then exit. Force-exit after a timeout so a hung drain
    // can't stall a platform (e.g. Render) restart forever.
    let shuttingDown = false;
    const shutdown = (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      logger.info('shutdown signal received', { signal });

      const forceExit = setTimeout(() => {
        logger.error('graceful shutdown timed out; forcing exit', { signal });
        process.exit(1);
      }, 10_000);
      forceExit.unref();

      server.closeIdleConnections();
      server.close(async () => {
        try {
          await closeDb();
          logger.info('database pool closed');
        } catch (err) {
          logger.error('error closing database pool', { error: err.message });
        }
        clearTimeout(forceExit);
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    logger.error('failed to initialise database', { error: err.message });
    process.exit(1);
  });