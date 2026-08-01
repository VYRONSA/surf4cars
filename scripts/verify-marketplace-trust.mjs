/**
 * Marketplace trust verification.
 *
 * TWO KINDS OF CHECK, AND BOTH ARE NEEDED
 * =======================================
 * A *source* scan catches the fabrication being reintroduced — `rating: 4.8` written back into a
 * mapper during some future refactor, where it would sit quietly until somebody reads that file.
 * A *rendered* scan catches the fabrication that is already there and reaching customers.
 *
 * Neither finds the other's failures. The source scan cannot see a component that formats a null
 * into "0.0 ★"; the rendered scan cannot see a literal on a code path today's data does not reach.
 *
 * WHAT THIS ASSERTS
 * =================
 * That every trust claim on a customer-facing page can be defended from the database. Where the
 * database has nothing, the page says nothing — or says plainly that it does not know.
 *
 * Usage:  npm run dev  &&  node scripts/verify-marketplace-trust.mjs
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

/* ── Source scan ────────────────────────────────────────────────────────────────────────────── */

heading("Source — the fabrications must not come back");

/*
  Scan the code, not the prose.
  ============================
  The first two versions of this tried to filter comment lines out of grep output — first by leading
  `*`, then by the presence of a backtick — and both reported failures for comments explaining the
  very fixes being verified. A wrapped sentence inside a block comment has no reliable lexical
  marker, and a guard that cries wolf on its own documentation gets switched off.

  So the comments are removed before the search happens. Crude — it does not understand strings
  containing "//" — but it errs toward scanning *more* than it should rather than less, which is the
  safe direction for a guard.
*/
const { readdirSync, statSync } = await import("node:fs");

function sourceFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) found.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry)) found.push(full);
  }
  return found;
}

const stripComments = (code) =>
  code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const SOURCES = sourceFiles("src").map((file) => ({
  file,
  code: stripComments(readFileSync(file, "utf8")),
}));

function grepCount(pattern) {
  const re = new RegExp(pattern);
  return SOURCES.filter((entry) => re.test(entry.code)).map((entry) => entry.file);
}

const banned = [
  ["hardcoded dealer rating", "rating: 4\\.8"],
  ["hardcoded review count", "reviewCount: 24"],
  ["hardcoded response time", "responseTime: \"within"],
  ["hardcoded years in business", "yearsInBusiness: 8"],
  ["unconditional verified flag", "verified: true"],
  ["\"+27\" contact fallback", "\\?\\? \"\\+27\""],
  ["invented fuel default", "fuel \\?\\? \"Petrol\""],
  ["invented transmission default", "transmission \\?\\? \"Automatic\""],
  ["invented body type default", "bodyType \\?\\? \"SUV\""],
  ["invented province default", "province \\?\\? \"Western Cape\""],
  ["invented dealer name default", "\\?\\? \"SURF4CARS Dealer\""],
  ["undocumented finance multiplier", "/ 72 \\* 1\\.18"],
];

for (const [label, pattern] of banned) {
  const hits = grepCount(pattern);
  check(`no ${label}`, hits.length === 0, hits.slice(0, 2).join(" | ") || "absent");
}

/* ── Database reality ───────────────────────────────────────────────────────────────────────── */

heading("Database — what can actually be defended");

const dealerships = await db.from("dealerships").select("verification_status,telephone,whatsapp");
const rows = dealerships.data ?? [];
const verifiedCount = rows.filter((r) => r.verification_status === "verified").length;
const withPhone = rows.filter((r) => r.telephone?.trim()).length;

check("verification column exists and is readable", !dealerships.error, dealerships.error?.message ?? `${rows.length} dealerships`);
check(
  "no dealership claims verification it has not been given",
  rows.every((r) => ["unknown", "pending", "documents_submitted", "verified", "rejected", "expired"].includes(r.verification_status ?? "unknown")),
);
console.log(`         verified: ${verifiedCount} of ${rows.length} · with telephone: ${withPhone} of ${rows.length}`);

/* PostgREST answers a missing table without an error but with a null count, so `!probe.error` was
   treating "does not exist" as "exists and is being ignored" — three failures for three tables that
   are not there. */
const reviewTables = [];
for (const table of ["dealer_reviews", "reviews", "dealership_reviews"]) {
  const probe = await db.from(table).select("*", { head: true, count: "exact" });
  if (!probe.error && typeof probe.count === "number") reviewTables.push(`${table} (${probe.count})`);
}
check(
  "ratings are not shown while no reviews are stored",
  reviewTables.length === 0,
  reviewTables.join(", ") || "no reviews table exists — ratings render as \"No reviews yet\"",
);

/* ── Rendered pages ─────────────────────────────────────────────────────────────────────────── */

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultNavigationTimeout(90_000);

