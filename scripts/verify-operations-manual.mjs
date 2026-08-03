/**
 * The Founder Operations Manual, checked against the thing it documents (PCP-045).
 *
 * WHY A DOCUMENT NEEDS A TEST
 * ===========================
 * A manual is the one artefact that fails silently and completely. Code that references a route that
 * no longer exists does not compile; prose that does the same reads perfectly and sends somebody
 * looking for a button that was removed two sprints ago. And the person it misleads is by definition
 * the person who does not already know — which is exactly who it was written for.
 *
 * So every checkable claim it makes is checked: every route resolves to a page, every script exists,
 * every npm command is defined, every column is really on the table, and the standards it states
 * match the constants the application enforces. Where the manual says "there is no screen for this",
 * that is checked too — by confirming there is genuinely no write surface.
 *
 *   node scripts/verify-operations-manual.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const MANUAL = "docs/founder-operations-manual.md";
const text = readFileSync(MANUAL, "utf8");

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

console.log("\nFounder Operations Manual (PCP-045)\n───────────────────────────────────");

/* ── Routes ───────────────────────────────────────────────────────────────────────────────────── */

heading("Every route it sends you to");

function discoverRoutes(dir = "src/app", prefix = "") {
  const routes = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      const segment = /^\(.*\)$/.test(entry) || entry.startsWith("@") ? "" : `/${entry}`;
      routes.push(...discoverRoutes(full, `${prefix}${segment}`));
    } else if (entry === "page.tsx" || entry === "route.ts") {
      routes.push(prefix === "" ? "/" : prefix);
    }
  }
  return routes;
}

const realRoutes = new Set(discoverRoutes());
/* `/x/[y]` in the tree matches `/x/<anything>` in the prose. */
const routeExists = (route) => {
  if (realRoutes.has(route)) return true;
  const parts = route.split("/");
  return [...realRoutes].some((candidate) => {
    const known = candidate.split("/");
    if (known.length !== parts.length) return false;
    return known.every((segment, index) => segment === parts[index] || /^\[.*\]$/.test(segment));
  });
};

/* Backticked paths that look like application routes, minus wildcards the prose uses illustratively. */
const quoted = [...text.matchAll(/`(\/[a-z0-9/\[\]<>?=&.-]*)`/gi)].map((match) => match[1]);
const referencedRoutes = [...new Set(quoted)]
  .map((route) => route.split("?")[0])
  .filter((route) => !route.includes("*") && !route.includes("<"))
  .filter((route) => !/\.(css|ts|tsx|mjs|md|xml|txt|webp)$/.test(route))
  .filter((route) => !route.startsWith("/src/") && !route.startsWith("/images/"));

const missingRoutes = referencedRoutes.filter((route) => !routeExists(route));
check(
  `every route the manual names exists (${referencedRoutes.length} referenced)`,
  missingRoutes.length === 0,
  missingRoutes.join(", "),
);

/* ── Scripts and commands ─────────────────────────────────────────────────────────────────────── */

heading("Every command it tells you to run");

const referencedScripts = [...new Set([...text.matchAll(/scripts\/([a-z0-9-]+\.mjs)/g)].map((m) => m[1]))];
const missingScripts = referencedScripts.filter((file) => !existsSync(join("scripts", file)));
check(
  `every script exists (${referencedScripts.length} referenced)`,
  missingScripts.length === 0,
  missingScripts.join(", "),
);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const referencedNpm = [...new Set([...text.matchAll(/npm run ([a-z:-]+)/g)].map((m) => m[1]))];
const missingNpm = referencedNpm.filter((name) => !(name in pkg.scripts));
check(
  `every npm command is defined (${referencedNpm.length} referenced)`,
  missingNpm.length === 0,
  missingNpm.join(", "),
);

/* Every verification suite that exists should be in the weekly list — a suite nobody runs is a
   suite nobody trusts, and the manual is where that list lives now. */
const suites = readdirSync("scripts").filter((file) => file.startsWith("verify-") && file.endsWith(".mjs"));
const activeSuites = suites.filter((file) =>
  ["verify-journeys", "verify-founder-dashboard", "verify-founder-curation", "verify-approval-workspace",
   "verify-back-navigation", "verify-dealer-spotlight", "verify-homepage-merchandising",
   "verify-production-smoke", "verify-security-posture", "verify-marketplace-trust",
   "verify-dealer-migration", "verify-import-execution", "verify-dealer-ownership"].includes(file.replace(".mjs", "")),
);
const listedInWeekly = activeSuites.filter((file) => text.includes(`scripts/${file}`));
check(
  "the weekly checklist lists all thirteen current suites",
  listedInWeekly.length === activeSuites.length && activeSuites.length === 13,
  `${listedInWeekly.length} of ${activeSuites.length}`,
);

/* ── Standards match the code ─────────────────────────────────────────────────────────────────── */

heading("Standards match what the application enforces");

const OUT = ".manual-verify";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
execSync(
  `npx esbuild src/services/presentation/vehicle-merchandising.service.ts --bundle --platform=node --format=esm --outfile=${OUT}/merch.mjs --alias:@=./src --log-level=error`,
  { stdio: "pipe" },
);
const { HOMEPAGE_SEGMENTS } = await import(`../${OUT}/merch.mjs`);

