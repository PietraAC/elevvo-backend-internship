import { config } from '../config/env.js';

const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type LogLevel = keyof typeof levels;

function write(level: LogLevel, event: string, context: Record<string, unknown> = {}): void {
  if (levels[level] < levels[config.LOG_LEVEL]) return;

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context
  });

  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.log(entry);
}

export const logger = {
  debug: (event: string, context?: Record<string, unknown>) => write('debug', event, context),
  info: (event: string, context?: Record<string, unknown>) => write('info', event, context),
  warn: (event: string, context?: Record<string, unknown>) => write('warn', event, context),
  error: (event: string, context?: Record<string, unknown>) => write('error', event, context)
};
