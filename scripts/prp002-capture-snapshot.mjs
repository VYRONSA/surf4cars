/**
 * Capture one marketplace quality snapshot.
 *
 * Writes a run header plus every observation in it. Designed to be run on a schedule — history that depends
 * on somebody remembering to take it is not history.
 *
 * WHAT IT RECORDS AND WHY
 * =======================
 * Marketplace-level integrity and completeness, per-dealer health, and the listing readiness distribution.
 * All of it comes from the same engines the consoles render, so the series and the screen can never
 * disagree.
 *
 * Each run stores the rule-set fingerprint. Two runs are comparable only when their fingerprints match;
 * `--history` marks a change of fingerprint as a break rather than a movement, because a completeness score
 * that fell when a rule was added did not describe the marketplace getting worse.
 *
 * IDEMPOTENCY
 * ===========
 * A snapshot is identified by the *period* it describes, not the instant it was taken. Running twice in the
 * same period is a no-op — not an update, which the database now forbids outright. That is what makes this
 * safe to schedule: a retry after a timeout, an overlapping worker, or an operator running it again all
 * converge on one row rather than manufacturing a second "state of the marketplace" seconds after the first.
 *
 * Usage:
 *   node scripts/prp002-capture-snapshot.mjs [--trigger cron] [--period daily] [--notes "..."]
 *   node scripts/prp002-capture-snapshot.mjs --history        show the series, with discontinuities marked
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { assembleQualityReport, ruleSetFingerprint, ENGINE_VERSION } from "../src/services/quality/quality.rules.ts";
import { buildDealerReadiness, resolveListingStage } from "../src/services/quality/dealer-readiness.ts";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const showHistory = args.includes("--history");

const env = {};
for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch { /* absent file is fine */ }
}