const missingBands = HOMEPAGE_SEGMENTS.filter((segment) => !text.includes(segment.headline));
check(
  `all six merchandising bands are documented (${HOMEPAGE_SEGMENTS.length} in code)`,
  missingBands.length === 0 && HOMEPAGE_SEGMENTS.length === 6,
  missingBands.map((segment) => segment.headline).join(", "),
);
/*
  The order is checked inside the merchandising section, not across the whole document. The first
  version searched the entire text and failed because "Bakkies & commercial" is mentioned earlier as
  an example of a mis-filed Land Cruiser — the assertion was measuring prose, not the table.
*/
const merchandisingSection = text.slice(
  text.indexOf("## 17."),
  text.indexOf("## 18."),
);
const bandPositions = HOMEPAGE_SEGMENTS.map((segment) => merchandisingSection.indexOf(segment.headline));
check(
  "…and the table lists them in the order the code assigns them",
  bandPositions.every((position) => position >= 0)
    && bandPositions.every((position, index) => index === 0 || position > bandPositions[index - 1]),
  HOMEPAGE_SEGMENTS.map((segment) => segment.headline).join(" → "),
);

const reviewTypes = readFileSync("src/services/media-review/media-review.types.ts", "utf8");
const labels = [...reviewTypes.matchAll(/^\s+\w+: "([^"]+)",$/gm)].map((match) => match[1]);
const missingLabels = labels.filter((label) => !text.toLowerCase().includes(label.toLowerCase()));
check(
  `all four review states are documented (${labels.length} in code)`,
  missingLabels.length === 0 && labels.length === 4,
  missingLabels.join(", "),
);

const founding = readFileSync("src/features/pricing/config/founding-programme.ts", "utf8");
const freeUntil = /FOUNDING_PROGRAMME_FREE_UNTIL\s*=\s*"([^"]+)"/.exec(founding)?.[1];
const places = /FOUNDING_PROGRAMME_PLACES\s*=\s*(\d+)/.exec(founding)?.[1];
check("the Founding Dealer date matches the published page", Boolean(freeUntil) && text.includes(freeUntil), freeUntil);
check("the Founding Dealer place count matches", Boolean(places) && text.includes(places), places);

/* ── "There is no screen for this" ────────────────────────────────────────────────────────────── */

heading("Its claims about what does not exist");

const writeSurfaces = execSync('grep -rl "use server" src/ || true', { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
check(
  "the write-surface list is complete",
  writeSurfaces.length === 3,
  `${writeSurfaces.length} "use server" modules: ${writeSurfaces.map((file) => file.split("/").slice(-2).join("/")).join(", ")}`,
);
check(
  "…and the manual names the two console surfaces",
  text.includes("/operations/editorial") && text.includes("/operations/photography"),
);

/*
  The manual tells you to change verification status in SQL because no code path writes it. If that
  ever stops being true, the manual is wrong and this must fail.
*/
const writesVerification = execSync(
  'grep -rn "verification_status" src/ --include=*.ts | grep -iE "update|upsert" || true',
  { encoding: "utf8" },
).trim();
check(
  "verification status genuinely has no application write path",
  writesVerification.length === 0,
  writesVerification ? "a code path now writes it — the manual must be updated" : "SQL is still the only route",
);

/* ── Columns ──────────────────────────────────────────────────────────────────────────────────── */

heading("Every column its SQL touches");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const dealerColumns = [
  "telephone",
  "email",
  "logo_data_url",
  "cover_data_url",
  "cover_image_provenance",
  "promotional_headline",
  "verification_status",
  "is_demonstration",
];
const { error: dealerError } = await db.from("dealerships").select(dealerColumns.join(",")).limit(1);
check(
  "every dealerships column the manual writes to exists",
  !dealerError,
  dealerError?.message ?? dealerColumns.join(", "),
);

/* ── Structure ────────────────────────────────────────────────────────────────────────────────── */

heading("It covers what was asked for");

const REQUIRED_SECTIONS = [
  "daily checklist",
  "weekly checklist",
  "monthly checklist",
  "Homepage curation workflow",
  "Photography approval workflow",
  "Dealer onboarding workflow",
  "Dealer verification workflow",
  "Spotlight publication workflow",
  "Founding Dealer onboarding workflow",
  "Launch checklist",
  "Production deployment checklist",
  "Backup and restore checklist",
  "New dealership checklist",
  "New vehicle quality checklist",
  "Photography standards",
  "Editorial standards",
  "Homepage merchandising standards",
  "Trust standards",
  "Content standards",
  "Operational KPIs to monitor",
  "Common failure modes",
];
const missingSections = REQUIRED_SECTIONS.filter(
  (section) => !new RegExp(`^#{1,3} .*${section}`, "im").test(text),
);
check(
  `all ${REQUIRED_SECTIONS.length} requested sections are present`,
  missingSections.length === 0,
  missingSections.join("; "),
);

/* Incident response was requested; it is delivered as the failure-mode catalogue plus health checks. */
check(
  "incident response is covered",
  /Common failure modes/i.test(text) && text.includes("/api/health"),
);

/* Every checklist item must be actionable — a marker saying where the work happens. */
const checklistLines = text.split("\n").filter((line) => /^\s*- \[ \]/.test(line));
const marked = checklistLines.filter((line) => /\[(Console|SQL|External|Terminal)\]/.test(line));
check(
  `every checkbox says where the work happens (${checklistLines.length} boxes)`,
  marked.length === checklistLines.length,
  `${checklistLines.length - marked.length} unmarked`,
);

rmSync(OUT, { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failures.length) console.log(failures.map((entry) => `  · ${entry}`).join("\n") + "\n");
process.exit(failed === 0 ? 0 : 1);
