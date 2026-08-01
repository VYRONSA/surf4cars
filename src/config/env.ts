/**
 * Environment variable configuration.
 * Validates required public env vars at build time where possible.
 */

interface EnvConfig {
  readonly appUrl: string;
  readonly supabaseUrl: string | undefined;
  readonly supabaseAnonKey: string | undefined;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
}

function getEnvConfig(): EnvConfig {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
  };
}

export const env = getEnvConfig();

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export type ConfigSeverity = "error" | "warning";

export interface ConfigIssue {
  readonly severity: ConfigSeverity;
  readonly variable: string;
  readonly message: string;
}

export interface ConfigValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ConfigIssue[];
}

/**
 * Validates deployment configuration.
 *
 * Existing behaviour is unchanged: nothing here throws on import, and `env` / `isSupabaseConfigured`
 * behave exactly as before. This exists so misconfiguration surfaces at startup and on the health
 * endpoint, rather than as scattered request-time failures.
 *
 * Rules tighten in production — a placeholder app URL is tolerable locally but not in production,
 * where canonical URLs, Open Graph images and structured data all derive from it.
 */
export function validateEnvironment(): ConfigValidationResult {
  const issues: ConfigIssue[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push({
      severity: "error",
      variable: "NEXT_PUBLIC_SUPABASE_URL",
      message: "Supabase URL is not set. Authentication and persistence are unavailable.",
    });
  } else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(process.env.NEXT_PUBLIC_SUPABASE_URL.trim())) {
    issues.push({
      severity: "warning",
      variable: "NEXT_PUBLIC_SUPABASE_URL",
      message: "Supabase URL does not match the expected https://<ref>.supabase.co form.",
    });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    issues.push({
      severity: "error",
      variable: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      message: "Supabase anon key is not set. All database access will fail.",
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    issues.push({
      severity: isProduction ? "error" : "warning",
      variable: "NEXT_PUBLIC_APP_URL",
      message: "App URL is not set; canonical URLs and Open Graph images fall back to localhost.",
    });
  } else if (isProduction && /localhost|127\.0\.0\.1/i.test(appUrl)) {
    issues.push({
      severity: "error",
      variable: "NEXT_PUBLIC_APP_URL",
      message: "App URL points at localhost in a production build.",
    });
  } else if (isProduction && !appUrl.startsWith("https://")) {
    issues.push({
      severity: "error",
      variable: "NEXT_PUBLIC_APP_URL",
      message: "App URL must use https in production; auth cookies are issued as Secure.",
    });
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}
