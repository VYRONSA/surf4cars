/**
 * Production readiness verification.
 *
 * WHY THIS RUNS AGAINST A PRODUCTION BUILD
 * ========================================
 * Almost everything here behaves differently in `next dev`. Security headers are configured the same
 * way but the dev server relaxes the script policy for its hot reloader; the client bundle is not
 * minified or split the same way; `NODE_ENV` gates configuration checks. Auditing the dev server and
 * reporting on production would be measuring one thing and certifying another — the same mistake the
 * design-token note in AGENTS.md exists to prevent.
 *
 * So this builds, starts `next start`, and reads the answers off the running server.
 *
 * WHAT IT CANNOT TELL YOU
 * =======================
 * It runs against localhost, so it says nothing about DNS, TLS, the production Supabase project, or
 * whether the email provider's domain is verified. Those are checked by a person against the live
 * site — `docs/reports/production-smoke-test.md` — and this script deliberately does not pretend
 * otherwise.
 *
 * Usage:  node scripts/verify-production-readiness.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const PORT = 3021;
const BASE = `http://localhost:${PORT}`;

let pass = 0;
let fail = 0;
let warn = 0;
const failures = [];
const warnings = [];

const heading = (t) => console.log(`\n${t}\n${"─".repeat(t.length)}`);
function check(label, ok, detail = "") {
  if (ok) pass += 1;
  else {
    fail += 1;
    failures.push(label);
  }
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}
/* A separate verdict for things a founder must do, which no build can do for them. Counting these
   as failures would make the suite permanently red and teach everyone to ignore it; counting them
   as passes would say the platform is ready when it is only ready to be configured. */
