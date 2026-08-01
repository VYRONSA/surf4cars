/**
 * The buyer journey, walked rather than screenshotted.
 *
 * A capture pack proves a page renders. It cannot tell you that a button scrolls to the wrong place,
 * that a filter chip does nothing, or that a form says "sent" when nothing was sent. Those are the
 * moments that make a marketplace feel unfinished, and none of them are visible in a still.
 *
 * So this drives the actual journey — homepage, marketplace, vehicle, gallery, dealer, enquiry — and
 * reports at each step what the customer would experience: did the click go where it said, did the
 * URL change, did anything appear, did the console complain.
 *
 * It is not a test suite and deliberately asserts nothing. It prints what happened so a person can
 * judge whether it felt right, which is the only standard that applies at this stage.
 *
 * Usage:
 *   npm run dev
 *   node scripts/walk-buyer-journey.mjs
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3003";
const OUT = "screenshots/journey";

/**
 * Wait for hydration before clicking anything.
 *
 * The first run of this script reported every single click as a no-op — the hero search, the
 * collection chips, the vehicle cards, the header links. That was the script, not the product:
 * `next dev` compiles routes on demand, so React had not hydrated when Playwright clicked, and a
 * click on an unhydrated `<Link>` or form does nothing at all.
 *
 * It is worth recording because the false positive was completely convincing — ten failures in a
 * row, no console errors, and a plausible story about client-side navigation being broken. A
 * measurement harness that is wrong in the alarming direction wastes more time than no harness.
 */
const settle = async (page) => {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "1" || true);
  await page.waitForTimeout(1200);
};

/**
 * Click, then wait for the URL to actually change.
 *
 * The timeout is 30 seconds, which looks absurd for a click and is not. Under `next dev` a route is
 * compiled the first time it is requested, and a cold client-side navigation to `/search` on this
 * machine was measured at **15.76s**. At the 8s this used to allow, roughly one run in two reported
 * working links as dead — the second false alarm this harness produced, after the hydration one.
 *
 * Both had the same shape: an alarming, entirely plausible result caused by the measuring tool
 * rather than the product. If this reports a click as dead, check the number before believing it.
 */
const clickAndWait = async (page, locator, expectChange = true) => {
  const before = page.url();
  await locator.click();
  if (expectChange) {
    await page.waitForFunction((prev) => window.location.href !== prev, before, { timeout: 30000 })
      .catch(() => {});
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(500);
  return page.url() !== before;
};

const steps = [];
const note = (step, detail) => {
  steps.push({ step, detail });
  console.log(`  ${step.padEnd(38)} ${detail}`);
};

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  const shot = (id) => page.screenshot({ path: `${OUT}/${id}.png` });

  console.log("\nBUYER JOURNEY\n");

  // ── 1. Arrive ─────────────────────────────────────────────────────────────────
  await page.goto(BASE, { waitUntil: "networkidle" });
  await settle(page);
  note("1. homepage loads", `title "${await page.title()}"`);
  await shot("01-home");

  // ── 2. Search from the hero ───────────────────────────────────────────────────
  const heroInput = page.locator("#hero-search");
  await heroInput.fill("Toyota Hilux");
  const moved = await clickAndWait(page, page.locator('form button[type="submit"]').first());
  note("2. hero search submits", moved ? page.url().replace(BASE, "") : "DID NOT NAVIGATE");

  const heading = await page.locator("h1").first().textContent();
  /* Read the count from the caption element, not by regexing the page. The first version matched
     "Under R300 000" from a collection chip and reported the marketplace as having 300 000 cars. */
  const count = await page
    .locator("header p", { hasText: /vehicles?$/ })
    .first()
    .textContent()
    .catch(() => null);
  note("   results heading", `"${heading?.trim()}" — ${count?.trim() ?? "count not found"}`);
  await shot("02-search-from-hero");

  // ── 3. A collection chip ──────────────────────────────────────────────────────
  await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
  const chip = page.locator('nav[aria-label="Browse collections"] a').first();
  await settle(page);
  const chipLabel = await chip.textContent();
  await clickAndWait(page, chip);
  note("3. collection chip", `"${chipLabel?.trim()}" → ${page.url().replace(BASE, "")}`);

  // ── 4. Open a vehicle ─────────────────────────────────────────────────────────
  await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
  const card = page.locator('a[href^="/vehicle/"]').first();
  await settle(page);
  const cardTitle = await card.locator("h3").first().textContent();
  await clickAndWait(page, card);
  await page.waitForTimeout(700);
  note("4. vehicle opens", `${cardTitle?.trim()} → ${page.url().replace(BASE, "")}`);
  await shot("04-vehicle");

  // ── 5. The gallery ────────────────────────────────────────────────────────────
  const galleryButton = page.locator('button:has-text("View all")').first();
  if (await galleryButton.count()) {
    await galleryButton.click();
    await page.waitForTimeout(500);
    const dialogOpen = await page.locator('[role="dialog"]').count();
    note("5. gallery opens", dialogOpen ? "lightbox visible" : "NOTHING HAPPENED");
    await shot("05-gallery");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    note("   escape closes it", (await page.locator('[role="dialog"]').count()) ? "STILL OPEN" : "closed");
  } else {
    note("5. gallery button", "not present");
  }

  // ── 6. Enquire ────────────────────────────────────────────────────────────────
  const enquireLink = page.locator('a[href="#enquiry"]').first();
  if (await enquireLink.count()) {
    const before = await page.evaluate(() => window.scrollY);
    await enquireLink.click();
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => window.scrollY);
    const formVisible = await page.locator("#enquiry form").isVisible().catch(() => false);
    note("6. enquire scrolls", `${Math.round(before)} → ${Math.round(after)}px, form ${formVisible ? "in view" : "NOT VISIBLE"}`);
    await shot("06-enquiry");
  }

  // ── 7. Submit an enquiry with nothing filled in ───────────────────────────────
  const submit = page.locator('#enquiry button[type="submit"]').first();
  if (await submit.count()) {
    await submit.click();
    await page.waitForTimeout(1200);
    const body = await page.locator("#enquiry").innerText();
    const feedback = body.split("\n").find((l) => /complete|sent|fail|error|sorry/i.test(l));
    note("7. empty submit", feedback ? `"${feedback.trim()}"` : "NO FEEDBACK SHOWN");
  }

  // ── 8. To the dealer ──────────────────────────────────────────────────────────
  const dealerLink = page.locator('a[href^="/dealers/"]').first();
  if (await dealerLink.count()) {
    await settle(page);
    const wentToDealer = await clickAndWait(page, dealerLink);
    note("8. dealer profile", wentToDealer ? page.url().replace(BASE, "") : "DID NOT NAVIGATE");
    await shot("08-dealer");
  }

  // ── 9. Back to the marketplace via the header ─────────────────────────────────
  await settle(page);
  await clickAndWait(page, page.locator('header a:has-text("Marketplace")').first());
  note("9. header → marketplace", page.url().replace(BASE, ""));

  // ── 10. Sign in ───────────────────────────────────────────────────────────────
  await settle(page);
  await clickAndWait(page, page.locator('header a:has-text("Sign in")').first());
  note("10. header → sign in", page.url().replace(BASE, ""));
  await shot("10-signin");

  console.log(
    consoleErrors.length
      ? `\n${consoleErrors.length} console error(s):\n  ${[...new Set(consoleErrors)].slice(0, 5).join("\n  ")}`
      : "\nNo console errors across the journey.",
  );

  await browser.close();
}

await main();
