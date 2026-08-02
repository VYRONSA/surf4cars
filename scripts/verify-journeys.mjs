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

const guardedRedirects = ["/dealer/dashboard", "/operations", "/buyer"];
const publicPaths = [
  "/search",
  "/pricing",
  "/contact",
  "/legal/terms",
  "/legal/privacy",
  "/legal/cookies",
  "/auth/sign-in",
  "/auth/forgot-password",
  ...guardedRedirects,
];

for (const path of publicPaths) {
  await page.goto(`${APP}${path}`, { waitUntil: "domcontentloaded" });
  const count = await page.locator("[data-testid=back-button]").count();
  /* Guarded paths redirect to sign-in, which must itself carry the control — so the assertion is the
     same either way: wherever you end up, there is a way back. */
  check(`back button on ${path}`, count >= 1, count === 0 ? `landed on ${pathOf()}` : `at ${pathOf()}`);
}

/* ── The customer journey, and Back at each step ──────────────────────────────────────────────── */

console.log("\nCustomer journey, pressing Back at each step");

await page.goto(`${APP}/`, { waitUntil: "domcontentloaded" });
const firstVehicle = page.locator('a[href^="/vehicle/"]').first();
check("homepage offers vehicles to click", (await firstVehicle.count()) > 0);

await page.goto(`${APP}/search`, { waitUntil: "domcontentloaded" });
const searchVehicle = page.locator('a[href^="/vehicle/"]').first();
const vehicleHref = await searchVehicle.getAttribute("href");
/* waitForURL, not waitForLoadState: a client-side navigation may already have settled the load
   state by the time the click returns, so the assertion raced and read the old path. */
await Promise.all([page.waitForURL("**/vehicle/**", { timeout: 20000 }), searchVehicle.click()]);
check("search → vehicle", pathOf().startsWith("/vehicle/"), pathOf());
check("vehicle page is not a not-found page", !(await page.content()).includes("Vehicle Not Found"), vehicleHref ?? "");

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