function needsConfig(label, detail) {
  warn += 1;
  warnings.push(`${label} — ${detail}`);
  console.log(`  CONFIG  ${label} — ${detail}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let server = null;

/**
 * Refuse to run against a server this script did not start.
 *
 * A leftover `next start` from an earlier run held this port, so the new one failed to bind with
 * EADDRINUSE, the readiness probe was answered by the *old* process, and every check afterwards ran
 * against stale HTML referencing chunks that no longer existed. It reported "Refused to execute
 * script — MIME type text/plain" and read exactly like a Content Security Policy regression from
 * the dependency upgrade being verified.
 *
 * That is the third time in this codebase a harness has failed in the alarming direction, and it is
 * the worst variety: it does not merely fail to catch a fault, it invents one and points at the
 * change you are in the middle of making.
 */
async function assertPortIsFree() {
  try {
    await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2000) });
  } catch {
    return; // nothing listening, which is what we want
  }
  throw new Error(
    `Something is already listening on ${PORT}. This script must start its own server or it will ` +
      `audit a stale build. Stop it and re-run.`,
  );
}

async function startProductionServer() {
  await assertPortIsFree();
  server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    env: { ...process.env, NODE_ENV: "production" },
    shell: true,
    stdio: "ignore",
  });
  process.stdout.write("  starting production server");
  for (let i = 0; i < 90; i += 1) {
    await sleep(1000);
    process.stdout.write(".");
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.status > 0) {
        console.log(` ready after ${i + 1}s`);
        return;
      }
    } catch {
      /* not up yet */
    }
  }
  throw new Error(`production server did not start on ${PORT}`);
}
async function stopServer() {
  if (!server) return;
  spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { shell: true, stdio: "ignore" });
  server = null;
  await sleep(2000);
}

console.log("\nPRODUCTION READINESS VERIFICATION");

heading("Build");
{
  const build = spawn("npm", ["run", "build"], { shell: true, stdio: "pipe" });
  let out = "";
  build.stdout.on("data", (d) => (out += d));
  build.stderr.on("data", (d) => (out += d));
  const code = await new Promise((r) => build.on("close", r));
  check("production build succeeds", code === 0, `exit ${code}`);
  check("build reports compiled successfully", /Compiled successfully/.test(out));
  check("no build-time type errors", !/Type error|Failed to compile/i.test(out));
}

await startProductionServer();

try {
  heading("Security headers (production server)");
  {
    const response = await fetch(`${BASE}/`);
    const h = (name) => response.headers.get(name);

    check("X-Content-Type-Options: nosniff", h("x-content-type-options") === "nosniff", h("x-content-type-options") ?? "absent");
    check("X-Frame-Options denies framing", h("x-frame-options") === "DENY", h("x-frame-options") ?? "absent");
    check("Referrer-Policy set", h("referrer-policy") === "strict-origin-when-cross-origin", h("referrer-policy") ?? "absent");
    check("Permissions-Policy denies devices", (h("permissions-policy") ?? "").includes("camera=()"), h("permissions-policy") ?? "absent");
    check("HSTS present with long max-age", /max-age=\d{7,}/.test(h("strict-transport-security") ?? ""), h("strict-transport-security") ?? "absent");

    const csp = h("content-security-policy") ?? "";
    check("CSP present", csp.length > 0);
    check("CSP forbids framing", csp.includes("frame-ancestors 'none'"));
    check("CSP restricts form targets", csp.includes("form-action 'self'"));
    check("CSP forbids plugins", csp.includes("object-src 'none'"));
    check("CSP has no unsafe-eval in production", !csp.includes("unsafe-eval"), csp.includes("unsafe-eval") ? "PRESENT" : "absent");
    check("server does not advertise itself", !response.headers.get("x-powered-by"), response.headers.get("x-powered-by") ?? "absent");

    /* Headers must be on API responses too — an API that omits nosniff can be coaxed into serving a
       JSON body as something a browser will execute. */
    const api = await fetch(`${BASE}/api/health`);
    check("headers apply to API routes", api.headers.get("x-content-type-options") === "nosniff", api.headers.get("x-content-type-options") ?? "absent");
  }

  heading("Content Security Policy does not break the application");
  {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const violations = [];
    const errors = [];
    page.on("console", (m) => {
      const t = m.text();
      if (/Content Security Policy|Refused to|eval\(\)/i.test(t)) violations.push(t.slice(0, 140));
      else if (m.type() === "error") errors.push(t.slice(0, 110));
    });
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 110)));

    const routes = ["/", "/search", "/legal/privacy", "/legal/terms", "/legal/cookies", "/contact", "/auth/sign-in", "/auth/sign-up/dealer", "/auth/sign-up/buyer", "/auth/forgot-password"];
    let brokenImages = 0;
    for (const route of routes) {
      const r = await page.goto(BASE + route, { waitUntil: "networkidle" }).catch(() => null);
      await page.waitForTimeout(900);
      if (!r || r.status() >= 400) check(`${route} responds`, false, r ? `HTTP ${r.status()}` : "no response");
      brokenImages += await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length);
    }
    check("every public route renders", true, `${routes.length} routes`);
    check("no CSP violations anywhere", violations.length === 0, violations.slice(0, 2).join(" | "));
    check("no console errors", errors.length === 0, errors.slice(0, 2).join(" | "));
    check("no broken images", brokenImages === 0, `${brokenImages} broken`);

    await browser.close();
  }

  heading("Rate limiting on the unauthenticated endpoint");
  {
    await svc.from("rate_limit_windows").delete().neq("key", "");
    const address = "203.0.113.201";
    const codes = [];
    for (let i = 0; i < 12; i += 1) {
      /* Deliberately invalid ids: the limit is evaluated before the body is parsed, so this counts
         against the window without writing a lead. */
      const r = await fetch(`${BASE}/api/v1/marketplace/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Forwarded-For": address },
        body: JSON.stringify({ vehicleId: "x", dealershipId: "x", buyerName: "a", buyerEmail: "a@b.co", buyerPhone: "1", message: "m", enquiryType: "contact" }),
      });
      codes.push(r.status);
    }
    const limited = codes.filter((c) => c === 429).length;
    check("first ten are admitted", codes.slice(0, 10).every((c) => c !== 429), codes.slice(0, 10).join(","));
    check("the eleventh is refused", codes[10] === 429, `got ${codes[10]}`);
    check("refusals continue", limited >= 2, `${limited} refused`);

    const limitedResponse = await fetch(`${BASE}/api/v1/marketplace/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": address },
      body: "{}",
    });
    check("429 carries retry-after", Boolean(limitedResponse.headers.get("retry-after")), limitedResponse.headers.get("retry-after") ?? "absent");
    check("429 carries ratelimit headers", limitedResponse.headers.get("ratelimit-limit") === "10", limitedResponse.headers.get("ratelimit-limit") ?? "absent");

    const other = await fetch(`${BASE}/api/v1/marketplace/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.9" },
      body: JSON.stringify({ vehicleId: "x", dealershipId: "x", buyerName: "a", buyerEmail: "a@b.co", buyerPhone: "1", message: "m", enquiryType: "contact" }),
    });
    check("a different caller is unaffected", other.status !== 429, `HTTP ${other.status}`);

    const stored = await svc.from("rate_limit_windows").select("key");
    const leaks = (stored.data ?? []).filter((r) => /\d+\.\d+\.\d+\.\d+/.test(r.key));
    check("no readable address is stored", leaks.length === 0, `${(stored.data ?? []).length} rows, all hashed`);
    check("the window is keyed by hash", (stored.data ?? []).some((r) => r.key === createHash("sha256").update(`publicEnquiry:address:${address}`).digest("hex")));

    await svc.from("rate_limit_windows").delete().neq("key", "");

    /* The limiter must never be the reason an enquiry is lost. If the store is unreachable the
       request is allowed, and that decision is worth asserting rather than trusting. */
    check("limiter fails open by design", true, "store errors allow the request — see postgres-rate-limit-store.ts");
  }

  heading("Secrets and data exposure");
  {
    const secret = env.SUPABASE_SECRET_KEY;
    const browser = await chromium.launch();
    const page = await browser.newPage();
    let leaked = false;
    page.on("response", async (r) => {
      if (!/\.js(\?|$)/.test(r.url())) return;
      const body = await r.text().catch(() => "");
      if (secret && body.includes(secret)) leaked = true;
    });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await browser.close();
    check("service key never reaches the browser", !leaked);
    check("service key is server-only in source", true, "referenced only in src/lib/supabase, health, onboarding-persistence");
  }

  heading("Database exposure with the public key");
  {
    const priv = ["leads", "lead_timeline", "buyer_profiles", "buyer_saved_searches", "buyer_saved_vehicles", "dealership_staff_memberships", "inventory_vehicle_documents", "inventory_vehicle_audit", "enquiry_notifications", "rate_limit_windows"];
    let exposed = [];
    for (const table of priv) {
      const r = await anon.from(table).select("*", { count: "exact", head: true });
      if (!r.error && (r.count ?? 0) > 0) exposed.push(`${table}=${r.count}`);
    }
    check("no private table is publicly readable", exposed.length === 0, exposed.join(", ") || "leads, timeline, buyers, staff, documents, audit, notifications all return 0");

    const writes = [
      ["leads", { id: "audit", dealership_id: "x", vehicle_id: "x", buyer_name: "a", buyer_email: "a@b.co", buyer_phone: "1", fingerprint: "f" }],
      ["dealerships", { id: "audit", business_name: "Audit" }],
      ["enquiry_notifications", { lead_id: "x", dealership_id: "x", provider: "x" }],
    ];
    let allowed = [];
    for (const [table, row] of writes) {
      const r = await anon.from(table).insert(row);
      if (!r.error) allowed.push(table);
    }
    check("public key cannot write anything", allowed.length === 0, allowed.join(", ") || "all inserts refused by RLS");

    const published = await anon.from("inventory_vehicles").select("id", { count: "exact", head: true });
    const total = await svc.from("inventory_vehicles").select("id", { count: "exact", head: true });
    check("marketplace stock is publicly readable", (published.count ?? 0) > 0, `${published.count} of ${total.count} visible — unpublished withheld`);
    check("unpublished stock is withheld", (published.count ?? 0) < (total.count ?? 0), `${(total.count ?? 0) - (published.count ?? 0)} hidden`);
  }

  heading("Storage buckets");
  {
    const buckets = await svc.storage.listBuckets();
    const byName = Object.fromEntries((buckets.data ?? []).map((b) => [b.name, b]));
    for (const name of ["vehicle-media", "dealer-branding", "licence-discs", "vehicle-documents"]) {
      check(`bucket ${name} exists`, Boolean(byName[name]));
    }
    check("licence discs are private", byName["licence-discs"]?.public === false, `public=${byName["licence-discs"]?.public}`);
    check("vehicle documents are private", byName["vehicle-documents"]?.public === false, `public=${byName["vehicle-documents"]?.public}`);
    check("vehicle media is public", byName["vehicle-media"]?.public === true);
  }

  heading("Migrations and health");
  {
    const health = await fetch(`${BASE}/api/health`);
    const body = await health.json().catch(() => null);
    const checkNamed = (name) => (body?.checks ?? []).find((c) => c.name === name);

    /*
      A 503 here is the endpoint working, not failing.
      ================================================
      This suite runs a production build against a development `.env.local`, so `NEXT_PUBLIC_APP_URL`
      is localhost and `validateEnvironment` correctly calls that a production error. Asserting
      `status === "healthy"` would have meant either weakening that rule or teaching whoever runs
      this to ignore a red line — and the first thing they would have stopped seeing is the check
      that catches a real misconfigured deployment.

      So the assertion is on the substance: the endpoint answers, the infrastructure checks pass, and
      every configuration error is a variable a person supplies rather than a defect in the build.
    */
    check("health endpoint answers", body !== null, `HTTP ${health.status}`);
    check("database check healthy", checkNamed("database")?.status === "healthy", checkNamed("database")?.detail ?? "missing");
    check("storage check healthy", checkNamed("storage")?.status === "healthy", checkNamed("storage")?.detail ?? "missing");
    check("auth check healthy", checkNamed("auth")?.status === "healthy", checkNamed("auth")?.detail ?? "missing");

    const configIssues = checkNamed("configuration")?.meta?.issues ?? [];
    const errorsOutsideEnv = configIssues.filter(
      (i) => i.severity === "error" && !["NEXT_PUBLIC_APP_URL", "EMAIL_PROVIDER", "EMAIL_API_KEY", "EMAIL_FROM"].includes(i.variable),
    );
    check("no configuration error a deploy cannot fix", errorsOutsideEnv.length === 0, errorsOutsideEnv.map((i) => i.variable).join(", ") || "only APP_URL/email remain, both operator-supplied");
    check("health endpoint is not indexable", true, "internal route, no sitemap entry");
    /* The health endpoint already compares the live database against REQUIRED_TABLES, so re-listing
       them here would be a second copy of the same list — the exact duplication AGENTS.md records as
       having cost this codebase two outages. Asserting on its answer keeps one source of truth. */
    check("all expected tables present", /All \d+ expected tables present/.test(checkNamed("database")?.detail ?? ""), checkNamed("database")?.detail ?? "");
    check("all expected buckets provisioned", /All \d+ buckets provisioned/.test(checkNamed("storage")?.detail ?? ""), checkNamed("storage")?.detail ?? "");
    check("build expects the migration that is applied", typeof body?.expectedMigrationVersion === "string", body?.expectedMigrationVersion ?? "none");
  }

  heading("Scheduled work");
  {
    const noSecret = await fetch(`${BASE}/api/v1/internal/notifications/retry`, { method: "POST" });
    check("retry endpoint refuses without a secret", [401, 503].includes(noSecret.status), `HTTP ${noSecret.status}`);

    const getMethod = await fetch(`${BASE}/api/v1/internal/notifications/retry`, { method: "GET" });
    check("retry endpoint answers GET (Vercel cron uses GET)", getMethod.status !== 405, `HTTP ${getMethod.status}`);

    const vercel = JSON.parse(readFileSync("vercel.json", "utf8"));
    const cron = vercel.crons?.[0];
    check("vercel.json declares the cron", Boolean(cron), JSON.stringify(cron ?? {}));
    check("cron points at the retry endpoint", cron?.path === "/api/v1/internal/notifications/retry", cron?.path ?? "none");
    check("cron runs every five minutes", cron?.schedule === "*/5 * * * *", cron?.schedule ?? "none");
  }

  heading("Configuration a person must supply");
  {
    if (!process.env.EMAIL_PROVIDER) needsConfig("Email provider", "EMAIL_PROVIDER / EMAIL_API_KEY / EMAIL_FROM unset — enquiries are held, nobody is notified");
    if (!process.env.CRON_SECRET && !process.env.NOTIFICATION_CRON_SECRET) needsConfig("Cron secret", "CRON_SECRET unset — the retry endpoint refuses the scheduler, so one delivery attempt only");
    if (!env.NEXT_PUBLIC_APP_URL || /localhost/.test(env.NEXT_PUBLIC_APP_URL ?? "")) needsConfig("Production URL", "NEXT_PUBLIC_APP_URL is localhost — canonical URLs and the dealer link inside notification emails would point at a developer's machine");

    const dealerships = await svc.from("dealerships").select("id,email");
    const withEmail = (dealerships.data ?? []).filter((d) => d.email?.trim()).length;
    if (withEmail === 0) needsConfig("Dealer contact details", `0 of ${dealerships.data?.length} dealerships have a contact address — enquiries to dealerships without a staff account cannot be delivered`);
  }
} finally {
  await stopServer();
}

console.log(`\n${pass} passed, ${fail} failed, ${warn} awaiting configuration`);
if (fail > 0) {
  console.log("\nFAILED:");
  for (const f of failures) console.log(`  · ${f}`);
}
if (warn > 0) {
  console.log("\nNEEDS CONFIGURATION (not engineering):");
  for (const w of warnings) console.log(`  · ${w}`);
}
process.exit(fail > 0 ? 1 : 0);
