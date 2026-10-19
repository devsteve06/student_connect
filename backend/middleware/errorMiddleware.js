
import { logger } from '../utils/logger.js';

export const notFound = (req, res) => {
  res.status(404).json({ message: `Target API route resource context not found: ${req.method} ${req.originalUrl}` });
};


// Multer reports upload problems through a `code` rather than a status; turn
// the two the client can act on into real HTTP codes so they are not 500s.
function uploadStatus(err) {
  if (err.code === 'LIMIT_FILE_SIZE') return 413;
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return 400;
  return null;
}

export const errorHandler = (err, req, res, next) => {
  // Prefer an explicit status carried on the error; otherwise treat it as a 500.
  // Never infer success/redirect codes (res.statusCode defaults to 200) as the error status.
  const status = err.status || err.statusCode || uploadStatus(err) || 500;

  // Log full detail server-side for diagnosis.
  logger.error('request error', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    status,
    error: err.stack || err.message
  });

  // Don't leak internal error detail (DB/driver text) to clients on 5xx in production.
  const exposeMessage = status < 500 || process.env.NODE_ENV !== 'production';
  res.status(status).json({
    message: exposeMessage ? err.message || 'Internal server error.' : 'Internal server error.'
  });
};
