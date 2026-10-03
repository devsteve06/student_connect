// middleware/requestContext.js
// Assigns a UUID to every request and logs a structured completion line
// (method, route, status, duration) so each request is traceable end-to-end.
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

export function requestContext(req, res, next) {
  req.id = randomUUID();
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    logger.info('request complete', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100
    });
  });
  next();
}