type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const isDev = process.env.NODE_ENV !== 'production';
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? (isDev ? 'debug' : 'info');

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (LEVELS[level] < LEVELS[minLevel]) return;

  if (isDev) {
    const prefix: Record<LogLevel, string> = {
      debug: '🔍',
      info:  '✅',
      warn:  '⚠️ ',
      error: '🚨',
    };
    const extra = meta ? ' ' + JSON.stringify(meta) : '';
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](`${prefix[level]} [${level.toUpperCase()}] ${message}${extra}`);
  } else {
    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      msg: message,
      ...(meta ?? {}),
    });
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](entry);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info:  (msg: string, meta?: Record<string, unknown>) => log('info',  msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => log('warn',  msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};
