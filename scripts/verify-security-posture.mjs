/**
 * The security invariants PCP-038 established, asserted so they cannot quietly regress.
 *
 * WHY THESE AND NOT A SCANNER
 * ===========================
 * Every check here corresponds to something the audit actually found or actually proved. A generic
 * scanner would report a hundred maybes; this reports the handful of things that were true, false,
 * or fixed on a specific day, and it fails if any of them changes.
 *
 * Requires the dev server for the HTTP checks:
 *   npm run dev
 *   node scripts/verify-security-posture.mjs
 */
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
}
const DB = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SECRET = env.SUPABASE_SECRET_KEY;
const APP = process.env.APP_URL ?? "http://localhost:3003";
const ah = { apikey: ANON, Authorization: `Bearer ${ANON}` };
const sh = { apikey: SECRET, Authorization: `Bearer ${SECRET}` };

let passed = 0;
let failed = 0;
const check = (label, ok, detail = "") => {
  if (ok) { passed += 1; console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`); }
  else { failed += 1; console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`); }
};
/**
 * How many rows this key can actually read from the table.
 *
 * Not `select=id`: several of these tables have no `id` column (`rate_limit_windows` is keyed on the
 * window, `buyer_profiles` on the buyer), and asking for one returns 400 — which an earlier version
 * of this script scored as a failure. A 4xx of any kind means the caller got nothing, which is the
 * property being asserted, so it counts as zero rather than as an error.
 */
