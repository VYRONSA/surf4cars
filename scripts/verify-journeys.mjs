/**
 * Every journey, walked in a real browser.
 *
 * WHAT THIS CHECKS THAT A FETCH CANNOT
 * ====================================
 * The Back control is a client component whose behaviour depends on `document.referrer` and
 * `window.history` — it renders one way on a cold load and behaves another way after a click. A
 * request-level check would confirm the markup exists and prove nothing about whether pressing it
 * gets you anywhere.
 *
 * So this drives a browser: it clicks through the customer journey, presses Back at each step, and
 * asserts where it lands. It also collects every internal link on the public pages and checks none
 * of them is dead.
 *
 *   npm run build && npx next start -p 3100
 *   node scripts/verify-journeys.mjs
 */
import { chromium } from "playwright";

const APP = process.env.APP_URL ?? "http://localhost:3100";

let passed = 0;
let failed = 0;
const check = (label, ok, detail = "") => {
  if (ok) { passed += 1; console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`); }
  else { failed += 1; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`); }
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const pathOf = () => new URL(page.url()).pathname;

console.log("\nJourney audit (PCP-039)\n───────────────────────");

/* ── Back control presence ────────────────────────────────────────────────────────────────────── */

console.log("\nBack control — present everywhere except the homepage");

await page.goto(`${APP}/`, { waitUntil: "domcontentloaded" });
check("homepage has NO back button", (await page.locator("[data-testid=back-button]").count()) === 0);

/*
  Every route the app declares, not a sample of them.
  ==================================================
  This list used to be twelve paths I had chosen, and it passed while two screens had no Back control
  at all — `/design-system`, which belongs to no route group, and the 404 for an unmatched URL, which
  is rendered by a file sitting above every route group. Both were invisible to a sample precisely
  because they are the routes that no shell wraps.

  So the list is now every page file under `src/app` plus the two boundary cases, and the rule is the
  founder's rule verbatim: every screen except the homepage.

  Visible count, not DOM count. Next renders more than one tree during a not-found and only one of
  them is on screen; counting nodes reported two controls where a visitor sees one.
*/
const ROUTES = [
  "/search",
  "/pricing",
  "/contact",
  "/legal/terms",
  "/legal/privacy",
  "/legal/cookies",
  "/unauthorized",
  "/design-system",
  /* The two boundaries. An unmatched URL, and a `notFound()` raised inside a route group. */
  "/this-route-does-not-exist",
  "/vehicle/definitely-not-a-real-slug",
  "/dealers/definitely-not-a-real-dealer",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/sign-up/dealer",
  "/auth/sign-up/buyer",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/accept-invitation",
  /* Guarded portals. These redirect while signed out, so the assertion is the honest one: wherever
     you land, there is a way back. The interiors are covered by construction — the control is in the
     shell every one of these groups composes — but that is a structural argument, not a measurement,
     and it is recorded as such in the report. */
  "/dealer",
  "/dealer/dashboard",
  "/dealer/inventory",
  "/dealer/inventory/new",
  "/dealer/inventory/import",
  "/dealer/profile",
  "/dealer/branches",
  "/dealer/team",
  "/dealer/settings",
  "/dealer/market",
  "/dealer/claim",
  "/buyer",
  "/buyer/intelligence",
  "/operations",
  "/operations/dashboard",
  "/operations/quality-centre",
  "/operations/verification",
  "/operations/editorial",
  "/operations/audit-logs",
  "/operations/settings",
  "/operations/workers",
  "/operations/onboarding-centre",
  "/operations/applications-centre",
  "/operations/advertising-centre",
  "/operations/revenue-centre",
  "/operations/partner-centre",
  "/operations/dealer-management",
  "/operations/dealer-intelligence",
  "/operations/marketplace-control",
  "/operations/business-intelligence",
];

/*
  `/admin/creative/*` is deliberately absent from a deployed build — `proxy.ts` answers 404 with no
  body, because those screens write to the working tree. So the correct assertion here is not "has a
  Back control" but "is not there at all"; the control is present on them locally, where they exist.
*/
const LOCAL_ONLY_ROUTES = ["/admin/creative/media-review", "/admin/creative/moodboard"];

const countVisible = (target, selector) =>
  target.evaluate(
    (sel) => [...document.querySelectorAll(sel)].filter((el) => el.getClientRects().length > 0).length,
    selector,
  );

/*
  `getClientRects` needs layout, and `domcontentloaded` does not guarantee it. Counting straight after
  the navigation reported zero controls on six routes that plainly have one — a test failing for its
  own impatience, which is worse than no test because the next person debugs the page. So wait for the
  control to become visible, and only call it absent once that wait has actually expired.
*/
const visibleBackCount = async (target) => {
  try {
    await target.locator("[data-testid=back-button]").first().waitFor({ state: "visible", timeout: 10000 });
  } catch {
    /* Fall through and report what is really there. */
  }
  return countVisible(target, "[data-testid=back-button]");
};

