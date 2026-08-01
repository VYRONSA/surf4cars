/**
 * Cross-page consistency and the customer journey.
 *
 * WHY MEASURE CONSISTENCY RATHER THAN LOOK AT IT
 * ==============================================
 * "Does it feel like the same product" is a judgement, but most of what produces that feeling is
 * arithmetic: the content column starting at the same x on every page, buttons the same height,
 * corner radii from one set rather than five, transitions the same duration. Those are the details
 * nobody can name and everybody notices, and they are exactly the ones that drift silently as pages
 * are built by different sprints.
 *
 * So this reads the computed styles off four rendered pages and compares them. What it cannot judge
 * — whether the photography is good, whether the copy is right — is left to a person.
 *
 * THE JOURNEY WALK IS THE OTHER HALF
 * ==================================
 * A visitor does not experience pages, they experience a path. This walks the real one — homepage to
 * marketplace to vehicle to dealer to enquiry to confirmation — counting clicks and recording any
 * step that dead-ends. It submits a real enquiry and deletes it afterwards.
 *
 * Usage:  npm run dev  &&  node scripts/verify-marketplace-experience.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3003";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

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

const MARKER = `journey-${Date.now()}@pcp033-check.invalid`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1536, height: 1024 } });
const page = await context.newPage();
page.setDefaultNavigationTimeout(90_000);

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text().slice(0, 110));
});
page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 110)));

async function settle(selector) {
  await page.locator(selector).first().waitFor({ timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(700);
}

try {
  /* ── Discover the journey's own URLs ─────────────────────────────────────────────────────── */
  await page.goto(`${BASE}/search`, { waitUntil: "domcontentloaded" });
  await settle('a[href^="/vehicle/"]');
  const vehicleHref = await page.locator('a[href^="/vehicle/"]').first().getAttribute("href");
  await page.goto(BASE + vehicleHref, { waitUntil: "domcontentloaded" });
  await settle("#enquiry");
  const dealerHref = await page.locator('a[href^="/dealers/"]').first().getAttribute("href");

  const ROUTES = [
    ["homepage", "/"],
    ["marketplace", "/search"],
    ["vehicle", vehicleHref],
    ["dealer", dealerHref],
  ];

  /* ── Phase 4: cross-page consistency ─────────────────────────────────────────────────────── */
  heading("Cross-page consistency");

  const measurements = [];
  for (const [name, route] of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1400);
    measurements.push({
      name,
      ...(await page.evaluate(() => {
        const round = (n) => Math.round(n * 10) / 10;
        const header = document.querySelector("header");
        const headerBox = header?.getBoundingClientRect();

        /*
          Measure the text, not the boxes.
          ===============================
          Two earlier versions of this compared the left edge of constrained *containers* — first the
          minimum, then the most common — and both compared different nesting levels on different
          pages: 68 here is an outer container, 108 there is the padded column inside it. The page
          reported a misalignment that a ruler on the screen could not find.

          What a visitor perceives as the margin is where the words start. So this measures the left
          edge of the actual headings and paragraphs and takes the value that repeats, ignoring
          anything hard against the viewport edge (full-bleed showcases) and anything indented by an
          adornment (the dealer name sits beside its initials tile).
        */
        const textLefts = [...document.querySelectorAll("h1, h2, h3, main p, section p")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 40 && r.height > 0 && r.left > 50 && !el.closest("[aria-hidden='true']");
          })
          .map((el) => round(el.getBoundingClientRect().left));
        const tally = new Map();
        for (const value of textLefts) tally.set(value, (tally.get(value) ?? 0) + 1);
        const columns = [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([value]) => value);

        const buttons = [...document.querySelectorAll("a[href], button")].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.height > 30 && r.width > 60 && getComputedStyle(el).borderRadius !== "0px";
        });

        const bodyFont = getComputedStyle(document.body).fontFamily;
        const h1 = document.querySelector("h1");

        return {
          headerHeight: headerBox ? round(headerBox.height) : null,
          contentLeft: columns.length ? columns[0] : null,
          radii: [...new Set(buttons.map((b) => getComputedStyle(b).borderRadius))].sort(),
          transitions: [
            ...new Set(
              buttons
                .map((b) => getComputedStyle(b).transitionDuration)
                .filter((d) => d && d !== "0s"),
            ),
          ].sort(),
          bodyFont: bodyFont.split(",")[0].replace(/["']/g, ""),
          h1Font: h1 ? getComputedStyle(h1).fontFamily.split(",")[0].replace(/["']/g, "") : null,
          h1Weight: h1 ? getComputedStyle(h1).fontWeight : null,
          background: getComputedStyle(document.body).backgroundColor,
        };
      })),
    });
  }

  const same = (key) => new Set(measurements.map((m) => JSON.stringify(m[key]))).size === 1;
  const values = (key) => measurements.map((m) => `${m.name}=${JSON.stringify(m[key])}`).join(" ");

  check("the masthead is the same height on every page", same("headerHeight"), values("headerHeight"));
  check("the content column starts at the same edge", same("contentLeft"), values("contentLeft"));
  check("one page background", same("background"), values("background"));
  check("one body typeface", same("bodyFont"), values("bodyFont"));
  check("headings use the body typeface", measurements.every((m) => !m.h1Font || m.h1Font === m.bodyFont), values("h1Font"));
  /*
    Interior pages must agree with each other; the hero is allowed to differ.
    ========================================================================
    The homepage statement is uppercase display type at 700 and every page title is sentence case at
    600. That is two roles, not an inconsistency — caps need the extra weight to hold at that size,
    and forcing interior titles to 700 would make them read as shouting. What would be a real fault
    is the *same* role rendered differently on different pages, which is what this now asserts.
  */
  const interior = measurements.filter((m) => m.name !== "homepage");
  const interiorWeights = new Set(interior.map((m) => m.h1Weight));
  const allWeights = new Set(measurements.map((m) => m.h1Weight));
  check("page titles share one weight", interiorWeights.size === 1, values("h1Weight"));
  check("heading weights come from a small set", allWeights.size <= 2, [...allWeights].join(", "));

  /* Radii and transitions are compared as *sets* rather than for equality: a vehicle page legitimately
     has controls a catalogue does not. What matters is that no page invents a value outside the
     system's vocabulary. */
  const allRadii = [...new Set(measurements.flatMap((m) => m.radii))];
  const allTransitions = [...new Set(measurements.flatMap((m) => m.transitions))];
  check("corner radii come from a small shared set", allRadii.length <= 5, allRadii.join(", "));
  check("transition durations come from a small shared set", allTransitions.length <= 4, allTransitions.join(", "));

  /* ── Phase 5: the customer journey ───────────────────────────────────────────────────────── */
  heading("Customer journey — homepage → marketplace → vehicle → dealer → enquiry");

  let clicks = 0;
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await settle("#hero-make");

  /* 1. Homepage → marketplace, the way a visitor with no filter in mind would. */
  await page.locator('header nav a[href="/search"]').first().click();
  clicks += 1;
  await page.waitForURL(/\/search/, { timeout: 60_000 });
  await settle('a[href^="/vehicle/"]');
  check(`homepage → marketplace in ${clicks} click`, page.url().includes("/search") && (await page.locator('a[href^="/vehicle/"]').count()) > 0);

  /* 2. Marketplace → vehicle. */
  await page.locator('a[href^="/vehicle/"]').first().click();
  clicks += 1;
  await page.waitForURL(/\/vehicle\//, { timeout: 60_000 });
  await settle("#enquiry");
  check(`marketplace → vehicle in ${clicks} clicks`, page.url().includes("/vehicle/"));

  const vehicleText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  check("the vehicle page states a price without a dangling unit", !/R\s?[\d\s]+ \/ month/.test(vehicleText), (vehicleText.match(/R[\d\s]+ \/ month/) ?? [])[0] ?? "clean");
  check("the enquiry form is reachable without leaving the page", (await page.locator("#enquiry").count()) > 0);

  /* 3. Vehicle → dealer. */
  await page.locator('a[href^="/dealers/"]').first().click();
  clicks += 1;
  await page.waitForURL(/\/dealers\//, { timeout: 60_000 });
  await page.waitForTimeout(1200);
  check(`vehicle → dealer in ${clicks} clicks`, page.url().includes("/dealers/"));

  const dealerText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  check("the dealer page names its stock count", /\d+ VEHICLES IN STOCK/i.test(dealerText));
  check("the dealer page offers a way back into stock", (await page.locator('a[href*="/search?dealer="], a[href^="/vehicle/"]').count()) > 0);

  /* 4. Back to a vehicle, then enquire. */
  await page.goto(BASE + vehicleHref, { waitUntil: "domcontentloaded" });
  await settle("#enquiry");
  await page.locator('#enquiry input[id$="-name"]').fill("Journey Check");
  await page.locator('#enquiry input[id$="-phone"]').fill("0100000000");
  await page.locator('#enquiry input[id$="-email"]').fill(MARKER);
  await page.locator("#enquiry textarea").fill("Automated journey check for PCP-033.");
  await page.locator('#enquiry button[type="submit"]').click();
  clicks += 1;

  await page
    .locator("#enquiry")
    .getByText(/SC-[A-Z2-9]{6}/)
    .first()
    .waitFor({ timeout: 25_000 })
    .catch(() => {});
  const confirmation = (await page.locator("#enquiry").innerText()).replace(/\s+/g, " ");
  check("enquiry → confirmation with a reference", /SC-[A-Z2-9]{6}/.test(confirmation), (confirmation.match(/SC-[A-Z2-9]{6}/) ?? [])[0] ?? "no reference");
  check("the confirmation does not claim the dealer was notified", !/has been sent your details/i.test(confirmation) || false, "no email provider configured, so the honest wording is expected");
  check(`the whole journey is ${clicks} clicks`, clicks <= 4, `${clicks} clicks: nav → card → dealer link → send`);

  /* ── Dead ends ───────────────────────────────────────────────────────────────────────────── */
  heading("Dead ends");
  for (const [name, route] of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("a[href], button")].filter((el) => {
        const href = el.getAttribute("href");
        return href === "#" || href === "" || el.hasAttribute("disabled");
      }).length,
    );
    check(`${name} has no dead or disabled control`, broken === 0, `${broken} found`);
  }

  heading("Console");
  check("no console errors across the journey", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
} finally {
  /* The enquiry was real. */
  const lead = await db.from("leads").select("id").eq("buyer_email", MARKER).maybeSingle();
  if (lead.data) {
    await db.from("enquiry_notifications").delete().eq("lead_id", lead.data.id);
    await db.from("lead_timeline").delete().eq("lead_id", lead.data.id);
    await db.from("leads").delete().eq("id", lead.data.id);
    console.log("\n  journey enquiry removed");
  }
  await browser.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFAILED:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(fail > 0 ? 1 : 0);
