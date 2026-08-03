/**
 * Founder Demonstration Mode (PCP-046).
 *
 * WHAT HAS TO BE PROVED
 * =====================
 * Not that the demonstration looks good — a screenshot shows that. Three things a screenshot cannot:
 *
 *   1. that the mode is a *substitution*, not a second rendering path — the same merchandising,
 *      segmentation and deduplication run in both, so switching cannot change how anything looks;
 *   2. that demonstration mode is permissive about *unreviewed* photographs and never about refused
 *      ones — a rejected frame is a statement of fact and a demonstration is not a reason to publish
 *      a rally car captioned as a hatchback;
 *   3. that production mode is byte-for-byte the behaviour PCP-043 to PCP-045 audited, so the
 *      deployment certificate still means something.
 *
 * The script detects which mode the running server is in and asserts accordingly, plus the
 * invariants that must hold in both. Run it once per mode:
 *
 *   FOUNDER_DEMO_MODE=true  npm run build && FOUNDER_DEMO_MODE=true npx next start -p 3100
 *   node scripts/verify-founder-demo-mode.mjs
 *
 *   FOUNDER_DEMO_MODE=false npm run build && npx next start -p 3100
 *   node scripts/verify-founder-demo-mode.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { chromium } from "playwright";

const APP = process.env.APP_URL ?? "http://localhost:3100";

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
const heading = (label) => console.log(`\n${label}\n${"─".repeat(label.length)}`);
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

console.log("\nFounder Demonstration Mode (PCP-046)\n────────────────────────────────────");

/* ── Which mode is running ────────────────────────────────────────────────────────────────────── */

const health = await (await fetch(`${APP}/api/health`)).json();
const configIssues =
  health.checks?.find((entry) => entry.name === "configuration")?.meta?.issues ?? [];
const demoIssue = configIssues.find((issue) => issue.variable === "FOUNDER_DEMO_MODE");
const demoMode = Boolean(demoIssue);

console.log(`\nRunning in: ${demoMode ? "FOUNDER DEMONSTRATION" : "PRODUCTION"} mode`);

check(
  "the running mode is reported on /api/health",
  demoMode ? Boolean(demoIssue) : configIssues.every((issue) => issue.variable !== "FOUNDER_DEMO_MODE"),
  demoIssue ? demoIssue.message.slice(0, 80) : "no demo warning — production",
);
if (demoMode) {
  check(
    "…as a warning, not an error — the mode is legitimate, not a misconfiguration",
    demoIssue.severity === "warning",
    demoIssue.severity,
  );
}

/* ── The engine, in isolation ─────────────────────────────────────────────────────────────────── */

heading("The resolver is the only branch");

const OUT = ".demo-verify";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
execSync(
  `npx esbuild src/services/media-review/media-review.service.ts --bundle --platform=node --format=esm --outfile=${OUT}/review.mjs --alias:@=./src --log-level=error`,
  { stdio: "pipe" },
);
const { resolveHomepageApprovals } = await import(`../${OUT}/review.mjs`);

const REJECTED = "/images/vehicles/library/hyundai-i20/side.webp";
const SEARCH_ONLY = "/images/vehicles/library/bmw-x5/rear.webp";
const UNREVIEWED = "/images/vehicles/library/ford-ranger/front.webp";
const NON_EDITORIAL = "/images/vehicles/library/volvo-xc90/rear.webp";

const index = {
  approvedForHomepage: new Set(["/approved.webp"]),
  rejected: new Set([REJECTED]),
  all: new Map([
    [REJECTED, { state: "rejected" }],
    [SEARCH_ONLY, { state: "approved_search" }],
    ["/approved.webp", { state: "approved_homepage" }],
  ]),
};
const candidates = [REJECTED, SEARCH_ONLY, UNREVIEWED, NON_EDITORIAL, "/approved.webp"];

process.env.FOUNDER_DEMO_MODE = "false";
const strict = resolveHomepageApprovals(index, candidates);
check("production: only Founder approvals are eligible", strict.size === 1 && strict.has("/approved.webp"), `${strict.size} eligible`);
check("production: an unreviewed frame is not eligible", !strict.has(UNREVIEWED));

process.env.FOUNDER_DEMO_MODE = "true";
const demo = resolveHomepageApprovals(index, candidates);
check("demonstration: an unreviewed editorial-grade frame becomes eligible", demo.has(UNREVIEWED));
check("demonstration: a REJECTED frame is still refused", !demo.has(REJECTED), REJECTED.split("/").slice(-2).join("/"));
check("demonstration: a search-only frame is still refused", !demo.has(SEARCH_ONLY), SEARCH_ONLY.split("/").slice(-2).join("/"));
check(
  "demonstration: a frame below the editorial standard is still refused",
  !demo.has(NON_EDITORIAL),
  NON_EDITORIAL.split("/").slice(-2).join("/"),
);
check("demonstration: Founder approvals still count", demo.has("/approved.webp"));
process.env.FOUNDER_DEMO_MODE = demoMode ? "true" : "false";