const withoutBack = [];
for (const path of ROUTES) {
  await page.goto(`${APP}${path}`, { waitUntil: "load" });
  const count = await visibleBackCount(page);
  if (count !== 1) withoutBack.push(`${path} (${count}, landed ${pathOf()})`);
}
check(
  `exactly one visible back control on all ${ROUTES.length} routes`,
  withoutBack.length === 0,
  withoutBack.slice(0, 6).join("; "),
);

for (const path of LOCAL_ONLY_ROUTES) {
  const response = await page.request.get(`${APP}${path}`, { maxRedirects: 0 });
  check(`${path} is absent from a production build`, response.status() === 404, `HTTP ${response.status()}`);
}

/*
  The 404 for an unmatched URL is a customer-facing screen, so it carries the public shell. It
  shipped with neither — no header, no footer, no search — because the file that renders it sits
  above every route group and nothing wrapped it.
*/
await page.goto(`${APP}/this-route-does-not-exist`, { waitUntil: "load" });
await page.locator("footer").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
check("unmatched-URL 404 carries the site header", (await countVisible(page, "header")) >= 1);
check("unmatched-URL 404 carries the site footer", (await countVisible(page, "footer")) >= 1);

/* …and the in-group 404 must not therefore render the shell twice. */
await page.goto(`${APP}/vehicle/definitely-not-a-real-slug`, { waitUntil: "load" });
await page.locator("footer").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
const footers = await countVisible(page, "footer");
check("in-group 404 does not duplicate the shell", footers === 1, `${footers} footers`);

/* ── The customer journey, and Back at each step ──────────────────────────────────────────────── */

console.log("\nCustomer journey, pressing Back at each step");

/*
  The homepage routes to the marketplace; it does not always show cars.

  This used to assert a vehicle card on the homepage, which was true until PCP-043 gated every rail
  on Founder approval. With nothing approved the shop window is deliberately dark, and the honest
  invariant is the one below: from the front page a visitor can always reach the inventory. Whether
  cars are *on* the front page is a curation decision, and it is proved in both directions by
  `verify-founder-curation.mjs`.
*/
await page.goto(`${APP}/`, { waitUntil: "domcontentloaded" });
const waysIntoStock = await page.locator('a[href^="/search"]').count();
check("the homepage routes a visitor into the inventory", waysIntoStock > 0, `${waysIntoStock} links to search`);

await page.goto(`${APP}/search`, { waitUntil: "domcontentloaded" });
const searchVehicle = page.locator('a[href^="/vehicle/"]').first();
const vehicleHref = await searchVehicle.getAttribute("href");
/* waitForURL, not waitForLoadState: a client-side navigation may already have settled the load
   state by the time the click returns, so the assertion raced and read the old path. */
await Promise.all([page.waitForURL("**/vehicle/**", { timeout: 20000 }), searchVehicle.click()]);
check("search → vehicle", pathOf().startsWith("/vehicle/"), pathOf());
check("vehicle page is not a not-found page", !(await page.content()).includes("Vehicle Not Found"), vehicleHref ?? "");

/*
  The dealer link, followed rather than counted.
  =============================================
  The dead-link sweep further down checks HTTP status, and that is not enough here: a dealership
  whose record cannot be read renders a *not-found body* with a 200, which is the exact trap this
  project has already been caught by once when six drafts were reported as "served publicly".

  It happened again in PCP-045. Two columns were added to `dealerships`, `anon` had no grant on them
  because PCP-038 made the allow-list deny-by-default, PostgREST refused the whole query, and the
  loader's fail-closed path rendered "dealership not found" — on every dealer profile, reached from
  every vehicle page. Build clean, types clean, eleven suites green.
*/
const dealerLink = await page.locator('a[href^="/dealers/"]').first().getAttribute("href").catch(() => null);
check("the vehicle page links to its dealership", Boolean(dealerLink), dealerLink ?? "none");

if (dealerLink) {
  const dealerPage = await context.newPage();
  await dealerPage.goto(`${APP}${dealerLink}`, { waitUntil: "load" });
  await dealerPage.waitForTimeout(800);
  const dealerBody = await dealerPage.locator("body").innerText();
  check(
    "…and that dealership profile actually resolves",
    !/not found/i.test(dealerBody),
    dealerLink,
  );
  await dealerPage.close();
}

await page.goto(`${APP}${vehicleHref}`, { waitUntil: "load" });
await Promise.all([
  page.waitForURL("**/search", { timeout: 20000 }),
  page.locator("[data-testid=back-button]").first().click(),
]);
check("Back from vehicle returns to search", pathOf() === "/search", pathOf());

/* Cold load — no history. This is the case a plain router.back() gets wrong. */
const cold = await context.newPage();
await cold.goto(`${APP}${vehicleHref}`, { waitUntil: "domcontentloaded" });
await Promise.all([
  cold.waitForURL("**/search", { timeout: 20000 }),
  cold.locator("[data-testid=back-button]").first().click(),
]);
check(
  "Back on a cold-loaded vehicle page still goes somewhere useful",
  new URL(cold.url()).pathname === "/search",
  new URL(cold.url()).pathname,
);
await cold.close();