try {
  heading("Rendered — vehicle detail");

  await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
  await page.locator('a[href^="/vehicle/"]').first().waitFor({ timeout: 25_000 });
  const vehicleHref = await page.locator('a[href^="/vehicle/"]').first().getAttribute("href");
  await page.goto(BASE + vehicleHref, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);

  const html = await page.content();
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");

  check("no star rating is printed", !/\b[0-5]\.\d\s*★/.test(text) && !/\(\d+ reviews?\)/i.test(text), (text.match(/\(\d+ reviews?\)/i) ?? [])[0] ?? "none");
  check("says \"No reviews yet\" instead", /No reviews yet/i.test(text));
  check("no \"years in business\" claim", !/\d+ years? in business/i.test(text), (text.match(/\d+ years? in business/i) ?? [])[0] ?? "none");
  check("no response-time claim", !/responds within/i.test(text), (text.match(/responds [^.·]{0,24}/i) ?? [])[0] ?? "none");
  check("no verified badge while nothing is verified", verifiedCount > 0 || !/verified by surf4cars|verified dealer/i.test(text), (text.match(/verified[^.·]{0,20}/i) ?? [])[0] ?? "none");
  check("no dead telephone link", !/href="tel:\+27"/.test(html) && !/tel:\+27"/.test(html));
  check("no dead WhatsApp link", !/wa\.me\/27"/.test(html));
  check("no undocumented finance figure", !/from R\s?[\d\s]+ p\/m/i.test(text), (text.match(/from R[\d\s]+ p\/m/i) ?? [])[0] ?? "none");
  check("the enquiry form is still offered", (await page.locator("#enquiry").count()) > 0);

  heading("Rendered — a vehicle with missing specifications");
  /*
    Targeted by slug, not by a title search.
    =======================================
    Searching for the vehicle's title matched a *different* car — several published Volvo XC90s
    share a title prefix, and the one the token search returned first had a fuel type on record. The
    harness then reported a fabrication that was not there. The slug is derived exactly as
    `buildVehicleSlug` derives it, so this navigates to the specific row with the gap.
  */
  const gap = await db
    .from("inventory_vehicles")
    .select("id,title,make,model,year,variant,fuel,transmission")
    .is("fuel", null)
    .in("lifecycle_status", ["published", "performance-monitoring", "reserved"])
    .limit(1)
    .maybeSingle();

  if (gap.data) {
    const slugify = (value) =>
      value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const descriptor = [gap.data.year, gap.data.make, gap.data.model, gap.data.variant]
      .filter(Boolean)
      .join(" ");
    const slug = `${slugify(descriptor)}-${slugify(gap.data.id).slice(0, 8)}`;

    const response = await page.goto(`${BASE}/vehicle/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const detail = (await page.locator("body").innerText()).replace(/\s+/g, " ");

    check(
      "the vehicle with no fuel type on record is reachable",
      Boolean(response) && response.status() < 400,
      `${gap.data.title} → /vehicle/${slug} (HTTP ${response?.status()})`,
    );
    check(
      "it is not given a fuel type it does not have",
      !/Petrol|Diesel|Hybrid/.test(detail),
      (detail.match(/(Petrol|Diesel|Hybrid)/) ?? [])[0] ?? "none invented",
    );
    check(
      "it is not given a transmission it does not have",
      !/Automatic|Manual/.test(detail),
      (detail.match(/(Automatic|Manual)/) ?? [])[0] ?? "none invented",
    );
  } else {
    check("no published vehicle is missing its fuel type", true, "nothing to check");
  }

  heading("Rendered — dealer profile");
  /* The dealer link lives on the vehicle page, not on search result cards — the previous version
     looked on /search, found nothing, and reported the profile unreachable. */
  await page.goto(BASE + vehicleHref, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const dealerHref = await page.locator('a[href^="/dealers/"]').first().getAttribute("href").catch(() => null);
  if (dealerHref) {
    await page.goto(BASE + dealerHref, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const dealerText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    check("dealer profile does not claim verification", verifiedCount > 0 || !/verified dealer/i.test(dealerText), (dealerText.match(/verified[^.·]{0,18}/i) ?? [])[0] ?? "none");
    check("dealer profile does not print \"Unverified\" as a judgement", !/\bUnverified\b/.test(dealerText));
    check("dealer profile names the real state", /Not yet assessed|Verified|Pending verification|Documents submitted/i.test(dealerText));
  } else {
    check("dealer profile reachable from search", false, "no dealer link found");
  }

  heading("Rendered — homepage and marketplace copy");
  for (const [route, label] of [["/", "homepage"], ["/search", "marketplace"], ["/auth/sign-in", "sign in"]]) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    const t = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    const claims = [
      /every verified dealer/i,
      /dealers who are verified/i,
      /every listing verified/i,
      /every dealership is checked/i,
      /quality guaranteed/i,
      /best prices/i,
    ].filter((r) => r.test(t));
    check(`${label} makes no unprovable trust claim`, claims.length === 0, claims.map((r) => String(r)).join(" | ") || "clean");
  }

  heading("Structured data");
  await page.goto(BASE + vehicleHref, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const joined = ld.join(" ");
  check("no aggregateRating in structured data", !/aggregateRating|ratingValue/i.test(joined));
  check("no review count in structured data", !/reviewCount/i.test(joined));
  check("structured data present", ld.length > 0, `${ld.length} blocks`);
} finally {
  await browser.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFAILED:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(fail > 0 ? 1 : 0);