const base = String(env.SUPABASE_REST_URL || `${env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/rest/v1`).replace(/\/$/, "");
const key = env.SUPABASE_SECRET_KEY;
if (!base || !key) {
  console.error("SUPABASE_REST_URL / SUPABASE_SECRET_KEY missing.");
  process.exitCode = 1;
  throw new Error("missing credentials");
}
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const get = async (path) => {
  const r = await fetch(`${base}/${path}`, { headers });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${await r.text()}`);
  return r.json();
};

/* ── History view ─────────────────────────────────────────────────────────────────────────────────── */
if (showHistory) {
  const runs = await get("quality_snapshot_runs?select=*&order=captured_at.asc&limit=200");
  if (runs.length === 0) {
    console.log("No snapshots captured yet.");
  } else {
    const ids = runs.map((r) => `"${r.id}"`).join(",");
    const marketplace = await get(
      `quality_observations?select=run_id,metric,value&subject_kind=eq.marketplace&run_id=in.(${ids})`,
    );
    const byRun = new Map();
    for (const o of marketplace) {
      if (!byRun.has(o.run_id)) byRun.set(o.run_id, {});
      byRun.get(o.run_id)[o.metric] = Number(o.value);
    }

    /*
      Standard 3: never fabricate a trend.

      A single snapshot, or a set whose rule-set fingerprints differ, cannot support a delta. Saying so is the
      honest output; drawing a line through one point, or across a rules change, is the same class of error as
      the stock photography was — plausible, and believed.
    */
    const currentRules = runs.at(-1).rule_set_fingerprint;
    const comparable = runs.filter((r) => r.rule_set_fingerprint === currentRules);
    if (comparable.length < 2) {
      console.log(
        `
Trend unavailable — additional history required. ${comparable.length} snapshot(s) share the ` +
          `current rule set (${currentRules}); at least 2 are needed to state a change.`,
      );
      console.log("No value is interpolated or estimated to fill the gap.");
    }

    console.log("\ncaptured            integrity  completeness  dealers  listings  rules");
    let previousFingerprint = null;
    for (const run of runs) {
      if (previousFingerprint && run.rule_set_fingerprint !== previousFingerprint) {
        /* A break, not a movement. Reporting the delta across this line would be arithmetic on two
           different definitions of the same word. */
        console.log("  ── rule set changed — values above and below are not comparable ──");
      }
      previousFingerprint = run.rule_set_fingerprint;
      const m = byRun.get(run.id) ?? {};
      console.log(
        `${new Date(run.captured_at).toISOString().slice(0, 16).replace("T", " ")}` +
          `${String(m.integrity_score ?? "—").padStart(11)}` +
          `${String(m.completeness_score ?? "—").padStart(14)}` +
          `${String(run.dealers_audited).padStart(9)}` +
          `${String(run.listings_audited).padStart(10)}` +
          `  ${run.rule_set_fingerprint}`,
      );
    }
    console.log();
  }
  process.exit(0);
}

/* ── Capture ──────────────────────────────────────────────────────────────────────────────────────── */
const [dealers, vehicles, media, equipment, provenance, staff] = await Promise.all([
  get("dealerships?select=id,business_name,trading_name,city,province,postal_code,physical_address,telephone,whatsapp,email,website,registration_number,vat_number,onboarding_status,is_demonstration&limit=1000"),
  get("inventory_vehicles?select=id,dealership_id,title,make,model,year,mileage_km,description,lifecycle_status&limit=3000"),
  get("inventory_vehicle_media?select=vehicle_id,file_url,provenance&limit=10000"),
  get("vehicle_equipment?select=vehicle_id&limit=10000"),
  get("dealership_field_provenance?select=dealership_id,field,provenance&limit=5000"),
  get("dealership_staff_memberships?select=dealership_id&limit=5000"),
]);

const capturedAt = new Date().toISOString();
const report = assembleQualityReport({ dealers, vehicles, media, equipment, generatedAt: capturedAt });

const tally = (rows, key) => rows.reduce((m, r) => m.set(r[key], (m.get(r[key]) ?? 0) + 1), new Map());
const publishable = new Map();
for (const row of provenance) {
  if (row.provenance !== "dealer" && row.provenance !== "verified") continue;
  if (!publishable.has(row.dealership_id)) publishable.set(row.dealership_id, new Set());
  publishable.get(row.dealership_id).add(row.field);
}
const staffCounts = tally(staff, "dealership_id");
const equipmentCounts = tally(equipment, "vehicle_id");
const photoCounts = tally(media, "vehicle_id");
const dealerPhotographed = new Set(media.filter((r) => r.provenance === "dealer").map((r) => r.vehicle_id));

const byDealer = new Map();
for (const v of vehicles) {
  if (!byDealer.has(v.dealership_id)) byDealer.set(v.dealership_id, []);
  byDealer.get(v.dealership_id).push(v);
}

const readiness = dealers.map((d) => {
  const theirs = byDealer.get(d.id) ?? [];
  return buildDealerReadiness({
    id: d.id,
    name: (d.trading_name ?? d.business_name ?? d.id).trim(),
    isDemonstration: d.is_demonstration === true,
    onboardingStatus: d.onboarding_status,
    telephone: d.telephone, whatsapp: d.whatsapp, email: d.email,
    registrationNumber: d.registration_number, vatNumber: d.vat_number,
    publishableFields: publishable.get(d.id) ?? new Set(),
    staffCount: staffCounts.get(d.id) ?? 0,
    vehicleCount: theirs.length,
    publishedCount: theirs.filter((v) => v.lifecycle_status === "published").length,
    listingsWithDealerPhotography: theirs.filter((v) => dealerPhotographed.has(v.id)).length,
    listingsWithEquipment: theirs.filter((v) => (equipmentCounts.get(v.id) ?? 0) > 0).length,
  });
});
const productionReadiness = readiness.filter((r) => !r.isDemonstration);

const stages = new Map();
for (const v of vehicles) {
  const stage = resolveListingStage({
    lifecycleStatus: v.lifecycle_status,
    hasDealerPhotography: dealerPhotographed.has(v.id),
    photographCount: photoCounts.get(v.id) ?? 0,
    equipmentCount: equipmentCounts.get(v.id) ?? 0,
    descriptionLength: String(v.description ?? "").length,
  });
  stages.set(stage, (stages.get(stage) ?? 0) + 1);
}

const period = flag("period", "daily");
/* The period this snapshot describes. Hourly buckets to the hour, weekly to the ISO week's Monday. */
const periodKey =
  period === "hourly"
    ? capturedAt.slice(0, 13)
    : period === "weekly"
      ? (() => {
          const d = new Date(capturedAt);
          d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
          return d.toISOString().slice(0, 10);
        })()
      : capturedAt.slice(0, 10);

const runId = `snap-${period}-${periodKey}`;

/* Recorded, never derived later. A snapshot that cannot say what produced it is a number without a witness —
   and the commit usually explains a movement better than the rules hash does, because it says what else
   shipped that day. */
const gitCommit = (() => {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
})();
const appVersion = (() => {
  try {
    return JSON.parse(readFileSync("package.json", "utf8")).version ?? null;
  } catch {
    return null;
  }
})();
const published = vehicles.filter((v) => v.lifecycle_status === "published");

const observations = [
  ["marketplace", "*", "integrity_score", report.integrityScore],
  ["marketplace", "*", "completeness_score", report.completenessScore],
  ["marketplace", "*", "dealers_production", report.dealersAudited],
  ["marketplace", "*", "listings_published", published.length],
  ["marketplace", "*", "listings_with_dealer_photography", published.filter((v) => dealerPhotographed.has(v.id)).length],
  ["marketplace", "*", "listings_with_equipment", published.filter((v) => (equipmentCounts.get(v.id) ?? 0) > 0).length],
  ["marketplace", "*", "dealers_contactable", dealers.filter((d) => d.is_demonstration !== true && (d.telephone || d.whatsapp || d.email)).length],
  ["marketplace", "*", "dealers_verified_identity", dealers.filter((d) => d.is_demonstration !== true && (d.registration_number || d.vat_number)).length],
  ["marketplace", "*", "average_dealer_health", productionReadiness.length ? Math.round(productionReadiness.reduce((t, r) => t + r.healthScore, 0) / productionReadiness.length) : 0],
  ["marketplace", "*", "findings_total", report.findings.length],
  ...[...stages.entries()].map(([stage, count]) => ["marketplace", "*", `stage:${stage}`, count]),
  ...productionReadiness.map((r) => ["dealer", r.dealershipId, "health_score", r.healthScore]),
  ...productionReadiness.map((r) => ["dealer", r.dealershipId, "steps_complete", r.completedSteps]),
];

/* `resolution=ignore-duplicates` is the idempotency. A repeat within the period inserts nothing and the
   response is empty — success, not failure. Scheduled jobs must be able to run twice without consequence. */
/* `on_conflict` must name the unique index explicitly. Without it PostgREST targets the primary key, the
   insert 409s, and a nightly job exits non-zero every day after the first — turning the failure log this
   programme asked for into noise nobody reads. */
const runResponse = await fetch(`${base}/quality_snapshot_runs?on_conflict=period,period_key`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=representation,resolution=ignore-duplicates" },
  body: JSON.stringify({
    id: runId,
    captured_at: capturedAt,
    engine_version: ENGINE_VERSION,
    rule_set_fingerprint: ruleSetFingerprint(),
    app_version: appVersion,
    git_commit: gitCommit,
    period,
    period_key: periodKey,
    dealers_audited: report.dealersAudited,
    listings_audited: report.vehiclesAudited,
    demonstration_dealers: report.demonstrationDealers,
    trigger: flag("trigger", "manual"),
    notes: flag("notes", null),
  }),
});

if (!runResponse.ok) {
  /* Logged with enough detail to diagnose from a scheduler's output alone: a cron failure nobody can read is
     a gap in the history that appears as a flat line rather than as an error. */
  console.error(`[capture] run insert failed → HTTP ${runResponse.status}`);
  console.error(`[capture] period=${period} key=${periodKey} rules=${ruleSetFingerprint()} commit=${gitCommit ?? "unknown"}`);
  console.error(`[capture] ${await runResponse.text()}`);
  process.exitCode = 1;
  throw new Error("run insert failed");
}

const inserted = await runResponse.json();
if (Array.isArray(inserted) && inserted.length === 0) {
  console.log(`[capture] ${period} snapshot for ${periodKey} already exists — nothing written.`);
  console.log("[capture] Identity is the period, not the instant, so repeat runs are a no-op by design.");
  process.exit(0);
}

/* Chunked: a single insert of several hundred observations is fine, but this grows with the dealer network
   and a request that silently truncates would corrupt a snapshot rather than fail it. */
const rows = observations.map(([subject_kind, subject_id, metric, value]) => ({
  run_id: runId, subject_kind, subject_id, metric, value,
}));
for (let i = 0; i < rows.length; i += 500) {
  const chunk = rows.slice(i, i + 500);
  const r = await fetch(`${base}/quality_observations`, {
    method: "POST",
    headers,
    body: JSON.stringify(chunk),
  });
  if (!r.ok) {
    console.error(`observation insert failed → ${r.status}: ${await r.text()}`);
    process.exitCode = 1;
    throw new Error("observation insert failed");
  }
}

console.log(`Captured ${runId}`);
console.log(`  rule set        ${ruleSetFingerprint()}  (engine ${ENGINE_VERSION})`);
console.log(`  integrity       ${report.integrityScore}/100`);
console.log(`  completeness    ${report.completenessScore}/100`);
console.log(`  dealer health   ${observations.find((o) => o[2] === "average_dealer_health")?.[3]}/100 average`);
console.log(`  observations    ${rows.length}`);