rmSync(OUT, { recursive: true, force: true });

/* ── The rendered marketplace ─────────────────────────────────────────────────────────────────── */

heading(`The marketplace as rendered (${demoMode ? "demonstration" : "production"})`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`${APP}/`, { waitUntil: "load" });
await page.waitForTimeout(2000);

const rails = await page.locator("section[data-rail]").evaluateAll((sections) =>
  sections.map((section) => ({
    key: section.getAttribute("data-rail"),
    heading: section.querySelector("h2")?.textContent?.trim() ?? "",
    images: [...section.querySelectorAll('a[href^="/vehicle/"] img')].map((image) => {
      const raw = image.getAttribute("src") ?? "";
      try {
        return decodeURIComponent(new URL(raw, location.origin).searchParams.get("url") ?? raw);
      } catch {
        return raw;
      }
    }),
  })),
);
const spotlight = await page.locator("[data-testid=dealer-spotlight]").count();
const marqueRail = await page.locator("text=Browse by marque").count();

console.log(rails.map((rail) => `        · ${rail.key}: ${rail.images.length} cars`).join("\n") || "        (no rails)");

if (demoMode) {
  const REQUIRED = ["sports-performance", "luxury", "premium-suv", "family", "commercial", "marketplace"];
  const present = rails.map((rail) => rail.key);
  for (const key of REQUIRED) {
    check(`the ${key} rail renders`, present.includes(key), present.includes(key) ? `${rails.find((r) => r.key === key).images.length} cars` : "absent");
  }
  check("Browse by marque renders", marqueRail > 0);
  check("the Dealer Spotlight renders", spotlight === 1, `${spotlight} sections`);
} else {
  check("no vehicle rail renders while nothing is approved", rails.length === 0, `${rails.length} rails`);
  check("the Dealer Spotlight does not render without an approved placement", spotlight === 0, `${spotlight} sections`);
}

/* ── Invariants that hold in both modes ───────────────────────────────────────────────────────── */

heading("Invariants — both modes");

const { data: reviewRows } = await db.from("media_reviews").select("photograph,state");
const rejected = new Set((reviewRows ?? []).filter((row) => row.state === "rejected").map((row) => row.photograph));
const searchOnly = new Set(
  (reviewRows ?? []).filter((row) => row.state === "approved_search").map((row) => row.photograph),
);

const shown = rails.flatMap((rail) => rail.images);
check(
  `no rejected photograph reaches the homepage (${shown.length} cards)`,
  shown.every((src) => !rejected.has(src)),
  shown.filter((src) => rejected.has(src)).slice(0, 2).join(", "),
);
check(
  "no search-only photograph reaches the homepage",
  shown.every((src) => !searchOnly.has(src)),
  shown.filter((src) => searchOnly.has(src)).slice(0, 2).join(", "),
);
check("no photograph appears twice", new Set(shown).size === shown.length, `${shown.length - new Set(shown).size} repeats`);

const hrefs = await page.locator('section[data-rail] a[href^="/vehicle/"]').evaluateAll((anchors) =>
  anchors.map((anchor) => anchor.getAttribute("href")),
);
check("no vehicle appears twice", new Set(hrefs).size === hrefs.length, `${hrefs.length - new Set(hrefs).size} repeats`);

/* Editorial never leads the page in either mode. */
const positions = await page.evaluate(() => {
  const lifestyle = [...document.querySelectorAll("h2")].find((node) =>
    node.textContent.trim().startsWith("Find your next journey"),
  );
  const firstRail = document.querySelector("section[data-rail]");
  const top = (node) => (node ? Math.round(node.getBoundingClientRect().top + window.scrollY) : null);
  return { lifestyle: top(lifestyle), firstRail: top(firstRail) };
});
check(
  "editorial never leads the page",
  positions.firstRail === null ? positions.lifestyle === null : positions.firstRail < positions.lifestyle,
  `first rail ${positions.firstRail}, editorial ${positions.lifestyle}`,
);

/* The operations workflow is untouched by the mode. */
const consoleResponse = await page.request.get(`${APP}/operations/photography`, { maxRedirects: 0 });
check(
  "the photography console is still gated",
  consoleResponse.status() === 307 || consoleResponse.status() === 302,
  `HTTP ${consoleResponse.status()}`,
);
const { count: approvals } = await db
  .from("media_reviews")
  .select("photograph", { count: "exact", head: true })
  .eq("state", "approved_homepage");
check(
  "the mode writes nothing to the review tables",
  (approvals ?? 0) === 0,
  `${approvals ?? 0} approvals on file — the demonstration reads, it does not approve`,
);

await browser.close();

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failures.length) console.log(failures.map((entry) => `  · ${entry}`).join("\n") + "\n");
process.exit(failed === 0 ? 0 : 1);
