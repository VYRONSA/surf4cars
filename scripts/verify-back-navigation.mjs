/**
 * Universal Back navigation — every page, signed in, in a real browser (PCP-042).
 *
 * WHY THIS EXISTS SEPARATELY FROM `verify-journeys.mjs`
 * ====================================================
 * The journey audit proved the control is present on every route a signed-out visitor can reach.
 * That is thirty-odd routes short of "every page", because every dealer, buyer and operations screen
 * redirects to sign-in before rendering. What it actually proved about those was "wherever you land
 * there is a way back" — a true statement about the redirect, and no statement at all about the
 * page.
 *
 * The Founder's instruction is explicit: *do not assume because it exists in a shell; actually test
 * it.* So this signs in.
 *
 * HOW THE ROUTE LIST IS BUILT
 * ===========================
 * From the filesystem, not from a list I typed. Every `src/app/**\/page.tsx` becomes a route, with
 * route groups stripped and dynamic segments resolved against live data. A hand-written list is a
 * list of the pages somebody remembered, and it passes while the page nobody remembered is broken —
 * which is exactly how `/design-system` and the unmatched-URL 404 shipped with no Back control while
 * a twelve-path audit reported green.
 *
 * SESSIONS
 * ========
 * Three temporary accounts are created through the Supabase admin API, carrying the user type in
 * `user_metadata` — the same field `resolveUserTypeFromSupabaseUser` reads. Cookies are then set
 * directly rather than driven through the sign-in form: this is a test *of the pages*, and routing a
 * form submission through it would only add a way for the harness to fail that tells us nothing
 * about Back buttons.
 *
 * Every account is deleted at the end, including on failure. Addresses are platform-owned
 * `@surf4cars.co.za` demonstration addresses so they cannot reach anybody.
 *
 *   npm run build && npx next start -p 3100
 *   node scripts/verify-back-navigation.mjs
 */
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
const SECRET = env.SUPABASE_SECRET_KEY;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminHeaders = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };

let passed = 0;
let failed = 0;
const failures = [];
const heading = (text) => console.log(`\n${text}\n${"─".repeat(text.length)}`);
const check = (label, ok, detail = "") => {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

/* ── Route discovery ──────────────────────────────────────────────────────────────────────────── */

function discoverRoutes(dir = "src/app", prefix = "") {
  const routes = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      /* `(group)` and `@slot` segments do not appear in the URL. */
      const segment = /^\(.*\)$/.test(entry) || entry.startsWith("@") ? "" : `/${entry}`;
      routes.push(...discoverRoutes(full, `${prefix}${segment}`));
    } else if (entry === "page.tsx" || entry === "page.ts") {
      routes.push(prefix === "" ? "/" : prefix);
    }
  }
  return routes;
}

const discovered = [...new Set(discoverRoutes())].sort();

/*
  Routes that are deliberately absent from a deployed build — `proxy.ts` answers 404 with no body
  because those screens write to the working tree. Asserting a Back control on them would be
  asserting a page that is supposed to not exist.
*/
const LOCAL_ONLY = ["/admin/creative/media-review", "/admin/creative/moodboard"];

/*
  Prefix matching has to be on a whole segment. `startsWith("/dealer")` also swallows `/dealers/…`,
  the public dealership profile — which then failed the placement check for being at the public
  shell's 52px rather than the portal's 288px. Both were correct; the grouping was not.
*/
const PORTAL_OF = (route) => {
  const [, first] = route.split("/");
  if (first === "dealer") return "dealer";
  if (first === "buyer") return "buyer";
  if (first === "operations") return "operations";
  return "public";
};

/* ── Temporary sessions ───────────────────────────────────────────────────────────────────────── */

const created = [];

const createUser = async (email, userType) => {
  const response = await fetch(`${SUPABASE}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { user_type: userType, full_name: "PCP-042 verification" },
    }),
  });
  if (!response.ok) throw new Error(`create ${email} → ${response.status} ${await response.text()}`);
  const user = await response.json();
  created.push(user.id);
  return user;
};

const deleteUser = (id) =>
  fetch(`${SUPABASE}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: adminHeaders }).catch(() => {});

const PASSWORD = `Pcp042!${Math.random().toString(36).slice(2, 10)}Aa9`;

