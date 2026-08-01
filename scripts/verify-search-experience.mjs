/**
 * Vehicle search verification.
 *
 * WHY THIS DRIVES A BROWSER RATHER THAN CALLING A FUNCTION
 * ========================================================
 * The brief's requirement is that nothing on the hero is decorative — that every control produces a
 * real result. A unit test of `parseSearchState` cannot tell you whether the Make dropdown is wired
 * to it, whether the button submits, or whether the results that come back are actually Toyotas.
 * Those are the failures a redesign introduces, and they are only visible from outside.
 *
 * So every case here starts from the rendered homepage or search page, uses the controls the way a
 * person would, and then reads the results and checks them against what was asked for.
 *
 * WHAT "WORKS" MEANS HERE
 * =======================
 * Not "returned 200". Every filtered case asserts that the *results match the filter* — selecting
 * BMW must return BMWs, and a maximum price must return nothing above it. A search page that
 * silently ignores a parameter returns a beautiful grid of the wrong cars, and that is
 * indistinguishable from working unless somebody checks the contents.
 *
 * Usage:  npm run dev  &&  node scripts/verify-search-experience.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3003";

let pass = 0;
let fail = 0;
const failures = [];

const heading = (t) => console.log(`\n${t}\n${"─".repeat(t.length)}`);
function check(label, ok, detail = "") {
  if (ok) pass += 1;
  else {
    fail += 1;
    failures.push(label);
  }
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1536, height: 1000 } });
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text().slice(0, 120));
});
page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 120)));

/* Turbopack compiles a route on first request; a cold compile can exceed Playwright's default and
   read as a dead page. AGENTS.md records this false alarm costing a session once. */
page.setDefaultNavigationTimeout(90_000);
page.setDefaultTimeout(30_000);

/*
  `domcontentloaded` plus a wait for the thing being asserted on, not `networkidle`.
  ================================================================================
  `networkidle` waits for a 500ms gap in *all* network activity, which on a dev server with image
  optimisation and HMR polling can simply never arrive — one run hung for the full 90s on a page
  that had rendered correctly seconds earlier. Waiting for the specific element is both faster and
  a truer statement of what the test needs.
*/
async function goHome() {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.locator("#hero-make").waitFor({ timeout: 30_000 });
  await page.waitForTimeout(400);
}

/*
  Wait for the results, not for a duration.
  ========================================
  This first read used a flat 1.4s sleep and reported "0 cards" for every filtered search on a
  marketplace that was returning 31 Toyotas correctly — /search was simply still compiling. That is
  the fourth time in this repository a harness has failed in the alarming direction, and this one
  would have sent somebody to debug a search engine that had no fault.

  It now waits for a card to exist and treats a genuine empty result as a separate, explicit state.
*/
async function resultCards(target = page) {
  await target
    .locator('a[href^="/vehicle/"]')
    .first()
    .waitFor({ state: "attached", timeout: 25_000 })
    .catch(() => {
      /* A real empty result. The empty-state case asserts on this deliberately. */
    });
  return target.locator('a[href^="/vehicle/"]');
}

/** Titles of the rendered result cards, used to check results actually match the filter. */
async function resultTitles() {
  const cards = await resultCards();
  const n = await cards.count();
  const titles = [];
  for (let i = 0; i < Math.min(n, 24); i += 1) {
    titles.push(((await cards.nth(i).innerText()) ?? "").replace(/\s+/g, " ").trim());
  }
  return titles;
}

/*
  Card text runs "R 445 000 2026 / 21 690 km", so a greedy digits-and-spaces match after the R
  swallowed the year and produced R4 450 002 026 — a price-ceiling assertion that failed against a
  search that was filtering correctly. The group is now anchored to the R-thousand grouping only.
*/
function pricesFrom(titles) {
  return titles
    .map((t) => t.match(/R\s?(\d{1,3}(?:\s\d{3})+)(?!\d)/)?.[1])
    .filter(Boolean)
    .map((raw) => Number(raw.replace(/\s/g, "")))
    .filter((n) => Number.isFinite(n) && n > 1000);
}

