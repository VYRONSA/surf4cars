/**
 * Dealer Spotlight — the commercial rules, and the section itself (PCP-042).
 *
 * WHY THIS NEEDS ITS OWN HARNESS
 * ==============================
 * The section is invisible on the live homepage, and correctly so: there are no approved editorial
 * placements, and the rule is that no approval means no section. That makes it the one part of the
 * page that cannot be verified — or screenshotted — by loading the homepage.
 *
 * So this publishes a placement, proves the section, and removes it again. The gating rule is
 * checked in both directions, which is the part that actually matters commercially: a slot that
 * fills itself when nobody has approved anything is an advertisement the platform gave away, and a
 * slot that silently substitutes a different dealership is one the payer did not buy.
 *
 * Everything written is removed in a `finally`, including on failure. The dealership row itself is
 * only read.
 *
 *   npm run build && npx next start -p 3100
 *   node scripts/verify-dealer-spotlight.mjs [--shots]
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";

const APP = process.env.APP_URL ?? "http://localhost:3100";
const SHOTS = process.argv.includes("--shots");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

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
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

const SLOT_KEY = "pcp042-spotlight-verify";
const STORY =
  "Specialists in low-mileage German saloons, with every vehicle inspected before it reaches the floor.";

const browser = await chromium.launch();
let slotCreated = false;
let placementId = null;

const spotlightOnPage = async (page, viewport = { width: 1440, height: 1000 }) => {
  await page.setViewportSize(viewport);
  await page.goto(`${APP}/`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const section = document.querySelector("[data-testid=dealer-spotlight]");
    if (!section) return null;
    const links = [...section.querySelectorAll("a")].map((anchor) => ({
      text: anchor.textContent.trim(),
      href: anchor.getAttribute("href"),
    }));
    return {
      heading: section.querySelector("h2")?.textContent?.trim() ?? "",
      text: section.textContent.replace(/\s+/g, " ").trim(),
      links,
      vehicleCards: section.querySelectorAll('a[href^="/vehicle/"]').length,
      logos: section.querySelectorAll("img[alt$='logo']").length,
      height: Math.round(section.getBoundingClientRect().height),
      top: Math.round(section.getBoundingClientRect().top + window.scrollY),
    };
  });
};

console.log("\nDealer Spotlight (PCP-042)\n──────────────────────────");

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  /* ── The gate, closed ───────────────────────────────────────────────────────────────────────── */

  heading("No approval, no section");

  const { data: existing } = await db
    .from("editorial_slots")
    .select("key,kind,published")
    .eq("kind", "dealer-spotlight")
    .eq("published", true);

  check(
    "no dealer-spotlight slot is published today",
    (existing ?? []).length === 0,
    `${(existing ?? []).length} published slots`,
  );

  const before = await spotlightOnPage(page);
  check("the homepage renders no Dealer Spotlight", before === null);

  if (SHOTS) {
    mkdirSync("screenshots/pcp042", { recursive: true });
    await page.screenshot({ path: "screenshots/pcp042/before-dealer-spotlight-absent.png", fullPage: false });
  }

  /* ── Approve one, and only one ──────────────────────────────────────────────────────────────── */

  heading("An approved placement");

  const { data: dealerships, error: dealerError } = await db
    .from("dealerships")
    .select("id,business_name,trading_name,city,logo_data_url")
    .limit(40);
  if (dealerError) throw new Error(dealerError.message);

  /* A dealership that actually has published stock, so the count the section prints is real. */
  const { data: stock } = await db
    .from("inventory_vehicles")
    .select("dealership_id")
    .eq("lifecycle_status", "published")
    .limit(2000);
  const counts = new Map();
  for (const row of stock ?? []) counts.set(row.dealership_id, (counts.get(row.dealership_id) ?? 0) + 1);

  const subject = (dealerships ?? []).find((row) => (counts.get(row.id) ?? 0) > 0);
  check("a dealership with published stock is available", Boolean(subject), subject?.business_name ?? "none");
  if (!subject) throw new Error("no dealership with published stock");

  /*
    Clear any residue from an interrupted run before starting.

    The first version inserted and failed hard on a duplicate key, which turned one killed run into a
    permanently poisoned suite — and left a *published* dealer-spotlight slot in the database until
    somebody noticed. A verification suite the operations manual tells you to run weekly must be able
    to recover from having been interrupted, because sooner or later it will be.
  */
  await db.from("editorial_placements").delete().eq("slot_key", SLOT_KEY);
  await db.from("editorial_slots").delete().eq("key", SLOT_KEY);

  const { error: slotError } = await db.from("editorial_slots").insert({
    key: SLOT_KEY,
    title: "Dealer spotlight",
    headline: "Dealer spotlight",
    description: null,
    kind: "dealer-spotlight",
    position: 900,
    published: true,
  });
  if (slotError) throw new Error(`slot insert: ${slotError.message}`);
  slotCreated = true;

  const { data: placement, error: placementError } = await db
    .from("editorial_placements")
    .insert({
      slot_key: SLOT_KEY,
      subject_kind: "dealership",
      subject_id: subject.id,
      story: STORY,
      position: 1,
      published: true,
    })
    .select("id")
    .single();
  if (placementError) throw new Error(`placement insert: ${placementError.message}`);
  placementId = placement.id;
  check("an approved placement was published", Boolean(placementId));

  /* ── The gate, open ─────────────────────────────────────────────────────────────────────────── */

  heading("The section itself");

  /*
    The homepage is revalidated rather than rendered per request, so an approval lands on the next
    regeneration rather than on the next request. Polling past the window is the honest way to test
    it — and the first version of this check did not, reported "does not render", and sent me looking
    for a bug in the gate that was really a bug in the caching. See `revalidate` in the route.
  */
  let after = null;
  const deadline = Date.now() + 150_000;
  while (after === null && Date.now() < deadline) {
    after = await spotlightOnPage(page);
    if (after === null) await page.waitForTimeout(5_000);
  }
  check("the Dealer Spotlight now renders", after !== null, after ? "within the revalidation window" : "not within 150s");

  if (after) {
    const displayName = subject.trading_name || subject.business_name;
    check("it names the approved dealership", after.heading === displayName, after.heading);
    check(
      "it never substitutes a different dealership",
      after.text.includes(displayName),
      displayName,
    );
    check("the city is shown", !subject.city || after.text.includes(subject.city), subject.city ?? "none recorded");
    check(
      "the vehicle count is shown and is the real one",
      after.text.includes(String(counts.get(subject.id))),
      `${counts.get(subject.id)} published`,
    );
    check("the Founder's speciality copy is shown", after.text.includes(STORY.slice(0, 40)));
    check(
      "the dealership's own mark is shown when they have supplied one",
      subject.logo_data_url ? after.logos === 1 : after.logos === 0,
      subject.logo_data_url ? "logo present" : "no logo supplied — none invented",
    );

    const hrefs = after.links.map((link) => link.href ?? "");
    check(
      "primary CTA — View dealership",
      after.links.some((link) => /view dealership/i.test(link.text) && link.href?.startsWith("/dealers/")),
      hrefs.find((href) => href.startsWith("/dealers/")) ?? "missing",
    );
    check(
      "secondary CTA — Browse inventory",
      after.links.some((link) => /browse inventory/i.test(link.text) && link.href?.startsWith("/search?dealer=")),
      hrefs.find((href) => href.startsWith("/search?dealer=")) ?? "missing",
    );

    /*
      The structural change, asserted structurally. The previous version ended in a four-up grid of
      the dealership's stock, which made it a vehicle rail with a name on top — the thing the brief
      says it must stop being.
    */
    check(
      "it is a dealership profile, not another listing block",
      after.vehicleCards === 0,
      `${after.vehicleCards} vehicle cards`,
    );
    check("it is a full-height showcase rather than a card", after.height >= 400, `${after.height}px tall`);

    /* Both CTAs must actually resolve. */
    for (const link of after.links) {
      if (!link.href?.startsWith("/")) continue;
      const response = await page.request.get(`${APP}${link.href}`, { maxRedirects: 0 });
      check(`CTA ${link.href} resolves`, response.status() < 400, `HTTP ${response.status()}`);
    }

    if (SHOTS) {
      mkdirSync("screenshots/pcp042", { recursive: true });
      await page.evaluate(() => {
        document.querySelector("[data-testid=dealer-spotlight]")?.scrollIntoView({ block: "center" });
      });
      await page.waitForTimeout(900);
      await page.screenshot({ path: "screenshots/pcp042/after-dealer-spotlight.png" });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(600);
      await page.evaluate(() => {
        document.querySelector("[data-testid=dealer-spotlight]")?.scrollIntoView({ block: "center" });
      });
      await page.waitForTimeout(600);
      await page.screenshot({ path: "screenshots/pcp042/after-dealer-spotlight-mobile.png" });
    }

    /* Mobile: the showcase must not push the page sideways. */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    check("no horizontal overflow at 390px", !overflow);
  }

  /* ── Unpublishing closes the gate again ─────────────────────────────────────────────────────── */

  heading("Withdrawing approval");

  await db.from("editorial_placements").update({ published: false }).eq("id", placementId);
  let withdrawn = await spotlightOnPage(page);
  const withdrawDeadline = Date.now() + 150_000;
  while (withdrawn !== null && Date.now() < withdrawDeadline) {
    await page.waitForTimeout(5_000);
    withdrawn = await spotlightOnPage(page);
  }
  check("unpublishing the placement removes the section entirely", withdrawn === null);
  check(
    "…rather than falling back to another dealership",
    withdrawn === null,
    "no substitute rendered",
  );

  await page.close();
} finally {
  if (placementId) await db.from("editorial_placements").delete().eq("id", placementId);
  if (slotCreated) await db.from("editorial_slots").delete().eq("key", SLOT_KEY);
  await browser.close();

  const { data: leftover } = await db.from("editorial_slots").select("key").eq("key", SLOT_KEY);
  console.log(
    `\nverification placement removed — ${(leftover ?? []).length === 0 ? "editorial tables left as found" : "WARNING: slot still present"}`,
  );
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failures.length) console.log(failures.map((entry) => `  · ${entry}`).join("\n") + "\n");
process.exit(failed === 0 ? 0 : 1);
