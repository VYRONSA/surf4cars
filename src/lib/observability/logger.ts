/**
 * Structured logging for SURF FOR CARS.
 *
 * Emits one JSON object per line so log aggregators can index fields directly. In development the
 * same record is printed in a readable form. Nothing here changes application behaviour — callers
 * that still use console.* continue to work unchanged.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Field names whose values must never reach a log sink. */
const REDACTED_KEYS = [
  "password", "token", "accesstoken", "access_token", "refreshtoken", "refresh_token",
  "apikey", "api_key", "authorization", "cookie", "secret", "servicekey", "service_key",
  "buyeremail", "buyer_email", "buyerphone", "buyer_phone", "email", "phone", "whatsapp",
  "telephone", "vin", "registration", "registrationnumber", "registration_number",
];

function isRedactedKey(key: string): boolean {
  const normalised = key.toLowerCase().replace(/[^a-z_]/g, "");
  return REDACTED_KEYS.some((candidate) => normalised === candidate.replace(/[^a-z_]/g, ""));
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth-limit]";
  if (value === null || value === undefined) return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redact(item, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isRedactedKey(key) ? "[redacted]" : redact(item, depth + 1);
    }
    return out;
  }
  return value;
}

function resolveMinimumLevel(): LogLevel {
  const configured = (process.env.LOG_LEVEL ?? "").toLowerCase();
  if (configured === "debug" || configured === "info" || configured === "warn" || configured === "error") {
    return configured;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

export interface LogRecord {
  readonly level: LogLevel;
  readonly message: string;
  readonly scope: string;
  readonly timestamp: string;
  readonly [key: string]: unknown;
}

function emit(level: LogLevel, scope: string, message: string, context: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[resolveMinimumLevel()]) return;

  const record = {
    level,
    scope,
    message,
    timestamp: new Date().toISOString(),
    ...(redact(context) as Record<string, unknown>),
  };

  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.info;

  if (process.env.NODE_ENV === "production") {
    sink(JSON.stringify(record));
    return;
  }

  sink(`[${level}] ${scope}: ${message}`, Object.keys(context).length > 0 ? redact(context) : "");
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  child(childScope: string): Logger;
}

export function createLogger(scope: string): Logger {
  return {
    debug: (message, context = {}) => emit("debug", scope, message, context),
    info: (message, context = {}) => emit("info", scope, message, context),
    warn: (message, context = {}) => emit("warn", scope, message, context),
    error: (message, context = {}) => emit("error", scope, message, context),
    child: (childScope) => createLogger(`${scope}:${childScope}`),
  };
}

export const logger = createLogger("surf4cars");
