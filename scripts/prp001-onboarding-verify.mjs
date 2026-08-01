/**
 * Dealer Onboarding Centre — command-line run.
 *
 * Same model the console renders, callable without an operations login. See
 * `scripts/pcp015c-quality-verify.mjs` for why every quality surface has one of these.
 *
 * Usage: node scripts/prp001-onboarding-verify.mjs [--limit 20]
 */
import { readFileSync } from "node:fs";

import { buildDealerReadiness, resolveListingStage, LISTING_STAGE_LABELS } from "../src/services/quality/dealer-readiness.ts";

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf("--limit") + 1]) || 15;

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
const headers = { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` };
const get = async (path) => {
  const r = await fetch(`${base}/${path}`, { headers });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${await r.text()}`);
  return r.json();
};

const [dealers, provenance, staff, vehicles, media, equipment] = await Promise.all([
  get("dealerships?select=id,business_name,trading_name,onboarding_status,telephone,whatsapp,email,registration_number,vat_number,is_demonstration&limit=1000"),
  get("dealership_field_provenance?select=dealership_id,field,provenance&limit=5000"),
  get("dealership_staff_memberships?select=dealership_id&limit=5000"),
  get("inventory_vehicles?select=id,dealership_id,lifecycle_status,description&limit=3000"),
  get("inventory_vehicle_media?select=vehicle_id,provenance&limit=10000"),
  get("vehicle_equipment?select=vehicle_id&limit=10000"),
]);

const publishableByDealer = new Map();
for (const row of provenance) {
  if (row.provenance !== "dealer" && row.provenance !== "verified") continue;
  if (!publishableByDealer.has(row.dealership_id)) publishableByDealer.set(row.dealership_id, new Set());
  publishableByDealer.get(row.dealership_id).add(row.field);
}

const count = (rows, key) => rows.reduce((m, r) => m.set(r[key], (m.get(r[key]) ?? 0) + 1), new Map());
const staffByDealer = count(staff, "dealership_id");
const equipmentByVehicle = count(equipment, "vehicle_id");

const dealerPhotoVehicles = new Set(media.filter((r) => r.provenance === "dealer").map((r) => r.vehicle_id));
const photoCountByVehicle = count(media, "vehicle_id");

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
    publishableFields: publishableByDealer.get(d.id) ?? new Set(),
    staffCount: staffByDealer.get(d.id) ?? 0,
    vehicleCount: theirs.length,
    publishedCount: theirs.filter((v) => v.lifecycle_status === "published").length,
    listingsWithDealerPhotography: theirs.filter((v) => dealerPhotoVehicles.has(v.id)).length,
    listingsWithEquipment: theirs.filter((v) => (equipmentByVehicle.get(v.id) ?? 0) > 0).length,
  });
});

const production = readiness.filter((r) => !r.isDemonstration);
const average = Math.round(production.reduce((t, r) => t + r.healthScore, 0) / (production.length || 1));

console.log(`\nSURF4CARS Dealer Onboarding Centre — ${production.length} production dealerships`);
console.log(`Average dealer health ${average}/100\n`);

const blocked = new Map();
for (const r of production) {
  if (!r.nextStep) continue;
  const key = `${r.nextStep.id}|${r.nextStep.owner}|${r.nextStep.label}`;
  blocked.set(key, (blocked.get(key) ?? 0) + 1);
}
console.log("Dealerships blocked on each next step:");
for (const [key, n] of [...blocked.entries()].sort((a, b) => b[1] - a[1])) {
  const [, owner, label] = key.split("|");
  console.log(`  ${String(n).padStart(4)}  ${label.padEnd(28)} owner: ${owner}`);
}

const stages = new Map();
for (const v of vehicles) {
  const stage = resolveListingStage({
    lifecycleStatus: v.lifecycle_status,
    hasDealerPhotography: dealerPhotoVehicles.has(v.id),
    photographCount: photoCountByVehicle.get(v.id) ?? 0,
    equipmentCount: equipmentByVehicle.get(v.id) ?? 0,
    descriptionLength: String(v.description ?? "").length,
  });
  stages.set(stage, (stages.get(stage) ?? 0) + 1);
}
console.log("\nInventory readiness pipeline:");
for (const [stage, label] of Object.entries(LISTING_STAGE_LABELS)) {
  if (stages.get(stage)) console.log(`  ${String(stages.get(stage)).padStart(4)}  ${label}`);
}

console.log("\nLowest health, production only:");
for (const r of [...production].sort((a, b) => a.healthScore - b.healthScore).slice(0, limit)) {
  console.log(`  ${String(r.healthScore).padStart(3)}/100  ${r.name.padEnd(30)} ${r.completedSteps}/${r.totalSteps} steps  next: ${r.nextStep?.label ?? "—"}`);
}
