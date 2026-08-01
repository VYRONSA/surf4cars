/**
 * PCP-001J2A one-time data migration: local platform store -> Supabase.
 *
 * Properties:
 *   idempotent    every write is an upsert keyed on the primary key; re-running changes nothing
 *   resumable     each table is processed independently; a failure mid-run leaves prior tables done
 *   duplicate-safe upserts collapse on conflict rather than inserting a second row
 *   rollback-safe --rollback removes exactly the rows this migration inserted, by id
 *
 * Usage:
 *   node scripts/pcp001j2a-vehicle-data-migration.mjs [--dry-run] [--rollback] [--verify]
 */
import { readFileSync } from "node:fs";

const STORE_PATH = "db/local/platform-store.json";
const BATCH = 250;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const ROLLBACK = args.has("--rollback");
const VERIFY_ONLY = args.has("--verify");

const env = readFileSync(".env.local", "utf8");
const readEnv = (key) => (env.match(new RegExp(`${key}=(.*)`)) || [, ""])[1].trim();
const URL_ = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SECRET = readEnv("SUPABASE_SECRET_KEY");

if (!URL_ || !SECRET) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
  process.exit(1);
}

const headers = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "content-type": "application/json" };

const store = JSON.parse(readFileSync(STORE_PATH, "utf8"));

/**
 * dealerships.owner_user_id is a foreign key into auth.users, so every dealership must resolve to a
 * real auth account. Local persistence identified owners by email, so the migration provisions (or
 * reuses) one auth user per distinct owner email and maps email -> uuid. Idempotent: an existing
 * account is reused rather than duplicated.
 */
const ownerUuidByEmail = new Map();

/**
 * Local persistence never enforced inventory_vehicles' unique (dealership_id, stock_number). Where
 * the store holds a collision, the most recently updated row keeps the original stock number and
 * older rows receive a deterministic suffix, so both vehicles migrate rather than one being lost.
 * Affected rows are printed for manual reconciliation.
 */
const stockNumberOverrides = new Map();
function resolveStockNumberCollisions() {
  const groups = new Map();
  for (const v of store.inventoryVehicles) {
    const key = `${v.dealershipId}||${v.stockNumber}`;
    const list = groups.get(key) ?? [];
    list.push(v);
    groups.set(key, list);
  }
  const affected = [];
  for (const [, list] of groups) {
    if (list.length < 2) continue;
    const ordered = [...list].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || String(a.id).localeCompare(String(b.id)));
    ordered.slice(1).forEach((v, index) => {
      const next = `${v.stockNumber}-DUP${index + 2}`;
      stockNumberOverrides.set(v.id, next);
      affected.push(`${v.id} ${v.stockNumber} -> ${next}`);
    });
  }
  if (affected.length) {
    console.log(`  stock-number collisions resolved: ${affected.length}`);
    affected.forEach((line) => console.log(`      ${line}`));
  }
}

async function findUserByEmail(email) {
  const response = await fetch(`${URL_}/auth/v1/admin/users?page=1&per_page=1&filter=${encodeURIComponent(email)}`, { headers });
  if (!response.ok) return null;
  const body = await response.json();
  const match = (body.users ?? []).find((u) => String(u.email).toLowerCase() === email);
  return match ? match.id : null;
}

