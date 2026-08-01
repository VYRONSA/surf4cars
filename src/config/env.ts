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

  issues.push(...validateNotificationEnvironment(isProduction));

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

/**
 * Email delivery configuration.
 *
 * A warning rather than an error, and the distinction is the point: a deployment with no email
 * provider still records every enquiry and still shows it to the dealership. It is degraded, not
 * broken, and failing the health check outright would say the platform cannot take enquiries when
 * it certainly can. What it cannot do is tell anybody — which is exactly what these messages say.
 *
 * `mock` in production is the exception and is an error. It is the one setting that looks configured,
 * reports every send as successful, and delivers nothing.
 */
function validateNotificationEnvironment(isProduction: boolean): readonly ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const provider = (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();

  if (!provider) {
    issues.push({
      severity: "warning",
      variable: "EMAIL_PROVIDER",
      message:
        "No email provider set. Enquiries are recorded and visible to dealers, but no dealership is notified.",
    });
    return issues;
  }

  if (provider === "mock") {
    issues.push({
      severity: isProduction ? "error" : "warning",
      variable: "EMAIL_PROVIDER",
      message: isProduction
        ? "EMAIL_PROVIDER=mock in production. Nothing is delivered and every send is reported as successful."
        : "EMAIL_PROVIDER=mock — sends are simulated, nothing leaves the machine.",
    });
    return issues;
  }

  if (provider === "ses") {
    issues.push({
      severity: "error",
      variable: "EMAIL_PROVIDER",
      message: "Amazon SES is not implemented in this build. Use resend or sendgrid.",
    });
    return issues;
  }

  if (provider !== "resend" && provider !== "sendgrid") {
    issues.push({
      severity: "error",
      variable: "EMAIL_PROVIDER",
      message: `"${provider}" is not a known provider. Use resend, sendgrid or ses.`,
    });
    return issues;
  }

  if (!process.env.EMAIL_API_KEY) {
    issues.push({
      severity: "error",
      variable: "EMAIL_API_KEY",
      message: `EMAIL_PROVIDER is "${provider}" but no API key is set. No notification can be sent.`,
    });
  }
  if (!process.env.EMAIL_FROM) {
    issues.push({
      severity: "error",
      variable: "EMAIL_FROM",
      message: `EMAIL_PROVIDER is "${provider}" but no sender address is set.`,
    });
  }

  if (isProduction && !process.env.NOTIFICATION_CRON_SECRET) {
    issues.push({
      severity: "warning",
      variable: "NOTIFICATION_CRON_SECRET",
      message:
        "The retry endpoint is disabled. A notification that fails its first attempt will never be retried.",
    });
  }

  return issues;
}
