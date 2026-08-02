/**
 * The complete journey, walked as a customer, a dealer and the founder.
 *
 * WHAT THIS IS FOR
 * ================
 * PCP-038 changed column privileges on the two busiest public tables. A privilege change is exactly
 * the kind of edit that passes every unit check and breaks a page nobody thought to open, so this
 * walks the real surfaces and asserts they render — not that they return 200, but that they contain
 * what they are supposed to contain.
 *
 * A 200 is not evidence. `/vehicle/<anything>` returns 200 with a "Vehicle Not Found" body, which is
 * how an earlier audit pass briefly recorded six draft vehicles as publicly served. Every check here
 * looks at the body.
 *
 *   npm run dev
 *   node scripts/verify-production-smoke.mjs
 */
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}
const APP = process.env.APP_URL ?? "http://localhost:3003";
const DB = env.NEXT_PUBLIC_SUPABASE_URL;
const sh = { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` };

let passed = 0;
let failed = 0;
const check = (label, ok, detail = "") => {
  if (ok) { passed += 1; console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`); }
  else { failed += 1; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`); }
};

/** A page that rendered: real status, no framework error, no empty shell. */
async function page(path, { expect = [], reject = [], minBytes = 5000 } = {}) {
  const r = await fetch(`${APP}${path}`, { redirect: "manual" });
  const body = r.status >= 300 && r.status < 400 ? "" : await r.text();
  return {
    status: r.status,
    location: r.headers.get("location"),
    body,
    ok: r.status === 200
      && body.length >= minBytes
      && !/Application error|Internal Server Error|Unhandled Runtime Error/i.test(body)
      && expect.every((t) => body.includes(t))
      && !reject.some((t) => body.includes(t)),
  };
}

console.log("\nProduction smoke test (PCP-039)\n───────────────────────────────");

/* ── The customer journey ─────────────────────────────────────────────────────────────────────── */
console.log("\nCustomer journey");

const home = await page("/");
check("homepage renders", home.ok, `HTTP ${home.status}, ${home.body.length} bytes`);

const search = await page("/search");
const slugs = [...new Set([...search.body.matchAll(/\/vehicle\/([a-z0-9-]+)/g)].map((m) => m[1]))];
check("marketplace renders with stock", search.ok && slugs.length > 0, `${slugs.length} vehicle cards`);

const vehicle = await page(`/vehicle/${slugs[0]}`, { reject: ["Vehicle Not Found"] });
check("vehicle detail renders the vehicle", vehicle.ok, slugs[0]?.slice(0, 44));
check(
  "vehicle page offers a way to enquire",
  /enquir|Enquir|contact the dealer|Contact/i.test(vehicle.body),
);

/* The dealer profile route is discovered from the page rather than guessed — guessing a slug is how
   an earlier pass mistook a not-found body for a leak. */
const dealerHref = vehicle.body.match(/href="(\/dealer(?:ship)?s?\/[a-z0-9-]+)"/)?.[1];
if (dealerHref) {
  const dealer = await page(dealerHref, { reject: ["Not Found"] });
  check("dealer profile renders", dealer.ok, dealerHref);
} else {
  check("dealer profile link present on a vehicle page", false, "no dealer link found in the page");
}

const enquiry = await fetch(`${APP}/api/v1/marketplace/enquiries`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({}),
});
check(
  "enquiry endpoint validates rather than accepting anything",
  enquiry.status >= 400 && enquiry.status < 500,
  `HTTP ${enquiry.status}`,
);

/* ── Guarded surfaces ─────────────────────────────────────────────────────────────────────────── */
console.log("\nGuarded surfaces (unauthenticated)");
for (const [path, label] of [
  ["/dealer/dashboard", "dealer dashboard"],
  ["/dealer/inventory", "dealer inventory"],
  ["/dealer/inventory/import", "dealer import wizard"],
  ["/dealer/team", "dealer team"],
  ["/dealer/profile", "dealer profile"],
  ["/dealer/branches", "dealer branches"],
  ["/dealer/claim", "claim dealership"],
  ["/operations", "operations centre"],
  ["/operations/quality", "quality centre"],
  ["/operations/verification", "verification workspace"],
  ["/operations/onboarding", "onboarding centre"],
  ["/operations/editorial", "editorial console"],
  ["/buyer", "buyer account"],
]) {
  const r = await page(path);
  const guarded = [301, 302, 307, 308, 401, 403].includes(r.status);
  check(`${label} is guarded`, guarded || r.status === 404, `HTTP ${r.status}`);
}

/* ── Founder and dealer read paths still work after the privilege change ──────────────────────── */
console.log("\nService-role read paths (PCP-038 privilege change must not have broken these)");

const svc = async (label, path, min = 1) => {
  const r = await fetch(`${DB}/rest/v1/${path}`, { headers: sh });
  const rows = r.ok ? await r.json() : null;
  check(label, r.ok && Array.isArray(rows) && rows.length >= min, r.ok ? `${rows?.length} rows` : `HTTP ${r.status}`);
};

await svc("dealerships readable with every column (founder consoles)", "dealerships?select=*&limit=3", 3);
await svc("inventory readable with every column (dealer portal)", "inventory_vehicles?select=*&limit=3", 3);
await svc("owner_user_id still readable by the service role", "dealerships?select=id,owner_user_id&limit=3", 3);
await svc("lead_count_30d still readable by the service role", "inventory_vehicles?select=id,lead_count_30d&limit=3", 3);
await svc("provenance readable (quality centre)", "dealership_field_provenance?select=*&limit=3", 3);
await svc("staff memberships readable (verification/onboarding)", "dealership_staff_memberships?select=*&limit=3", 3);
await svc("leads readable (dealer CRM)", "leads?select=*&limit=3", 3);

/* ── No dead controls on the pages a customer actually sees ───────────────────────────────────── */
console.log("\nNo dead controls or placeholder wording on customer-facing pages");
for (const [label, body] of [["homepage", home.body], ["marketplace", search.body], ["vehicle detail", vehicle.body]]) {
  check(`${label} has no "coming soon" wording`, !/coming\s+soon/i.test(body));
  check(`${label} has no disabled control`, !/\sdisabled(?:=["']?(?:true|disabled)["']?)?[\s>]/i.test(body));
  check(`${label} has no lorem/placeholder copy`, !/lorem ipsum|TBC|TODO/i.test(body));
}

/* ── Infrastructure endpoints ─────────────────────────────────────────────────────────────────── */
console.log("\nInfrastructure endpoints");
/*
  200 when everything is configured, 503 when it is not — both are the endpoint working. Asserting
  `ok` here would fail any correctly-configured local build, because NEXT_PUBLIC_APP_URL is baked in
  at build time and a local build carries localhost, which the validator rightly calls an error in a
  production build. What is asserted is that it answers, and that it names what is wrong.
*/
const health = await fetch(`${APP}/api/health`);
const healthBody = await health.json().catch(() => null);
check("health endpoint responds", health.status === 200 || health.status === 503, `HTTP ${health.status}`);
check("health reports migration state", Boolean(healthBody?.expectedMigrationVersion));
check(
  "health finds every required table",
  healthBody?.checks?.some((c) => c.name === "database" && c.status === "healthy"),
  healthBody?.checks?.find((c) => c.name === "database")?.detail ?? "",
);
check(
  "health finds storage and auth",
  ["storage", "auth"].every((n) => healthBody?.checks?.some((c) => c.name === n && c.status === "healthy")),
);
if (health.status === 503) {
  const issues = healthBody?.checks?.find((c) => c.name === "configuration")?.meta?.issues ?? [];
  console.log(`        (unhealthy for configuration only: ${issues.map((i) => i.variable).join(", ") || "unknown"})`);
}

const robots = await fetch(`${APP}/robots.txt`);
const robotsBody = robots.ok ? await robots.text() : "";
check("robots.txt served", robots.ok, `HTTP ${robots.status}`);
check("robots.txt disallows the guarded areas", ["/dealer/", "/operations/", "/api/"].every((p) => robotsBody.includes(p)));
check("robots.txt points at the sitemap", /Sitemap:\s*\S+/i.test(robotsBody));

const sitemap = await fetch(`${APP}/sitemap.xml`);
const sitemapBody = sitemap.ok ? await sitemap.text() : "";
const locs = [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const sitemapVehicles = locs.filter((u) => u.includes("/vehicle/"));
check("sitemap.xml served", sitemap.ok, `${locs.length} urls`);

/* The sitemap is a public document. If it names a listing the marketplace does not show, it has
   disclosed it — so the count must match the published count exactly, not merely be close. */
const publishedCount = await fetch(`${DB}/rest/v1/inventory_vehicles?select=id&lifecycle_status=eq.published&limit=1`, {
  headers: { ...sh, Prefer: "count=exact" },
}).then((r) => Number(r.headers.get("content-range")?.split("/")[1] ?? -1));
check(
  "sitemap lists exactly the published vehicles — no more, no fewer",
  sitemapVehicles.length === publishedCount,
  `${sitemapVehicles.length} in sitemap vs ${publishedCount} published`,
);
check("sitemap never names a guarded path", !locs.some((u) => /\/(dealer|operations|buyer|auth|api)\//.test(u)));

/* A sitemap full of 404s is worse than no sitemap. Sampled rather than exhaustive — the point is to
   catch a slug builder that has drifted, and a drifted builder fails on all of them, not one. */
let resolved = 0;
for (const url of sitemapVehicles.slice(0, 5)) {
  const body = await fetch(`${APP}${new URL(url).pathname}`).then((r) => r.text());
  if (!/Vehicle Not Found/i.test(body)) resolved += 1;
}
check("sampled sitemap vehicle urls resolve", resolved === Math.min(5, sitemapVehicles.length), `${resolved}/5`);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
