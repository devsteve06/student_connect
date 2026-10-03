// utils/logger.js
// Tiny dependency-free structured logger. Emits one JSON object per line so
// lines are greppable and parseable by log shippers. Level is controlled by
// the LOG_LEVEL env var (debug|info|warn|error), defaulting to info.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const configured = (process.env.LOG_LEVEL || 'info').toLowerCase();
const threshold = LEVELS[configured] ?? LEVELS.info;

function emit(level, msg, meta = {}) {
  if (LEVELS[level] < threshold) return;
  const line = JSON.stringify({ t: new Date().toISOString(), level, msg, ...meta });
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  sink(line);
}

export const logger = {
  debug: (msg, meta) => emit('debug', msg, meta),
  info: (msg, meta) => emit('info', msg, meta),
  warn: (msg, meta) => emit('warn', msg, meta),
  error: (msg, meta) => emit('error', msg, meta)
};