/* Keyboard reachability — it is an anchor, so it must be tabbable and activate on Enter. */
const kb = await context.newPage();
await kb.goto(`${APP}/pricing`, { waitUntil: "domcontentloaded" });
const backEl = kb.locator("[data-testid=back-button]").first();
await backEl.focus();
check("back button is keyboard focusable", await backEl.evaluate((el) => el === document.activeElement));
await Promise.all([
  kb.waitForURL((url) => new URL(url).pathname !== "/pricing", { timeout: 20000 }),
  kb.keyboard.press("Enter"),
]);
check("Enter activates the back button", new URL(kb.url()).pathname !== "/pricing", new URL(kb.url()).pathname);
await kb.close();

/* ── /pricing content and CTAs ────────────────────────────────────────────────────────────────── */

console.log("\nFounding Dealer page");

await page.goto(`${APP}/pricing`, { waitUntil: "domcontentloaded" });
const body = await page.content();

check("hero headline present", body.includes("Become a Founding Dealer on SURF4CARS"));
check("free-until date stated", body.includes("31 July 2027"));
check("states that standard pricing follows", /standard subscription pricing will apply/i.test(body));
check("dashboard is labelled illustrative", /Illustrative example — not live platform data/i.test(body));
check("advertising is labelled as after launch", /Available after public launch/i.test(body));
check("future pricing shows no invented price", !/R\s?\d[\d\s]{2,}\s*(?:per month|\/\s*month|pm)/i.test(body));

/* The founder rules, asserted as absences. */
/*
  The rule is "never offer a lifetime discount", and this page satisfies it in the strongest way
  available: by saying explicitly that there is not one. An earlier version of this check
  pattern-matched the phrase and failed the page for its own disclaimer — a test that punished the
  correct behaviour, which is worse than no test.

  So the assertions are the plain ones: the disclaimer must be present, and the phrase must never
  appear as an offer.
*/
check(
  "page explicitly disclaims a lifetime discount",
  /(no|never)\s+lifetime\s+(discount|pricing|rate)/i.test(body),
);
check(
  "no lifetime discount is offered",
  !/(enjoy|receive|get|keep|lock in|guaranteed)[^.]{0,40}lifetime\s+(discount|pricing|rate)/i.test(body),
);

for (const [label, pattern] of [
  ["no countdown or fake urgency", /(places?\s+(remaining|left)|hurry|ends\s+in|only\s+\d+\s+spots)/i],
  ["no market-leadership claim", /(south africa'?s\s+(leading|number one|no\.?\s*1|largest|biggest))/i],
  ["no fabricated platform statistics", /\d[\d\s,]*\s+(dealerships already|dealers已|happy dealers|vehicles sold)/i],
]) {
  check(label, !pattern.test(body));
}

const ctas = await page.locator('a[href^="/contact?enquiry="]').count();
check("apply and demo CTAs present", ctas >= 2, `${ctas} CTAs`);

for (const href of ["/contact?enquiry=founding-partner", "/contact?enquiry=demo"]) {
  const response = await page.request.get(`${APP}${href}`);
  check(`CTA target ${href} resolves`, response.ok(), `HTTP ${response.status()}`);
}

/* ── No dead internal links on the public surface ─────────────────────────────────────────────── */

console.log("\nInternal links on public pages");

const seen = new Set();
const broken = [];
for (const path of ["/", "/search", "/pricing", "/contact"]) {
  await page.goto(`${APP}${path}`, { waitUntil: "domcontentloaded" });
  const hrefs = await page.locator("a[href^='/']").evaluateAll((els) =>
    els.map((el) => el.getAttribute("href")).filter(Boolean),
  );
  for (const href of hrefs) {
    const clean = href.split("#")[0];
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    const response = await page.request.get(`${APP}${clean}`, { maxRedirects: 0 });
    const status = response.status();
    /* 3xx is a guarded route redirecting to sign-in, which is correct, not broken. */
    if (status >= 400) broken.push(`${clean} → ${status}`);
  }
}
check(`no dead internal links (${seen.size} checked)`, broken.length === 0, broken.slice(0, 5).join(", "));

/* ── Responsive ───────────────────────────────────────────────────────────────────────────────── */

console.log("\nResponsive — no horizontal overflow");

for (const [label, width] of [["mobile", 390], ["tablet", 834], ["desktop", 1440]]) {
  const vp = await context.newPage();
  await vp.setViewportSize({ width, height: 900 });
  for (const path of ["/", "/pricing", "/search"]) {
    await vp.goto(`${APP}${path}`, { waitUntil: "domcontentloaded" });
    const overflow = await vp.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    check(`${label} ${width}px — ${path} does not scroll sideways`, !overflow);
  }
  await vp.close();
}

await browser.close();

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
