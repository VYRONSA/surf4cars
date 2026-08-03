/**
 * PCP-046 — the adversarial deployment audit.
 *
 * This does not verify that the platform works. Thirteen suites already do that, and a fourteenth
 * saying the same thing would be worth nothing. This tries to break it.
 *
 * Every probe is written to *succeed* at something it should not be able to do. A probe that passes
 * is a probe that failed to get in.
 *
 *   npm run build && npx next start -p 3100
 *   node scripts/audit-deployment-readiness.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const APP = process.env.APP_URL ?? "http://localhost:3100";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
);
const SUPABASE = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminHeaders = {
  apikey: env.SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
  "Content-Type": "application/json",
};
const db = createClient(SUPABASE, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const findings = [];
let held = 0;
const heading = (label) => console.log(`\n${label}\n${"─".repeat(label.length)}`);
/** `ok` means the attack failed. A false is a finding. */
const attack = (label, ok, detail = "", severity = "blocker") => {
  if (ok) {
    held += 1;
    console.log(`  HELD    ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    findings.push({ label, detail, severity });
    console.log(`  BROKE   ${label}${detail ? ` — ${detail}` : ""}   [${severity}]`);
  }
};
const observe = (label, value) => console.log(`  ·       ${label}: ${value}`);

const created = [];
const makeUser = async (userType) => {
  const email = `pcp046-${userType}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}@surf4cars.co.za`;
  const password = `Pcp046!${Math.random().toString(36).slice(2, 10)}Aa9`;
  const user = await (
    await fetch(`${SUPABASE}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { user_type: userType } }),
    })
  ).json();
  created.push(user.id);
  const session = await (
    await fetch(`${SUPABASE}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  ).json();
  return { user, session, email, password };
};

const PROJECT_REF = new URL(SUPABASE).hostname.split(".")[0];
const sessionContext = async (browser, session, userType, extraCookies = []) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addCookies([
    { name: "surf4cars-auth-token", value: session.access_token, domain: "localhost", path: "/" },
    { name: "surf4cars-auth-user-type", value: userType, domain: "localhost", path: "/" },
    ...extraCookies,
  ]);
  await context.addInitScript(
    ([key, value, type]) => {
      window.localStorage.setItem(key, value);
      window.localStorage.setItem("surf4cars:auth-user-type", type);
    },
    [
      `sb-${PROJECT_REF}-auth-token`,
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: session.user,
      }),
      userType,
    ],
  );
  return context;
};

console.log("\nPCP-046 — adversarial deployment audit\n──────────────────────────────────────");

const browser = await chromium.launch();

try {
  /* ══ PHASE 7 — SECURITY ═══════════════════════════════════════════════════════════════════════ */

  heading("Phase 7 · Anonymous access to protected surfaces");

  const PROTECTED = [
    "/dealer/dashboard",
    "/dealer/inventory",
    "/dealer/settings",
    "/buyer",
    "/buyer/intelligence",
    "/operations",
    "/operations/founder",
    "/operations/photography",
    "/operations/editorial",
    "/operations/audit-logs",
  ];
  for (const route of PROTECTED) {
    const response = await fetch(`${APP}${route}`, { redirect: "manual" });
    attack(
      `anonymous GET ${route}`,
      response.status === 307 || response.status === 302,
      `HTTP ${response.status}`,
    );
  }

  heading("Phase 7 · Privilege escalation between portals");

  const buyer = await makeUser("buyer");
  const dealer = await makeUser("dealer-owner");
  const ops = await makeUser("platform-owner");

  const escalations = [
    ["buyer", buyer, "buyer", ["/dealer/dashboard", "/operations/founder", "/operations/audit-logs"]],
    ["dealer", dealer, "dealer-owner", ["/operations/founder", "/operations/audit-logs", "/buyer"]],
  ];
  for (const [name, account, type, routes] of escalations) {
    const context = await sessionContext(browser, account.session, type);
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${APP}${route}`, { waitUntil: "load" });
      await page.waitForTimeout(500);
      const landed = new URL(page.url()).pathname;
      attack(`${name} session reaching ${route}`, landed !== route, `landed ${landed}`);
    }
    await context.close();
  }

  heading("Phase 7 · Forged and stale credentials");

  /* A cookie claiming to be an operator, with no Supabase token behind it. */
  const forged = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await forged.addCookies([
    { name: "surf4cars-auth-user-type", value: "platform-owner", domain: "localhost", path: "/" },
  ]);
  const forgedPage = await forged.newPage();
  await forgedPage.goto(`${APP}/operations/founder`, { waitUntil: "load" });
  await forgedPage.waitForTimeout(500);
  attack(
    "user-type cookie alone grants operator access",
    new URL(forgedPage.url()).pathname !== "/operations/founder",
    `landed ${new URL(forgedPage.url()).pathname}`,
  );
  await forged.close();

  /* A structurally valid token for a user that no longer exists. */
  const ghost = await makeUser("platform-owner");
  await fetch(`${SUPABASE}/auth/v1/admin/users/${ghost.user.id}`, { method: "DELETE", headers: adminHeaders });
  const ghostContext = await sessionContext(browser, ghost.session, "platform-owner");
  const ghostPage = await ghostContext.newPage();
  await ghostPage.goto(`${APP}/operations/founder`, { waitUntil: "load" });
  await ghostPage.waitForTimeout(800);
  attack(
    "a deleted user's token still opens operations",
    new URL(ghostPage.url()).pathname !== "/operations/founder",
    `landed ${new URL(ghostPage.url()).pathname}`,
  );
  await ghostContext.close();

  /* Garbage token. */
  const garbage = await browser.newContext();
  await garbage.addCookies([
    { name: "surf4cars-auth-token", value: "not.a.jwt", domain: "localhost", path: "/" },
    { name: "surf4cars-auth-user-type", value: "platform-owner", domain: "localhost", path: "/" },
  ]);
  const garbagePage = await garbage.newPage();
  await garbagePage.goto(`${APP}/operations/founder`, { waitUntil: "load" });
  await garbagePage.waitForTimeout(500);
  attack(
    "a malformed token opens operations",
    new URL(garbagePage.url()).pathname !== "/operations/founder",
    `landed ${new URL(garbagePage.url()).pathname}`,
  );
  await garbage.close();

  heading("Phase 7 · Direct database access with the public key");

  const anonDb = createClient(SUPABASE, ANON, { auth: { persistSession: false } });
  const SHOULD_BE_DENIED = [
    "leads",
    "vehicle_reviews",
    "media_integrity_flags",
    "dealer_onboarding_drafts",
    "dealership_ownership_claims",
  ];
  for (const table of SHOULD_BE_DENIED) {
    const { data, error } = await anonDb.from(table).select("*").limit(1);
    attack(
      `anon reads ${table}`,
      Boolean(error) || (data ?? []).length === 0,
      error ? `denied: ${error.message.slice(0, 40)}` : `${data.length} rows returned`,
    );
  }

  /* Columns PCP-038 withheld. */
  for (const column of ["owner_user_id", "verification_note", "subscription_package"]) {
    const { error } = await anonDb.from("dealerships").select(column).limit(1);
    attack(`anon reads dealerships.${column}`, Boolean(error), error ? "denied" : "READABLE");
  }

  /* Anonymous writes. */
  const { error: writeError } = await anonDb
    .from("media_reviews")
    .insert({ photograph: "/pcp046-probe.webp", state: "approved_homepage" });
  attack("anon approves a photograph", Boolean(writeError), writeError ? "denied" : "WROTE A ROW");

  heading("Phase 7 · Tenant crossover");

  const { data: dealerships } = await db.from("dealerships").select("id").limit(2);
  const { data: someoneElsesVehicle } = await db
    .from("inventory_vehicles")
    .select("id,dealership_id")
    .neq("dealership_id", dealerships[0].id)
    .limit(1)
    .maybeSingle();

  /* A dealer session scoped to dealership A, asking the API for a vehicle owned by B. */
  const crossContext = await sessionContext(browser, dealer.session, "dealer-owner", [
    { name: "surf4cars-active-dealership-id", value: dealerships[0].id, domain: "localhost", path: "/" },
  ]);
  const crossPage = await crossContext.newPage();
  const crossResponse = await crossPage.request.get(
    `${APP}/api/v1/dealer/inventory/vehicles/${someoneElsesVehicle.id}`,
  );
  attack(
    "dealer reads another dealership's vehicle through the API",
    crossResponse.status() >= 400,
    `HTTP ${crossResponse.status()}`,
  );

  const crossWrite = await crossPage.request.patch(
    `${APP}/api/v1/dealer/inventory/vehicles/${someoneElsesVehicle.id}`,
    { data: { askingPriceCents: 1 } },
  );
  attack(
    "dealer edits another dealership's vehicle",
    crossWrite.status() >= 400,
    `HTTP ${crossWrite.status()}`,
  );
  await crossContext.close();

  heading("Phase 7 · Unauthenticated API surface");

  const API_PROBES = [
    ["GET", "/api/v1/dealer/dashboard"],
    ["GET", "/api/v1/dealer/leads"],
    ["GET", "/api/v1/buyer/profile"],
    ["GET", "/api/v1/operations/dashboard"],
    ["POST", "/api/v1/operations/ownership-claims"],
    ["POST", "/api/v1/dealer/inventory/vehicles"],
  ];
  const bare = await browser.newContext();
  const barePage = await bare.newPage();
  for (const [method, route] of API_PROBES) {
    const response =
      method === "GET"
        ? await barePage.request.get(`${APP}${route}`)
        : await barePage.request.post(`${APP}${route}`, { data: {} });
    attack(`anonymous ${method} ${route}`, response.status() >= 400, `HTTP ${response.status()}`);
  }
  await bare.close();

  /* ══ PHASE 2 — TRY TO BREAK IT ════════════════════════════════════════════════════════════════ */

  heading("Phase 2 · Hostile URLs");

  const HOSTILE = [
    "/vehicle/../../etc/passwd",
    "/vehicle/%2e%2e%2f%2e%2e%2f",
    "/vehicle/<script>alert(1)</script>",
    "/dealers/'%20OR%201=1--",
    `/search?make=${"A".repeat(4000)}`,
    "/search?minPrice=abc&maxPrice=-1",
    "/search?page=-5",
    "/search?page=999999",
    "/vehicle/" + "x".repeat(500),
    "/operations/photography/not-a-real-id",
    "/%00",
  ];
  for (const route of HOSTILE) {
    try {
      const response = await fetch(`${APP}${route}`, { redirect: "manual" });
      const body = response.status < 400 ? await response.text() : "";
      const leaked = /at Object\.|node_modules|SUPABASE_|sb_secret|stack trace/i.test(body);
      attack(
        `hostile URL ${route.slice(0, 46)}`,
        response.status < 500 && !leaked,
        leaked ? "LEAKED INTERNALS" : `HTTP ${response.status}`,
        leaked ? "blocker" : "major",
      );
    } catch (error) {
      attack(`hostile URL ${route.slice(0, 46)}`, true, "request refused");
    }
  }

  heading("Phase 2 · Empty and large result sets");

  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await publicContext.newPage();

  await page.goto(`${APP}/search?make=Ferrari`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const emptyBody = await page.locator("body").innerText();
  attack(
    "empty search result set is handled",
    /no |0 |nothing|not found|try/i.test(emptyBody) && !/undefined|NaN|\[object/i.test(emptyBody),
    emptyBody.slice(0, 60).replace(/\s+/g, " "),
    "major",
  );

  await page.goto(`${APP}/search`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const fullCount = await page.locator('a[href^="/vehicle/"]').count();
  observe("search renders vehicle cards", fullCount);
  attack("full search result set renders", fullCount > 0, `${fullCount} cards`, "major");

  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  attack("search does not scroll sideways", noOverflow, "", "minor");

  heading("Phase 2 · Deep links, refresh, forward, multi-tab");

  const vehicleHref = await page.locator('a[href^="/vehicle/"]').first().getAttribute("href");
  await page.goto(`${APP}${vehicleHref}`, { waitUntil: "load" });
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(600);
  attack(
    "a deep-linked vehicle page survives a refresh",
    !(await page.locator("body").innerText()).includes("Vehicle Not Found"),
    vehicleHref,
    "major",
  );

  await page.goBack({ waitUntil: "load" }).catch(() => {});
  await page.waitForTimeout(400);
  await page.goForward({ waitUntil: "load" }).catch(() => {});
  await page.waitForTimeout(600);
  attack(
    "browser forward returns to the vehicle",
    new URL(page.url()).pathname === vehicleHref,
    new URL(page.url()).pathname,
    "major",
  );

  const tabTwo = await publicContext.newPage();
  await tabTwo.goto(`${APP}/search`, { waitUntil: "load" });
  await tabTwo.waitForTimeout(800);
  const bothWork =
    (await tabTwo.locator('a[href^="/vehicle/"]').count()) > 0
    && new URL(page.url()).pathname === vehicleHref;
  attack("two tabs at once", bothWork, "", "major");
  await tabTwo.close();

  heading("Phase 2 · Error surfaces");

  const notFound = await fetch(`${APP}/definitely-not-a-page`, { redirect: "manual" });
  attack("unmatched URL returns 404", notFound.status === 404, `HTTP ${notFound.status}`, "major");
  const notFoundBody = await notFound.text();
  attack(
    "the 404 page carries site navigation",
    /header|Marketplace|SURF/i.test(notFoundBody),
    "",
    "major",
  );

  /* ══ PHASE 8 — PRODUCTION DEPENDENCIES ════════════════════════════════════════════════════════ */

  heading("Phase 8 · Production dependencies");

  const health = await (await fetch(`${APP}/api/health`)).json();
  observe("health status", health.status);
  attack("health endpoint reports healthy", health.status === "healthy", health.status, "blocker");
  for (const check of health.checks ?? []) {
    observe(`  health · ${check.name}`, check.status);
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "";
  attack(
    "NEXT_PUBLIC_APP_URL is a production domain",
    appUrl.length > 0 && !appUrl.includes("localhost"),
    appUrl || "unset",
    "blocker",
  );
  attack("an email provider is configured", Boolean(env.RESEND_API_KEY || env.SMTP_HOST || env.POSTMARK_SERVER_TOKEN), "no key in .env.local", "blocker");
  attack("a scheduler secret is configured", Boolean(env.CRON_SECRET), "no CRON_SECRET", "blocker");
  attack("analytics is configured", Boolean(env.NEXT_PUBLIC_ANALYTICS_ID || env.NEXT_PUBLIC_GA_ID || env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN), "none found", "major");
  attack("error monitoring is configured", Boolean(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN), "none found", "major");

  const sitemap = await (await fetch(`${APP}/sitemap.xml`)).text();
  const sitemapUrls = (sitemap.match(/<loc>/g) ?? []).length;
  observe("sitemap URLs", sitemapUrls);
  attack("sitemap lists vehicles", sitemapUrls > 10, `${sitemapUrls} URLs`, "major");
  attack(
    "sitemap does not publish localhost",
    !sitemap.includes("localhost"),
    sitemap.includes("localhost") ? "every URL points at localhost" : "",
    "blocker",
  );

  const robots = await (await fetch(`${APP}/robots.txt`)).text();
  attack("robots.txt resolves", robots.includes("User-Agent") || robots.includes("User-agent"), "", "major");
  attack(
    "robots.txt does not publish localhost",
    !robots.includes("localhost"),
    robots.includes("localhost") ? "sitemap reference points at localhost" : "",
    "blocker",
  );

  /* ══ PHASE 9 — PERFORMANCE, MEASURED ══════════════════════════════════════════════════════════ */

  heading("Phase 9 · Measured performance");

  const measure = async (route) => {
    const perfPage = await publicContext.newPage();
    const start = Date.now();
    const response = await perfPage.goto(`${APP}${route}`, { waitUntil: "load" });
    const loaded = Date.now() - start;
    await perfPage.waitForTimeout(2500);
    const vitals = await perfPage.evaluate(
      () =>
        new Promise((resolve) => {
          const nav = performance.getEntriesByType("navigation")[0];
          let lcp = 0;
          let cls = 0;
          for (const entry of performance.getEntriesByType("largest-contentful-paint")) {
            lcp = Math.max(lcp, entry.startTime);
          }
          try {
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) lcp = Math.max(lcp, entry.startTime);
            }).observe({ type: "largest-contentful-paint", buffered: true });
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) if (!entry.hadRecentInput) cls += entry.value;
            }).observe({ type: "layout-shift", buffered: true });
          } catch {
            /* older engines */
          }
          setTimeout(
            () =>
              resolve({
                ttfb: Math.round(nav?.responseStart ?? 0),
                domContentLoaded: Math.round(nav?.domContentLoadedEventEnd ?? 0),
                lcp: Math.round(lcp),
                cls: Number(cls.toFixed(4)),
                transferKb: Math.round(
                  performance.getEntriesByType("resource").reduce((sum, r) => sum + (r.transferSize || 0), 0) / 1024,
                ),
              }),
            600,
          );
        }),
    );
    await perfPage.close();
    return { route, status: response?.status(), loaded, ...vitals };
  };

  const routes = ["/", "/search", vehicleHref, "/pricing"];
  const measurements = [];
  for (const route of routes) measurements.push(await measure(route));

  for (const entry of measurements) {
    observe(
      entry.route.slice(0, 40).padEnd(40),
      `TTFB ${String(entry.ttfb).padStart(5)}ms · LCP ${String(entry.lcp).padStart(5)}ms · CLS ${entry.cls} · ${entry.transferKb}kB`,
    );
  }
  const worstLcp = Math.max(...measurements.map((entry) => entry.lcp));
  const worstCls = Math.max(...measurements.map((entry) => entry.cls));
  const worstTtfb = Math.max(...measurements.map((entry) => entry.ttfb));
  attack("LCP under 2 500ms on every measured route", worstLcp < 2500, `worst ${worstLcp}ms`, "major");
  attack("CLS under 0.1 on every measured route", worstCls < 0.1, `worst ${worstCls}`, "major");
  attack("TTFB under 800ms on every measured route", worstTtfb < 800, `worst ${worstTtfb}ms`, "major");

  /* Bundle weight, from disk. */
  const chunkDir = ".next/static/chunks";
  const walk = (dir) =>
    readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      return statSync(full).isDirectory() ? walk(full) : [{ file: full, size: statSync(full).size }];
    });
  const chunks = walk(chunkDir).filter((entry) => entry.file.endsWith(".js"));
  const totalJs = Math.round(chunks.reduce((sum, entry) => sum + entry.size, 0) / 1024);
  const largest = chunks.sort((a, b) => b.size - a.size).slice(0, 3);
  observe("total client JS on disk", `${totalJs} kB across ${chunks.length} chunks`);
  for (const entry of largest) {
    observe(`  largest · ${entry.file.split(/[\\/]/).pop()}`, `${Math.round(entry.size / 1024)} kB`);
  }

  /* Database latency, measured. */
  const latencies = [];
  for (let index = 0; index < 5; index += 1) {
    const start = Date.now();
    await db.from("inventory_vehicles").select("id", { count: "exact", head: true });
    latencies.push(Date.now() - start);
  }
  const medianLatency = latencies.sort((a, b) => a - b)[2];
  observe("database round trip (median of 5)", `${medianLatency}ms`);
  attack("database latency under 500ms", medianLatency < 500, `${medianLatency}ms`, "major");

  /* Slow network. */
  const slowContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const slowPage = await slowContext.newPage();
  const cdp = await slowContext.newCDPSession(slowPage);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 300,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  const slowStart = Date.now();
  await slowPage.goto(`${APP}/`, { waitUntil: "load" });
  const slowLoad = Date.now() - slowStart;
  observe("homepage load on emulated 3G (390px)", `${slowLoad}ms`);
  attack("homepage loads within 10s on slow 3G", slowLoad < 10000, `${slowLoad}ms`, "major");
  await slowContext.close();

  /* ══ ACCESSIBILITY ════════════════════════════════════════════════════════════════════════════ */

  heading("Phase 2 · Accessibility basics");

  for (const route of ["/", "/search", "/pricing"]) {
    await page.goto(`${APP}${route}`, { waitUntil: "load" });
    await page.waitForTimeout(800);
    const a11y = await page.evaluate(() => ({
      title: document.title,
      lang: document.documentElement.lang,
      h1: document.querySelectorAll("h1").length,
      imagesWithoutAlt: [...document.querySelectorAll("img")].filter((img) => img.getAttribute("alt") === null).length,
      buttonsWithoutName: [...document.querySelectorAll("button")].filter(
        (button) => !button.textContent.trim() && !button.getAttribute("aria-label"),
      ).length,
      linksWithoutName: [...document.querySelectorAll("a")].filter(
        (anchor) => !anchor.textContent.trim() && !anchor.getAttribute("aria-label"),
      ).length,
    }));
    attack(`${route} has a document title`, a11y.title.length > 0, a11y.title, "major");
    attack(`${route} declares a language`, a11y.lang === "en", a11y.lang, "minor");
    attack(`${route} has exactly one h1`, a11y.h1 === 1, `${a11y.h1} found`, "minor");
    attack(`${route} images all carry alt`, a11y.imagesWithoutAlt === 0, `${a11y.imagesWithoutAlt} missing`, "major");
    attack(`${route} controls all have names`, a11y.buttonsWithoutName + a11y.linksWithoutName === 0, `${a11y.buttonsWithoutName} buttons, ${a11y.linksWithoutName} links`, "major");
  }

  await publicContext.close();
} finally {
  for (const id of created) {
    await fetch(`${SUPABASE}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: adminHeaders }).catch(() => {});
  }
  await db.from("media_reviews").delete().eq("photograph", "/pcp046-probe.webp");
  await browser.close();
}

console.log(`\n${"═".repeat(70)}`);
console.log(`${held} attacks held · ${findings.length} findings`);
for (const severity of ["blocker", "major", "minor"]) {
  const group = findings.filter((finding) => finding.severity === severity);
  if (group.length === 0) continue;
  console.log(`\n${severity.toUpperCase()} (${group.length})`);
  for (const finding of group) console.log(`  · ${finding.label}${finding.detail ? ` — ${finding.detail}` : ""}`);
}
console.log("");