try {
  /* ── Hero controls ──────────────────────────────────────────────────────────────────────── */
  heading("Hero — the control row");
  await goHome();

  const makeOptions = await page.locator("#hero-make option").allInnerTexts();
  const firstMake = makeOptions[1];
  check("Make dropdown is populated from live stock", makeOptions.length > 2, `${makeOptions.length - 1} makes`);
  check("Model is disabled until a make is chosen", await page.locator("#hero-model").isDisabled());

  await page.selectOption("#hero-make", firstMake);
  await page.waitForTimeout(400);
  const modelOptions = await page.locator("#hero-model option").allInnerTexts();
  check("Model enables and narrows to the chosen make", !(await page.locator("#hero-model").isDisabled()) && modelOptions.length > 1, `${modelOptions.length - 1} models for ${firstMake}`);

  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(/\/search/, { timeout: 60_000 });
  check("Make search reaches /search with the parameter", page.url().includes(`make=${encodeURIComponent(firstMake)}`), page.url().replace(BASE, ""));

  let titles = await resultTitles();
  check("Make search returns results", titles.length > 0, `${titles.length} cards`);
  check(
    "every result is the requested make",
    titles.length > 0 && titles.every((t) => t.toLowerCase().includes(firstMake.toLowerCase())),
    titles.find((t) => !t.toLowerCase().includes(firstMake.toLowerCase()))?.slice(0, 60) ?? "all match",
  );

  /* ── Make + model ───────────────────────────────────────────────────────────────────────── */
  heading("Hero — make and model together");
  await goHome();
  await page.selectOption("#hero-make", firstMake);
  await page.waitForTimeout(400);
  const model = (await page.locator("#hero-model option").allInnerTexts())[1];
  await page.selectOption("#hero-model", model);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(/\/search/, { timeout: 60_000 });
  titles = await resultTitles();
  check("model narrows the query", page.url().includes("model="), page.url().replace(BASE, ""));
  check("results returned for make + model", titles.length > 0, `${titles.length} cards`);
  check(
    "every result matches make and model",
    titles.length > 0 &&
      titles.every(
        (t) => t.toLowerCase().includes(firstMake.toLowerCase()) && t.toLowerCase().includes(model.toLowerCase()),
      ),
    `${firstMake} ${model}`,
  );

  /* ── Price ──────────────────────────────────────────────────────────────────────────────── */
  heading("Hero — price ceiling");
  await goHome();
  await page.selectOption("#hero-price-max", "30000000"); // R300 000
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(/\/search/, { timeout: 60_000 });
  titles = await resultTitles();
  const prices = pricesFrom(titles);
  check("price ceiling reaches the query", page.url().includes("priceMax=30000000"), page.url().replace(BASE, ""));
  check("results returned under the ceiling", titles.length > 0, `${titles.length} cards`);
  check(
    "no result exceeds the ceiling",
    prices.length > 0 && prices.every((p) => p <= 300_000),
    prices.length ? `max R${Math.max(...prices).toLocaleString("en-ZA")}` : "no prices parsed",
  );

  /* ── Body type and location ─────────────────────────────────────────────────────────────── */
  heading("Hero — body type and location");
  await goHome();
  const bodyOptions = await page.locator("#hero-body option").allInnerTexts();
  const body = bodyOptions[1];
  await page.selectOption("#hero-body", body);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(/\/search/, { timeout: 60_000 });
  check("body type reaches the query", page.url().includes("bodyType="), page.url().replace(BASE, ""));
  check("body type returns results", (await resultTitles()).length > 0, body);

  await goHome();
  const provinceOptions = await page.locator("#hero-province option").allInnerTexts();
  const province = provinceOptions[1];
  await page.selectOption("#hero-province", province);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(/\/search/, { timeout: 60_000 });
  check("location reaches the query", page.url().includes("province="), page.url().replace(BASE, ""));
  check("location returns results", (await resultTitles()).length > 0, province);

  /* ── Free text and suggestions ──────────────────────────────────────────────────────────── */
  heading("Hero — describe it");
  await goHome();
  await page.getByRole("tab", { name: "Describe it" }).click();
  await page.waitForTimeout(300);
  const suggestion = page.locator("button", { hasText: "Family SUV under R500 000" }).first();
  await suggestion.click();
  check("suggestion chip fills the input", (await page.locator("#hero-describe").inputValue()).length > 0, await page.locator("#hero-describe").inputValue());
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(/\/search/, { timeout: 60_000 });
  check("free text reaches the query", page.url().includes("query="), page.url().replace(BASE, "").slice(0, 70));
  check("free text returns results", (await resultTitles()).length > 0);

  await goHome();
  await page.getByRole("tab", { name: "Describe it" }).click();
  await page.fill("#hero-describe", firstMake);
  await page.press("#hero-describe", "Enter");
  await page.waitForURL(/\/search/, { timeout: 60_000 });
  titles = await resultTitles();
  check("typing a make as free text finds it", titles.length > 0 && titles.some((t) => t.toLowerCase().includes(firstMake.toLowerCase())), `${titles.length} cards`);

  /* ── Quick-tap modes ────────────────────────────────────────────────────────────────────── */
  heading("Hero — one-tap modes");
  for (const [tab, param] of [
    ["Body type", "bodyType="],
    ["Make", "make="],
    ["Price", "priceMax="],
  ]) {
    await goHome();
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.waitForTimeout(300);
    const chip = page.locator("[data-quick-chips] button").first();
    const chipLabel = (await chip.innerText()).trim();
    await chip.click();
    await page.waitForURL(/\/search/, { timeout: 60_000 });
    const ok = page.url().includes(param) && (await resultTitles()).length > 0;
    check(`${tab} chip searches and returns results`, ok, `${chipLabel} → ${page.url().replace(BASE, "").slice(0, 50)}`);
  }

  /* ── Recent searches ────────────────────────────────────────────────────────────────────── */
  heading("Hero — recent searches");
  await goHome();
  const recentChips = page.locator("text=Recent searches:");
  check("recent searches row appears once searches exist", await recentChips.isVisible(), "populated by the cases above");
  await page.getByRole("button", { name: "Clear all" }).click();
  await page.waitForTimeout(400);
  check("Clear all empties the row", !(await recentChips.isVisible()));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  check("cleared state survives a reload", !(await page.locator("text=Recent searches:").isVisible()));

  /* ── Search page: filters, sorting, pagination ──────────────────────────────────────────── */
  heading("Search page — sorting");
  await page.goto(`${BASE}/search?sort=price-asc`, { waitUntil: "domcontentloaded" });
  const asc = pricesFrom(await resultTitles());
  await page.goto(`${BASE}/search?sort=price-desc`, { waitUntil: "domcontentloaded" });
  const desc = pricesFrom(await resultTitles());
  check("price ascending is actually ascending", asc.length > 1 && asc[0] <= asc[asc.length - 1], asc.length ? `R${asc[0]} → R${asc[asc.length - 1]}` : "no prices");
  check("price descending is actually descending", desc.length > 1 && desc[0] >= desc[desc.length - 1], desc.length ? `R${desc[0]} → R${desc[desc.length - 1]}` : "no prices");
  check("the two orders genuinely differ", asc.length > 1 && desc.length > 1 && asc[0] !== desc[0]);

  heading("Search page — pagination");
  await page.goto(`${BASE}/search`, { waitUntil: "domcontentloaded" });
  const pageOne = await resultTitles();
  await page.goto(`${BASE}/search?page=2`, { waitUntil: "domcontentloaded" });
  const pageTwo = await resultTitles();
  check("page one returns results", pageOne.length > 0, `${pageOne.length} cards`);
  check("page two returns results", pageTwo.length > 0, `${pageTwo.length} cards`);
  check("page two is a different set", pageOne.length > 0 && pageTwo.length > 0 && pageOne[0] !== pageTwo[0]);

  /* ── Empty and invalid ──────────────────────────────────────────────────────────────────── */
  heading("Search page — empty and invalid input");
  await page.goto(`${BASE}/search?make=Lamborghini&model=Countach&priceMax=100000`, { waitUntil: "domcontentloaded" });
  const emptyCards = await (await resultCards()).count();
  const emptyText = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  check("an impossible filter returns no cards", emptyCards === 0, `${emptyCards} cards`);
  check("and says so rather than showing a blank page", /no |nothing|0 |not find|adjust|clear/i.test(emptyText), emptyText.slice(0, 90));

  const hostile = [
    `${BASE}/search?query=%3Cscript%3Ealert(1)%3C%2Fscript%3E`,
    `${BASE}/search?priceMin=abc&priceMax=xyz`,
    `${BASE}/search?page=-5&pageSize=99999`,
    `${BASE}/search?make=${"A".repeat(600)}`,
    `${BASE}/search?sort=;DROP%20TABLE%20leads`,
  ];
  let alerted = false;
  page.on("dialog", async (d) => {
    alerted = true;
    await d.dismiss();
  });
  let allOk = true;
  for (const url of hostile) {
    const response = await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => null);
    if (!response || response.status() >= 500) allOk = false;
    await page.waitForTimeout(400);
  }
  check("malformed and hostile parameters never 500", allOk);
  check("no script injected from a query string executed", !alerted);

  /* ── Keyboard ───────────────────────────────────────────────────────────────────────────── */
  heading("Keyboard");
  await goHome();
  await page.locator("#hero-make").focus();
  await page.keyboard.press("Tab");
  const afterTab = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  check("tab moves through the control row", Boolean(afterTab), String(afterTab));
  await page.locator("#hero-body").focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/search/, { timeout: 60_000 }).catch(() => {});
  check("the search button can be reached and fired from the keyboard", page.url().includes("/search"), page.url().replace(BASE, ""));

  await goHome();
  /* Compared against the unfocused state rather than tested for "not none": a transparent 0px shadow
     is technically not "none" and the first version of this check passed on exactly that. */
  const focusRing = await page.evaluate(() => {
    const el = document.querySelector("#hero-make");
    const wrapper = el.closest("div");
    const before = getComputedStyle(wrapper).boxShadow;
    el.focus();
    const after = getComputedStyle(wrapper).boxShadow;
    return { before, after, changed: before !== after };
  });
  check("focus visibly changes a control", focusRing.changed, `${focusRing.before.slice(0, 24)} → ${focusRing.after.slice(0, 34)}`);

  /* ── Mobile ─────────────────────────────────────────────────────────────────────────────── */
  heading("Mobile");
  const mobile = await context.newPage();
  mobile.setDefaultNavigationTimeout(90_000);
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(BASE, { waitUntil: "domcontentloaded" });
  await mobile.waitForTimeout(1200);
  check("no horizontal overflow", !(await mobile.evaluate(() => document.body.scrollWidth > window.innerWidth)));
  const heroBox = await mobile.locator("#hero-make").boundingBox();
  check("the search control is reachable on a phone", Boolean(heroBox), heroBox ? `y=${Math.round(heroBox.y)}` : "not rendered");
  await mobile.selectOption("#hero-make", firstMake);
  await mobile.locator('form button[type="submit"]').first().click();
  await mobile.waitForURL(/\/search/, { timeout: 60_000 });
  check("mobile search returns results", (await (await resultCards(mobile)).count()) > 0);
  await mobile.close();

  /* ── URL state, history and refresh ─────────────────────────────────────────────────────── */
  heading("URL state, history and refresh");
  {
    /*
      A search that cannot be linked, refreshed or reversed is not a search, it is a session.
      =====================================================================================
      These four behaviours are what make a result page shareable and what make the back button mean
      what a visitor expects. They are also the ones a redesign silently breaks, because the page
      still looks right — it just forgets.
    */
    const deep = `${BASE}/search?make=${encodeURIComponent(firstMake)}&bodyType=SUV&sort=price-asc`;
    await page.goto(deep, { waitUntil: "domcontentloaded" });
    let titles = await resultTitles();
    check("a deep-linked URL returns the right vehicles", titles.length > 0 && titles.every((t) => t.toLowerCase().includes(firstMake.toLowerCase())), `${titles.length} cards, all ${firstMake}`);

    const beforeReload = titles.join("|");
    await page.reload({ waitUntil: "domcontentloaded" });
    const afterReload = (await resultTitles()).join("|");
    check("refresh preserves the search", beforeReload === afterReload && afterReload.length > 0, "same results after reload");
    check("refresh preserves the URL", page.url().includes("make=") && page.url().includes("sort=price-asc"), page.url().replace(BASE, ""));

    /* Navigate away, then back — the results must return, not the homepage's empty state. */
    await page.goto(`${BASE}/search?make=${encodeURIComponent(firstMake)}&priceMax=30000000`, { waitUntil: "domcontentloaded" });
    const second = (await resultTitles()).join("|");
    await page.goBack({ waitUntil: "domcontentloaded" });
    const backTitles = (await resultTitles()).join("|");
    check("browser Back returns the previous search", backTitles === beforeReload && backTitles.length > 0, page.url().replace(BASE, ""));

    await page.goForward({ waitUntil: "domcontentloaded" });
    /* Wait for the URL the forward entry actually is, then let the grid settle. Comparing straight
       after `goForward` read the previous page's cards while React was still swapping them and
       failed an assertion whose own detail line showed the correct URL. */
    await page.waitForURL(/priceMax=30000000/, { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const forwardTitles = (await resultTitles()).join("|");
    check("browser Forward returns the later search", forwardTitles === second && forwardTitles.length > 0, page.url().replace(BASE, ""));

    /* From the hero, then back to the homepage: the hero must still be usable. */
    await goHome();
    await page.selectOption("#hero-make", firstMake);
    await page.locator('form button[type="submit"]').first().click();
    await page.waitForURL(/\/search/, { timeout: 60_000 });
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    check("Back from results reaches a working homepage hero", (await page.locator("#hero-make").count()) === 1 && (await page.locator('#hero-make option').count()) > 2, page.url().replace(BASE, "") || "/");
  }

  /* ── Console ────────────────────────────────────────────────────────────────────────────── */
  heading("Console");
  check("no console errors during the whole run", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
} finally {
  await browser.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFAILED:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(fail > 0 ? 1 : 0);