const readableRows = async (table, key) => {
  const r = await fetch(`${DB}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
  });
  if (!r.ok) return 0;
  return Number(r.headers.get("content-range")?.split("/")[1] ?? 0);
};

console.log("\nSecurity posture (PCP-038)\n──────────────────────────");

console.log("\nAnonymous reads — tenant data must be invisible");
for (const table of [
  "leads", "lead_timeline", "buyer_profiles", "buyer_saved_vehicles", "buyer_saved_searches",
  "dealership_staff_memberships", "dealership_ownership_claims", "dealership_ownership_events",
  "vehicle_import_batches", "vehicle_import_rows", "enquiry_notifications",
  "inventory_vehicle_documents", "inventory_vehicle_audit", "inventory_vehicle_history",
  "market_analytics_events", "rate_limit_windows",
]) {
  check(`anon reads no rows from ${table}`, (await readableRows(table, ANON)) === 0);
}

console.log("\nAnonymous writes — all refused");
for (const table of ["dealerships", "inventory_vehicles", "leads", "dealership_ownership_claims", "buyer_profiles"]) {
  const r = await fetch(`${DB}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...ah, "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  check(`anon POST to ${table} refused`, r.status >= 400, `HTTP ${r.status}`);
}

console.log("\nColumn exposure — anon must not read these");
for (const [table, column] of [
  ["dealerships", "owner_user_id"],
  ["dealerships", "verification_note"],
  ["dealerships", "subscription_package"],
  ["inventory_vehicles", "lead_count_30d"],
  ["inventory_vehicles", "created_by"],
]) {
  const r = await fetch(`${DB}/rest/v1/${table}?select=${column}&limit=1`, { headers: ah });
  check(`anon cannot read ${table}.${column}`, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
}

console.log("\nColumn exposure — the public marketplace still works");
for (const [table, columns] of [
  ["dealerships", "id,business_name,city,telephone,website,verification_status"],
  ["inventory_vehicles", "id,title,make,model,year,asking_price_cents,description"],
]) {
  const r = await fetch(`${DB}/rest/v1/${table}?select=${columns}&limit=1`, { headers: ah });
  check(`anon can still read public ${table} columns`, r.ok, `HTTP ${r.status}`);
}

console.log("\nUnpublished stock is invisible to anon");
const anonVehicles = await fetch(`${DB}/rest/v1/inventory_vehicles?select=lifecycle_status&limit=1000`, { headers: ah }).then((r) => r.json());
check(
  "anon sees only published vehicles",
  Array.isArray(anonVehicles) && anonVehicles.every((v) => v.lifecycle_status === "published"),
  `${[...new Set((anonVehicles ?? []).map((v) => v.lifecycle_status))].join(",")}`,
);

/*
  Dealership enumeration — PCP-038's "M1", fixed in PCP-039.

  Both objects are checked, because closing one moves the leak rather than removing it: the view has
  no policies of its own and, before this was fixed, ran with its owner's privileges; the base table
  `verification_claims` returned the same 128 dealership ids to anon on a `using (true)` policy.
  A regression in either direction has to fail here.
*/
console.log("\nDealership enumeration is closed at both the view and its base table");
const anonVisibleDealerships = new Set(
  (await fetch(`${DB}/rest/v1/dealerships?select=id&limit=2000`, { headers: ah }).then((r) => (r.ok ? r.json() : []))).map(
    (d) => d.id,
  ),
);
for (const [label, query, idField] of [
  ["dealership_field_provenance (view)", "dealership_field_provenance?select=dealership_id&limit=2000", "dealership_id"],
  ["verification_claims (base table)", "verification_claims?select=subject_kind,subject_id&limit=2000", "subject_id"],
]) {
  const response = await fetch(`${DB}/rest/v1/${query}`, { headers: ah });
  const rows = response.ok ? await response.json() : [];
  const ids = new Set(rows.map((r) => r[idField]).filter(Boolean));
  const hidden = [...ids].filter((id) => !anonVisibleDealerships.has(id));
  check(
    `anon cannot enumerate hidden dealerships via ${label}`,
    hidden.length === 0,
    `${ids.size} ids visible, ${hidden.length} of them hidden`,
  );
}
/* The fix must not have closed it by breaking the read the public dealer profile depends on. */
const profileProbe = await fetch(
  `${DB}/rest/v1/dealership_field_provenance?select=field,provenance&dealership_id=eq.${[...anonVisibleDealerships][0]}`,
  { headers: ah },
);
check("the public dealer profile can still read provenance for a visible dealership", profileProbe.ok, `HTTP ${profileProbe.status}`);

console.log("\nData integrity");
const vehicles = await fetch(`${DB}/rest/v1/inventory_vehicles?select=id,dealership_id,branch_id&limit=1000`, { headers: sh }).then((r) => r.json());
const branches = await fetch(`${DB}/rest/v1/dealership_branches?select=id,dealership_id&limit=1000`, { headers: sh }).then((r) => r.json());
const branchOwner = new Map(branches.map((b) => [b.id, b.dealership_id]));
const crossTenant = vehicles.filter((v) => branchOwner.has(v.branch_id) && branchOwner.get(v.branch_id) !== v.dealership_id);
check("no vehicle sits on another dealership's branch", crossTenant.length === 0, `${crossTenant.length} found`);

const media = await fetch(`${DB}/rest/v1/inventory_vehicle_media?select=vehicle_id,dealership_id&limit=2000`, { headers: sh }).then((r) => r.json());
const vehicleOwner = new Map(vehicles.map((v) => [v.id, v.dealership_id]));
const crossMedia = media.filter((m) => vehicleOwner.has(m.vehicle_id) && vehicleOwner.get(m.vehicle_id) !== m.dealership_id);
check("no photograph is attributed to the wrong dealership", crossMedia.length === 0, `${crossMedia.length} found`);

console.log("\nHTTP surface (needs the dev server)");
let serverUp = true;
try {
  await fetch(`${APP}/api/health`);
} catch {
  serverUp = false;
  console.log("  SKIP  dev server not running — start it with `npm run dev` to run these");
}

if (serverUp) {
  for (const path of [
    "/api/v1/dealer/dashboard?dealershipId=s1-dealer-001",
    "/api/v1/dealer/leads?dealershipId=s1-dealer-001",
    "/api/v1/dealer/team?dealershipId=s1-dealer-001",
    "/api/v1/dealer/imports?dealershipId=s1-dealer-001",
    "/api/v1/dealer/ownership?dealershipId=s1-dealer-001",
    "/api/v1/operations/dashboard",
    "/api/v1/operations/ownership-claims",
  ]) {
    const r = await fetch(`${APP}${path}`);
    check(`unauthenticated ${path.split("?")[0]} refused`, r.status === 401 || r.status === 403, `HTTP ${r.status}`);
  }

  for (const path of ["/dealer/dashboard", "/dealer/inventory/import", "/operations", "/buyer"]) {
    const r = await fetch(`${APP}${path}`, { redirect: "manual" });
    check(`unauthenticated page ${path} is guarded`, [301, 302, 307, 308, 401, 403].includes(r.status), `HTTP ${r.status}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
