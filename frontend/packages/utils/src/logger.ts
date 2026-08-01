/**
 * Minimal leveled logger for client and server code that isn't already
 * covered by OpenTelemetry/Sentry instrumentation (18-observability-and-monitoring.md) —
 * e.g. a quick diagnostic during feature development. This is deliberately
 * not a replacement for that stack: anything that needs to be queried,
 * alerted on, or correlated across a request should go through the
 * OpenTelemetry/Sentry setup described there, not this logger.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV !== "production";

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (level === "debug" && !isDev) return;

  const payload = context ? [message, context] : [message];
  // This IS the logging primitive everything else in the app should call
  // instead of console directly.
  console[level === "debug" ? "log" : level](`[${level.toUpperCase()}]`, ...payload);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
};
