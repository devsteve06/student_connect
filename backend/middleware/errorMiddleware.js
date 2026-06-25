
export const notFound = (req, res) => {
  res.status(404).json({ message: `Target API route resource context not found: ${req.method} ${req.originalUrl}` });
};


export const errorHandler = (err, req, res, next) => {
  // Prefer an explicit status carried on the error; otherwise treat it as a 500.
  // Never infer success/redirect codes (res.statusCode defaults to 200) as the error status.
  const status = err.status || err.statusCode || 500;

  // Log full detail server-side for diagnosis.
  console.error(`[error] ${req.method} ${req.originalUrl} -> ${status}: ${err.stack || err.message}`);

  // Don't leak internal error detail (DB/driver text) to clients on 5xx in production.
  const exposeMessage = status < 500 || process.env.NODE_ENV !== 'production';
  res.status(status).json({
    message: exposeMessage ? err.message || 'Internal server error.' : 'Internal server error.'
  });
};