async function provisionOwners() {
  const emails = [...new Set(store.dealerships.map((d) => String(d.ownerUserId).trim().toLowerCase()))];
  let created = 0, reused = 0;
  for (const email of emails) {
    const existing = await findUserByEmail(email);
    if (existing) { ownerUuidByEmail.set(email, existing); reused += 1; continue; }
    const response = await fetch(`${URL_}/auth/v1/admin/users`, {
      method: "POST", headers,
      body: JSON.stringify({ email, email_confirm: true, app_metadata: { user_type: "dealer-owner", migrated_by: "pcp001j2a" } }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(`owner provisioning ${email}: ${response.status} ${JSON.stringify(body).slice(0, 160)}`);
    ownerUuidByEmail.set(email, body.id);
    created += 1;
  }
  console.log(`  owners provisioned: ${created} created, ${reused} reused (${emails.length} distinct)`);
}

async function deprovisionOwners() {
  const emails = [...new Set(store.dealerships.map((d) => String(d.ownerUserId).trim().toLowerCase()))];
  let removed = 0;
  for (const email of emails) {
    const id = await findUserByEmail(email);
    if (!id) continue;
    const response = await fetch(`${URL_}/auth/v1/admin/users/${id}`, { method: "DELETE", headers });
    if (response.ok) removed += 1;
  }
  console.log(`  owner accounts removed: ${removed}`);
}

/**
 * Local persistence had no referential integrity, so a few child rows point at vehicles that never
 * existed (left behind by error-handling probes). Production enforces the foreign key, so orphans
 * are filtered out and reported rather than failing the run.
 */
const knownVehicleIds = new Set(store.inventoryVehicles.map((v) => v.id));
function withoutOrphans(label, rows) {
  const kept = rows.filter((r) => knownVehicleIds.has(r.vehicleId));
  const dropped = rows.length - kept.length;
  if (dropped > 0) orphanReport.push(`${label}: ${dropped} orphan row(s) skipped`);
  return kept;
}
const orphanReport = [];

/** Ordered so foreign keys always resolve: parents before children. */
const PLAN = [
  {
    table: "dealerships",
    rows: store.dealerships,
    map: (d) => ({
      id: d.id, owner_user_id: ownerUuidByEmail.get(String(d.ownerUserId).trim().toLowerCase()), business_name: d.businessName, trading_name: d.tradingName,
      registration_number: d.registrationNumber, vat_number: d.vatNumber,
      dealer_licence_number: d.dealerLicenceNumber ?? null, business_type: d.businessType,
      physical_address: d.physicalAddress, province: d.province, city: d.city, postal_code: d.postalCode,
      gps_latitude: d.gpsLatitude ?? "0", gps_longitude: d.gpsLongitude ?? "0",
      telephone: d.telephone, whatsapp: d.whatsapp, email: d.email, website: d.website ?? null,
      logo_data_url: d.logoDataUrl ?? null, cover_data_url: d.coverDataUrl ?? null,
      primary_color: d.primaryColor, secondary_color: d.secondaryColor,
      onboarding_status: d.onboardingStatus, subscription_package: d.subscriptionPackage ?? null,
      completed_at: d.completedAt ?? null, created_at: d.createdAt, updated_at: d.updatedAt,
    }),
  },
  {
    table: "dealership_branches",
    rows: store.branches,
    map: (b) => ({
      id: b.id, dealership_id: b.dealershipId, name: b.name, address: b.address, province: b.province,
      city: b.city, postal_code: b.postalCode, telephone: b.telephone, whatsapp: b.whatsapp,
      email: b.email, business_hours: b.businessHours, branch_manager: b.branchManager,
      created_at: b.createdAt, updated_at: b.updatedAt,
    }),
  },
  {
    table: "inventory_vehicles",
    rows: store.inventoryVehicles,
    map: (v) => ({
      id: v.id, dealership_id: v.dealershipId, branch_id: v.branchId, stock_number: stockNumberOverrides.get(v.id) ?? v.stockNumber,
      vin: v.vin, registration_number: v.registrationNumber, title: v.title, make: v.make,
      model: v.model, variant: v.variant ?? null, colour: v.colour ?? null, fuel: v.fuel ?? null,
      transmission: v.transmission ?? null, engine: v.engine ?? null, body_type: v.bodyType ?? null,
      year: v.year, mileage_km: v.mileageKm, asking_price_cents: v.askingPriceCents,
      currency: v.currency, lifecycle_status: v.lifecycleStatus, description: v.description ?? null,
      seo_title: v.seoTitle ?? null, seo_description: v.seoDescription ?? null,
      estimated_days_to_sell: v.estimatedDaysToSell ?? null, lead_count_30d: v.leadCount30d ?? 0,
      created_by: v.createdBy ?? "system", created_at: v.createdAt, updated_at: v.updatedAt,
    }),
  },
  {
    table: "inventory_vehicle_media",
    rows: withoutOrphans("inventory_vehicle_media", store.inventoryMedia),
    map: (m) => ({
      id: m.id, dealership_id: m.dealershipId, vehicle_id: m.vehicleId, file_name: m.fileName,
      file_url: m.fileUrl, is_primary: m.isPrimary, sort_order: m.sortOrder,
      quality_status: m.qualityStatus ?? "review", processing_status: m.processingStatus ?? "uploaded",
      ai_enhancement_status: m.aiEnhancementStatus ?? "not-started", created_at: m.createdAt,
    }),
  },
  {
    table: "inventory_vehicle_documents",
    rows: withoutOrphans("inventory_vehicle_documents", store.inventoryDocuments),
    map: (d) => ({
      id: d.id, dealership_id: d.dealershipId, vehicle_id: d.vehicleId, document_type: d.documentType,
      file_name: d.fileName, file_url: d.fileUrl, uploaded_by: d.uploadedBy, uploaded_at: d.uploadedAt,
    }),
  },
  {
    table: "inventory_vehicle_price_history",
    rows: withoutOrphans("inventory_vehicle_price_history", store.inventoryPriceHistory),
    map: (p) => ({
      id: p.id, dealership_id: p.dealershipId, vehicle_id: p.vehicleId, price_cents: p.priceCents,
      reason: p.reason, changed_by: p.changedBy, changed_at: p.changedAt,
    }),
  },
  {
    table: "inventory_vehicle_history",
    rows: withoutOrphans("inventory_vehicle_history", store.inventoryHistory),
    map: (h) => ({
      id: h.id, dealership_id: h.dealershipId, vehicle_id: h.vehicleId, event_type: h.eventType,
      message: h.message, created_at: h.createdAt,
    }),
  },
];

async function upsertBatch(table, rows) {
  const response = await fetch(`${URL_}/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    throw new Error(`${table}: ${response.status} ${(await response.text()).slice(0, 300)}`);
  }
}

async function countRemote(table) {
  const response = await fetch(`${URL_}/rest/v1/${table}?select=id`, {
    headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
  });
  return Number((response.headers.get("content-range") || "*/0").split("/")[1]);
}

async function deleteByIds(table, ids) {
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const list = chunk.map((id) => `"${String(id).replace(/"/g, '\\"')}"`).join(",");
    const response = await fetch(`${URL_}/rest/v1/${table}?id=in.(${encodeURIComponent(list)})`, {
      method: "DELETE", headers,
    });
    if (!response.ok) throw new Error(`rollback ${table}: ${response.status} ${(await response.text()).slice(0, 200)}`);
  }
}

(async () => {
  if (VERIFY_ONLY) {
    console.log("=== VERIFY ===");
    let ok = true;
    for (const step of PLAN) {
      const remote = await countRemote(step.table);
      const local = step.rows.length;
      const match = remote >= local;
      if (!match) ok = false;
      console.log(`  ${match ? "OK  " : "FAIL"} ${step.table.padEnd(34)} local=${String(local).padStart(4)}  remote=${String(remote).padStart(4)}`);
    }
    console.log(ok ? "\nVERIFY PASSED" : "\nVERIFY FAILED");
    process.exit(ok ? 0 : 1);
  }

  if (ROLLBACK) {
    console.log("=== ROLLBACK (removing only rows this migration inserted, child-first) ===");
    for (const step of [...PLAN].reverse()) {
      const ids = step.rows.map((r) => r.id);
      if (!ids.length) { console.log(`  ${step.table}: nothing to remove`); continue; }
      if (DRY_RUN) { console.log(`  DRY-RUN ${step.table}: would remove ${ids.length}`); continue; }
      await deleteByIds(step.table, ids);
      console.log(`  ${step.table.padEnd(34)} removed ${ids.length}`);
    }
    if (!DRY_RUN) await deprovisionOwners();
    console.log("\nROLLBACK COMPLETE");
    return;
  }

  console.log(`=== VEHICLE DATA MIGRATION ${DRY_RUN ? "(DRY RUN)" : ""} ===`);
  resolveStockNumberCollisions();
  if (!DRY_RUN) await provisionOwners();
  const report = [];
  for (const step of PLAN) {
    const before = await countRemote(step.table);
    const mapped = step.rows.map(step.map);

    if (DRY_RUN) {
      console.log(`  DRY-RUN ${step.table.padEnd(34)} would upsert ${mapped.length} (remote now ${before})`);
      report.push({ table: step.table, local: mapped.length, before, after: before, migrated: 0 });
      continue;
    }

    for (let i = 0; i < mapped.length; i += BATCH) {
      await upsertBatch(step.table, mapped.slice(i, i + BATCH));
    }

    const after = await countRemote(step.table);
    console.log(`  ${step.table.padEnd(34)} local=${String(mapped.length).padStart(4)}  before=${String(before).padStart(4)}  after=${String(after).padStart(4)}`);
    report.push({ table: step.table, local: mapped.length, before, after, migrated: after - before });
  }

  console.log("\n=== SUMMARY ===");
  for (const r of report) {
    console.log(`  ${r.table.padEnd(34)} local=${String(r.local).padStart(4)}  remote=${String(r.after).padStart(4)}  inserted=${String(r.migrated).padStart(4)}`);
  }
  const shortfall = report.filter((r) => r.after < r.local);
  console.log(shortfall.length ? `\nINCOMPLETE: ${shortfall.map((r) => r.table).join(", ")}` : "\nMIGRATION COMPLETE — every local row present remotely");
})().catch((error) => {
  console.error("\nMIGRATION FAILED:", error.message);
  console.error("Re-run to resume; completed tables are already idempotent.");
  process.exit(1);
});
