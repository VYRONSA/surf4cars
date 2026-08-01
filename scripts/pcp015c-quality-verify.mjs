/**
 * Founder Quality Centre — command-line run.
 *
 * Calls the same `assembleQualityReport` the page calls, so the two cannot disagree. The Quality Centre sits
 * behind operations portal auth, and a quality engine that can only be seen through a logged-in browser is
 * one that quietly stops being looked at. This gives the Founder the same answer from a terminal, and gives
 * CI something to fail on.
 *
 * Reads records from Supabase directly rather than through the application, matching the module's own
 * reasoning: presentation rules are a safety net over defects that still exist in the record.
 *
 * Usage:
 *   node scripts/pcp015c-quality-verify.mjs [--json] [--limit 2000]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { assembleQualityReport } from "../src/services/quality/quality.rules.ts";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const limit = Number(args[args.indexOf("--limit") + 1]) || 2000;

const env = {};
for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match && !(match[1] in env)) env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    /* absent file is fine */
  }
}

const base = String(env.SUPABASE_REST_URL || `${env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/rest/v1`).replace(/\/$/, "");
const key = env.SUPABASE_SECRET_KEY;

if (!base || !key) {
  console.error("SUPABASE_REST_URL / SUPABASE_SECRET_KEY missing — cannot audit records.");
  process.exitCode = 1;
  throw new Error("missing Supabase credentials");
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function fetchAll(path) {
  const response = await fetch(`${base}/${path}`, { headers });
  if (!response.ok) {
    throw new Error(`${path} → HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

const [dealers, vehicles, media, equipment] = await Promise.all([
  fetchAll(
    "dealerships?select=id,business_name,trading_name,city,province,postal_code,physical_address,telephone,whatsapp,email,website,registration_number,vat_number,onboarding_status,is_demonstration&limit=1000",
  ),
  fetchAll(
    `inventory_vehicles?select=id,dealership_id,title,make,model,year,mileage_km,description,lifecycle_status&limit=${limit}`,
  ),
  fetchAll("inventory_vehicle_media?select=vehicle_id,file_url&limit=10000"),
  fetchAll("vehicle_equipment?select=vehicle_id&limit=10000"),
]);

/* The clock is injected rather than read inside the engine, so the same inputs always produce the same
   report — which is what makes two runs comparable. */
const report = assembleQualityReport({
  dealers,
  vehicles,
  media,
  equipment,
  generatedAt: new Date().toISOString(),
});

if (asJson) {
  mkdirSync(join("docs", "reports"), { recursive: true });
  const path = join("docs", "reports", "quality-centre.json");
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Written to ${path}`);
} else {
  console.log(`\nSURF4CARS Quality Centre — ${report.dealersAudited} dealerships, ${report.vehiclesAudited} vehicles`);
  console.log(`Platform integrity       ${String(report.integrityScore).padStart(3)}/100   is the platform honest`);
  console.log(`Marketplace completeness ${String(report.completenessScore).padStart(3)}/100   is it commercially ready`);
  console.log(`(${report.demonstrationDealers} demonstration dealership(s) excluded)
`);

  console.log("area".padEnd(24) + "critical".padStart(9) + "high".padStart(7) + "medium".padStart(8) + "total".padStart(7));
  for (const row of report.categories) {
    console.log(
      row.label.padEnd(24) +
        String(row.critical).padStart(9) +
        String(row.high).padStart(7) +
        String(row.medium).padStart(8) +
        String(row.total).padStart(7),
    );
  }

  const counts = { critical: 0, high: 0, medium: 0 };
  for (const item of report.findings) counts[item.severity] += 1;
  console.log(
    `\n${report.findings.length} production finding(s): ` +
      `${counts.critical} critical, ${counts.high} high, ${counts.medium} medium.`,
  );
  console.log(`${report.demonstrationFindings.length} finding(s) on demonstration records (not scored).\n`);

  console.log("Fix these next — grouped by cause, ordered by severity x reach:");
  for (const action of report.nextActions) {
    console.log(`
  [${action.severity}/${action.dimension}] ${action.affected} record(s) — ${action.problem}`);
    console.log(`      fix: ${action.remedy}`);
    const names = action.examples.map((subject) => subject.name).join(", ");
    const more = action.affected - action.examples.length;
    console.log(`      e.g. ${names}${more > 0 ? ` and ${more} more` : ""}`);
  }
}

if (report.incomplete) {
  console.error(`\nINCOMPLETE: ${report.incomplete}`);
  process.exitCode = 1;
}
