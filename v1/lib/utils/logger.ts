type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString();
  const payload = meta ? { message, meta } : { message };

  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[${timestamp}] [DEBUG]`, payload);
      }
      break;
    case 'info':
      console.info(`[${timestamp}] [INFO]`, payload);
      break;
    case 'warn':
      console.warn(`[${timestamp}] [WARN]`, payload);
      break;
    case 'error':
      console.error(`[${timestamp}] [ERROR]`, payload);
      break;
    default:
      console.log(`[${timestamp}]`, payload);
  }
}

export const logger = {
  debug: (message: string, meta?: unknown) => log('debug', message, meta),
  info: (message: string, meta?: unknown) => log('info', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  error: (message: string, meta?: unknown) => log('error', message, meta),
};

