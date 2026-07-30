import pino from 'pino';
import { env } from '@/shared/config/env';

/**
 * Structured logging wrapper — 10-backend-architecture.md Section 19.1.
 *
 * Every log line is a structured JSON object carrying `correlationId`,
 * `module`, `severity`, `actorId` (if authenticated), and arbitrary
 * structured `context`. Sensitive fields are redacted automatically as a
 * defense-in-depth backstop (Section 17.6 generalized).
 */

const REDACT_PATHS = [
  'password',
  'passwordHash',
  '*.password',
  '*.passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.authorization',
  'req.headers.authorization',
  'req.headers.cookie',
  'cardNumber',
  '*.cardNumber',
  'cvv',
  '*.cvv',
];

const baseLogger = pino({
  level: env.LOG_LEVEL,
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { app: env.APP_NAME, env: env.NODE_ENV },
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'iso' } }
      : undefined,
});

export interface LogContext {
  correlationId?: string;
  actorId?: string;
  [key: string]: unknown;
}

/**
 * Returns a logger pre-bound to a module name, matching the convention every
 * module follows so log lines are filterable by owning module
 * (Section 26.4's Logging Conventions).
 */
export function createModuleLogger(moduleName: string) {
  const scoped = baseLogger.child({ module: moduleName });

  return {
    debug: (message: string, context?: LogContext) => scoped.debug(context ?? {}, message),
    info: (message: string, context?: LogContext) => scoped.info(context ?? {}, message),
    warn: (message: string, context?: LogContext) => scoped.warn(context ?? {}, message),
    error: (message: string, error?: unknown, context?: LogContext) =>
      scoped.error(
        {
          ...context,
          err:
            error instanceof Error
              ? { name: error.name, message: error.message, stack: error.stack }
              : error,
        },
        message,
      ),
  };
}

export const logger = createModuleLogger('app');
export type ModuleLogger = ReturnType<typeof createModuleLogger>;
