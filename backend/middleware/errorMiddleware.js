
export const notFound = (req, res) => {
  res.status(404).json({ message: `Target API route resource context not found: ${req.method} ${req.originalUrl}` });
};


export const errorHandler = (err, req, res, next) => {
  console.error(`[error] ${err.message}`);
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({ message: err.message || 'Internal server error.' });
};