const signIn = async (email) => {
  const response = await fetch(`${SUPABASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`sign in ${email} → ${response.status} ${await response.text()}`);
  return response.json();
};

/*
  A session is two things, and setting only one of them logs you straight back out.
  ===============================================================================
  Injecting the auth cookies alone looked correct and failed: every portal route still redirected to
  sign-in. The cookies were present before the navigation and gone after it, because the client auth
  provider syncs cookies *from* the Supabase session in localStorage — and finding none, it calls
  `clearClientAuthState()` and deletes them. The harness was signing itself out on first paint.

  So both halves are seeded: the cookies, because the first server render happens before any client
  JavaScript and `resolvePortalAccess` reads them; and the Supabase session in localStorage, so the
  provider agrees the session exists rather than tidying it away.

  This is the storage key `@supabase/supabase-js` derives from the project URL.
*/
const PROJECT_REF = new URL(SUPABASE).hostname.split(".")[0];
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

const cleanUp = async () => {
  for (const id of created) await deleteUser(id);
};

process.on("exit", () => {
  /* Best effort — the awaited path below is the real one. */
});

console.log("\nUniversal Back navigation (PCP-042)\n───────────────────────────────────");
console.log(`${discovered.length} page routes discovered from src/app`);

const browser = await chromium.launch();

try {
  heading("Sessions");

  const stamp = Date.now().toString(36);
  const accounts = {
    buyer: await createUser(`pcp042-buyer-${stamp}@surf4cars.co.za`, "buyer"),
    dealer: await createUser(`pcp042-dealer-${stamp}@surf4cars.co.za`, "dealer-owner"),
    operations: await createUser(`pcp042-ops-${stamp}@surf4cars.co.za`, "platform-owner"),
  };
  const tokens = {
    buyer: await signIn(accounts.buyer.email),
    dealer: await signIn(accounts.dealer.email),
    operations: await signIn(accounts.operations.email),
  };
  check("three temporary sessions established", Object.values(tokens).every(Boolean));

  /* A dealership to act as the dealer's active workspace, so the portal renders its real screens
     rather than the "choose a dealership" setup panel. Read-only: nothing is written to it. */
  const dealershipResponse = await fetch(
    `${SUPABASE}/rest/v1/dealerships?select=id,business_name&limit=1`,
    { headers: adminHeaders },
  );
  const [dealership] = await dealershipResponse.json();
  check("a dealership is available to act as the active workspace", Boolean(dealership?.id));

  const USER_TYPE_OF = { dealer: "dealer-owner", operations: "platform-owner", buyer: "buyer" };

  const contextFor = async (portal, viewport) => {
    const context = await browser.newContext({ viewport });
    if (portal === "public") return context;

    const session = tokens[portal];
    const userType = USER_TYPE_OF[portal];

    const cookies = [
      { name: "surf4cars-auth-token", value: session.access_token, domain: "localhost", path: "/" },
      { name: "surf4cars-auth-user-type", value: userType, domain: "localhost", path: "/" },
    ];
    if (portal === "dealer" && dealership?.id) {
      cookies.push({
        name: "surf4cars-active-dealership-id",
        value: dealership.id,
        domain: "localhost",
        path: "/",
      });
    }
    await context.addCookies(cookies);

    await context.addInitScript(
      ([storageKey, sessionJson, type, dealershipId]) => {
        window.localStorage.setItem(storageKey, sessionJson);
        window.localStorage.setItem("surf4cars:auth-user-type", type);
        if (dealershipId) window.localStorage.setItem("surf4cars:active-dealership-id", dealershipId);
      },
      [
        STORAGE_KEY,
        JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
          token_type: session.token_type ?? "bearer",
          user: session.user,
        }),
        userType,
        portal === "dealer" ? dealership?.id ?? "" : "",
      ],
    );

    return context;
  };

  /* ── Resolve dynamic segments against live data ─────────────────────────────────────────────── */

  heading("Resolving dynamic routes");

  const publicContext = await contextFor("public", { width: 1440, height: 900 });
  const scout = await publicContext.newPage();

  await scout.goto(`${APP}/search`, { waitUntil: "load" });
  await scout.waitForTimeout(1200);
  const vehicleHref = await scout.locator('a[href^="/vehicle/"]').first().getAttribute("href");
  check("a real vehicle route resolved", Boolean(vehicleHref), vehicleHref ?? "none");

  let dealerHref = null;
  if (vehicleHref) {
    await scout.goto(`${APP}${vehicleHref}`, { waitUntil: "load" });
    await scout.waitForTimeout(800);
    dealerHref = await scout.locator('a[href^="/dealers/"]').first().getAttribute("href").catch(() => null);
  }
  check("a real dealership route resolved", Boolean(dealerHref), dealerHref ?? "none");

  /* Operations `[section]` routes: ask the parent page which sections it offers, rather than
     guessing a slug and measuring a 404. */
  const opsContext = await contextFor("operations", { width: 1440, height: 900 });
  const opsScout = await opsContext.newPage();
  const sectionFor = async (parent) => {
    await opsScout.goto(`${APP}${parent}`, { waitUntil: "load" });
    await opsScout.waitForTimeout(700);
    return opsScout.locator(`a[href^="${parent}/"]`).first().getAttribute("href").catch(() => null);
  };

  const resolved = new Map();
  for (const route of discovered) {
    if (!route.includes("[")) {
      resolved.set(route, route);
      continue;
    }
    if (route === "/vehicle/[slug]" && vehicleHref) resolved.set(route, vehicleHref);
    else if (route === "/dealers/[slug]" && dealerHref) resolved.set(route, dealerHref);
    else if (/\/\[[^/]+\]$/.test(route)) {
      /*
        Any route whose last segment is dynamic: ask its parent page which children it offers, rather
        than guessing an id and measuring a 404. Written generically after `/operations/photography/
        [vehicle]` arrived and a rule keyed to `[section]` silently stopped covering it.
      */
      const concrete = await sectionFor(route.replace(/\/\[[^/]+\]$/, ""));
      if (concrete) resolved.set(route, concrete);
    }
  }

  const unresolved = discovered.filter((route) => route.includes("[") && !resolved.has(route));
  check(
    "every dynamic route resolved to a real instance",
    unresolved.length === 0,
    unresolved.join(", ") || `${discovered.filter((r) => r.includes("[")).length} dynamic routes`,
  );

  await scout.close();
  await opsScout.close();

  /* ── The audit ──────────────────────────────────────────────────────────────────────────────── */

  const auditable = discovered
    .filter((route) => route !== "/")
    .filter((route) => !LOCAL_ONLY.includes(route))
    .filter((route) => resolved.has(route));

  const inspect = async (page, url) => {
    await page.goto(`${APP}${url}`, { waitUntil: "load" });
    await page
      .locator("[data-testid=back-button]")
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => {});
    /* A client-side redirect can destroy the execution context mid-measurement. Settle first, and
       treat a lost context as "measure again" rather than as a crash — the redirect is information,
       not a harness failure. */
    await page.waitForLoadState("networkidle").catch(() => {});
    return measure(page).catch(() => measure(page));
  };

  const measure = (page) =>
    page.evaluate(() => {
      const all = [...document.querySelectorAll("[data-testid=back-button]")].filter(
        (element) => element.getClientRects().length > 0,
      );
      const first = all[0];
      if (!first) return { count: 0, landed: location.pathname };
      const box = first.getBoundingClientRect();
      return {
        count: all.length,
        landed: location.pathname,
        tag: first.tagName.toLowerCase(),
        href: first.getAttribute("href"),
        label: first.textContent.trim(),
        /* Mobile-friendly: a 44px target is the smallest a thumb reliably hits. */
        height: Math.round(box.height),
        /* Consistent placement: near the top of the document, left-aligned. */
        top: Math.round(box.top + window.scrollY),
        left: Math.round(box.left),
        focusable: first.tabIndex >= 0 || first.tagName.toLowerCase() === "a",
      };
    });

  for (const [portal, label] of [
    ["public", "Public and authentication"],
    ["buyer", "Buyer portal (signed in)"],
    ["dealer", "Dealer portal (signed in)"],
    ["operations", "Operations and Editorial Console (signed in)"],
  ]) {
    const routes = auditable.filter((route) => PORTAL_OF(route) === portal);
    if (routes.length === 0) continue;

    heading(`${label} — ${routes.length} routes`);

    const context = await contextFor(portal, { width: 1440, height: 900 });
    const page = await context.newPage();

    const missing = [];
    const duplicated = [];
    const redirected = [];
    const small = [];
    const notLinks = [];
    const placements = new Set();
    const placementDetail = [];

    for (const route of routes) {
      const url = resolved.get(route);
      const result = await inspect(page, url);

      if (result.count === 0) missing.push(`${route} (landed ${result.landed})`);
      else if (result.count > 1) duplicated.push(`${route} ×${result.count}`);
      if (portal !== "public" && result.landed.startsWith("/auth/")) redirected.push(route);
      if (result.count > 0) {
        if (result.height < 44) small.push(`${route} ${result.height}px`);
        if (result.tag !== "a" || !result.href) notLinks.push(`${route} <${result.tag}>`);
        placements.add(`${result.left}`);
        placementDetail.push(`${route}@${result.left}`);
      }
    }

    check(`a Back control on all ${routes.length} routes`, missing.length === 0, missing.slice(0, 4).join("; "));
    check("never more than one", duplicated.length === 0, duplicated.slice(0, 4).join("; "));
    if (portal !== "public") {
      check(
        "the signed-in session actually reached the portal",
        redirected.length === 0,
        redirected.length ? `${redirected.length} still redirected to sign-in` : "no redirects to sign-in",
      );
    }
    check("every control is at least 44px tall", small.length === 0, small.slice(0, 4).join("; "));
    check("every control is a real link, not a button", notLinks.length === 0, notLinks.slice(0, 4).join("; "));
    check(
      "consistent horizontal placement across the portal",
      placements.size <= 1,
      placements.size <= 1 ? `all at ${[...placements][0]}px` : placementDetail.join(" "),
    );

    await page.close();
    await context.close();
  }

  /* ── Behaviour, not just presence ───────────────────────────────────────────────────────────── */

  heading("Behaviour");

  const behaviourContext = await contextFor("dealer", { width: 1440, height: 900 });
  const page = await behaviourContext.newPage();

  /* History, when there is history: navigate in, then Back returns to where you were. */
  await page.goto(`${APP}/dealer/inventory`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.goto(`${APP}/dealer/inventory/new`, { waitUntil: "load" });
  await Promise.all([
    page.waitForURL("**/dealer/inventory", { timeout: 20000 }),
    page.locator("[data-testid=back-button]").first().click(),
  ]);
  check(
    "Back inside the dealer portal returns to the previous screen",
    new URL(page.url()).pathname === "/dealer/inventory",
    new URL(page.url()).pathname,
  );

  /* No history: a wizard opened cold from an email must still go somewhere sensible. */
  const cold = await behaviourContext.newPage();
  await cold.goto(`${APP}/dealer/inventory/new`, { waitUntil: "load" });
  await Promise.all([
    cold.waitForURL((url) => new URL(url).pathname !== "/dealer/inventory/new", { timeout: 20000 }),
    cold.locator("[data-testid=back-button]").first().click(),
  ]);
  check(
    "Back on a cold-loaded wizard falls back to the inventory",
    new URL(cold.url()).pathname === "/dealer/inventory",
    new URL(cold.url()).pathname,
  );
  await cold.close();

  /* Keyboard. */
  const kb = await behaviourContext.newPage();
  await kb.goto(`${APP}/dealer/settings`, { waitUntil: "load" });
  const control = kb.locator("[data-testid=back-button]").first();
  await control.waitFor({ state: "visible", timeout: 10000 });
  await control.focus();
  check("the control takes keyboard focus", await control.evaluate((el) => el === document.activeElement));
  await Promise.all([
    kb.waitForURL((url) => new URL(url).pathname !== "/dealer/settings", { timeout: 20000 }),
    kb.keyboard.press("Enter"),
  ]);
  check("Enter activates it", new URL(kb.url()).pathname !== "/dealer/settings", new URL(kb.url()).pathname);
  await kb.close();
  await page.close();
  await behaviourContext.close();

  /* ── Mobile ─────────────────────────────────────────────────────────────────────────────────── */

  heading("Mobile (390px)");

  for (const portal of ["public", "buyer", "dealer", "operations"]) {
    const routes = auditable.filter((route) => PORTAL_OF(route) === portal).slice(0, 6);
    if (routes.length === 0) continue;

    const context = await contextFor(portal, { width: 390, height: 844 });
    const mobile = await context.newPage();
    const problems = [];

    for (const route of routes) {
      const result = await inspect(mobile, resolved.get(route));
      if (result.count !== 1) problems.push(`${route} (${result.count})`);
      else if (result.height < 44) problems.push(`${route} ${result.height}px`);
      const overflow = await mobile.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      if (overflow) problems.push(`${route} scrolls sideways`);
    }

    check(`${portal}: usable on a phone (${routes.length} sampled)`, problems.length === 0, problems.slice(0, 3).join("; "));
    await mobile.close();
    await context.close();
  }

  await publicContext.close();
  await opsContext.close();
} finally {
  await browser.close();
  await cleanUp();
  console.log(`\n${created.length} temporary accounts removed`);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failures.length) console.log(failures.map((entry) => `  · ${entry}`).join("\n") + "\n");
process.exit(failed === 0 ? 0 : 1);
