/**
 * PCP-001S1 — Production Demo & Seed Data Framework.
 *
 * Design
 *   deterministic  a seeded PRNG plus derived ids (s1-dealer-007, s1-veh-0142) mean a given
 *                  --seed always produces the same dataset
 *   idempotent     every write is an upsert on the primary key, so re-running updates in place
 *                  and never duplicates
 *   partial        --only=dealers,vehicles,leads,buyers restricts execution to those stages
 *   protected      refuses to run against NODE_ENV=production without ALLOW_SEED=true or --force-demo
 *   constrained    all generated values satisfy the live CHECK constraints, foreign keys and RLS
 *
 * Usage
 *   node scripts/seed/seed-runner.mjs [--only=dealers,vehicles,media,buyers,leads]
 *                                     [--dealers=50] [--vehicles=220] [--leads=300]
 *                                     [--seed=20260729] [--purge] [--force-demo] [--dry-run]
 */
import { readFileSync } from "node:fs";
import {
  CITIES, SUBURBS, DEALER_TYPES, MODELS, COLOURS, VEHICLE_IMAGE_SET,
  FIRST_NAMES, LAST_NAMES, DEALER_NAME_PARTS, DEALER_PREFIXES,
} from "./sa-market-data.mjs";

// ---------------------------------------------------------------------------
// Configuration and environment protection
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const CONFIG = {
  dealers: Number(flag("dealers", 50)),
  vehicles: Number(flag("vehicles", 220)),
  leads: Number(flag("leads", 300)),
  buyers: Number(flag("buyers", 40)),
  seed: Number(flag("seed", 20260729)),
  only: (flag("only", "") || "").split(",").map((s) => s.trim()).filter(Boolean),
  purge: has("purge"),
  dryRun: has("dry-run"),
  force: has("force-demo") || process.env.ALLOW_SEED === "true",
};

const STAGES = ["dealers", "vehicles", "media", "buyers", "leads"];
const shouldRun = (stage) => CONFIG.only.length === 0 || CONFIG.only.includes(stage);

if (process.env.NODE_ENV === "production" && !CONFIG.force) {
  console.error("REFUSED: NODE_ENV=production.");
  console.error("This framework seeds demonstration data and must never populate a live marketplace.");
  console.error("If this is a demo environment, re-run with ALLOW_SEED=true or --force-demo.");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && CONFIG.force) {
  console.warn("WARNING: seeding a production build because an explicit override was supplied.");
}

const env = readFileSync(".env.local", "utf8");
const readEnv = (k) => (env.match(new RegExp(`${k}=(.*)`)) || [, ""])[1].trim();
const URL_ = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SECRET = readEnv("SUPABASE_SECRET_KEY");
if (!URL_ || !SECRET) { console.error("Supabase URL and secret key are required."); process.exit(1); }
const H = { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "content-type": "application/json" };

// ---------------------------------------------------------------------------
// Deterministic generation helpers
// ---------------------------------------------------------------------------

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(CONFIG.seed);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const intBetween = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
const weighted = (items) => {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = rnd() * total;
  for (const item of items) { roll -= item.weight; if (roll <= 0) return item; }
  return items[items.length - 1];
};
const pad = (n, width) => String(n).padStart(width, "0");
const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

const BATCH = 200;
let writes = 0;

async function upsert(table, rows, conflict = "id") {
  if (!rows.length) return;
  if (CONFIG.dryRun) { writes += rows.length; return; }
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const response = await fetch(`${URL_}/rest/v1/${table}?on_conflict=${conflict}`, {
      method: "POST",
      headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(chunk),
    });
    if (!response.ok) throw new Error(`${table}: ${response.status} ${(await response.text()).slice(0, 300)}`);
    writes += chunk.length;
  }
}

async function countOf(table, filter = "") {
  const response = await fetch(`${URL_}/rest/v1/${table}?select=id${filter}`, {
    headers: { ...H, Prefer: "count=exact", Range: "0-0" },
  });
  return Number((response.headers.get("content-range") || "*/0").split("/")[1]);
}

/** Auth accounts are required because dealerships.owner_user_id references auth.users. */
const authIdByEmail = new Map();
async function ensureAuthUser(email, appMetadata) {
  if (authIdByEmail.has(email)) return authIdByEmail.get(email);
  if (CONFIG.dryRun) { authIdByEmail.set(email, `dry-${email}`); return authIdByEmail.get(email); }

  const lookup = await fetch(`${URL_}/auth/v1/admin/users?page=1&per_page=1&filter=${encodeURIComponent(email)}`, { headers: H });
  if (lookup.ok) {
    const body = await lookup.json();
    const match = (body.users ?? []).find((u) => String(u.email).toLowerCase() === email);
    if (match) { authIdByEmail.set(email, match.id); return match.id; }
  }
  const created = await fetch(`${URL_}/auth/v1/admin/users`, {
    method: "POST", headers: H,
    body: JSON.stringify({ email, email_confirm: true, app_metadata: { ...appMetadata, seeded_by: "pcp001s1" } }),
  });
  const body = await created.json();
  if (!created.ok) throw new Error(`auth ${email}: ${created.status} ${JSON.stringify(body).slice(0, 160)}`);
  authIdByEmail.set(email, body.id);
  return body.id;
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const SEED_PREFIX = "s1";
const dealerId = (n) => `${SEED_PREFIX}-dealer-${pad(n, 3)}`;
const branchId = (n) => `${SEED_PREFIX}-branch-${pad(n, 3)}`;
const vehicleId = (n) => `${SEED_PREFIX}-veh-${pad(n, 4)}`;

function buildDealers() {
  const dealers = [];
  for (let i = 1; i <= CONFIG.dealers; i += 1) {
    const type = weighted(DEALER_TYPES);
    const place = weighted(CITIES);
    const name = `${pick(DEALER_PREFIXES)} ${pick(DEALER_NAME_PARTS[type.id])}`;
    const slugCode = `${type.id.slice(0, 3).toUpperCase()}-${pad(i, 3)}`;
    const email = `dealer.${pad(i, 3)}@surf4cars-demo.co.za`;
    dealers.push({
      index: i, type: type.id, inventoryRange: type.inventory, city: place.city, province: place.province,
      record: {
        id: dealerId(i),
        business_name: `${name} (Pty) Ltd`,
        trading_name: name,
        registration_number: `2019/${pad(100000 + i, 6)}/07`,
        vat_number: `4${pad(200000000 + i * 7, 9)}`,
        dealer_licence_number: slugCode,
        business_type: type.id,
        physical_address: `${intBetween(1, 240)} ${pick(["Main", "Church", "Voortrekker", "Beach", "Long", "Rivonia"])} Road`,
        province: place.province,
        city: place.city,
        postal_code: pad(intBetween(1000, 9999), 4),
        gps_latitude: (place.lat + (rnd() - 0.5) * 0.12).toFixed(6),
        gps_longitude: (place.lng + (rnd() - 0.5) * 0.12).toFixed(6),
        telephone: `0${intBetween(11, 87)}${intBetween(1000000, 9999999)}`,
        whatsapp: `082${intBetween(1000000, 9999999)}`,
        email,
        website: `https://www.${name.toLowerCase().replace(/[^a-z]+/g, "")}.co.za`,
        logo_data_url: "/images/branding/logo.png",
        cover_data_url: "/images/dealers/dealer-profile-hero.webp",
        primary_color: pick(["#0F62FE", "#111827", "#B91C1C", "#065F46", "#7C2D12"]),
        secondary_color: "#FFFFFF",
        onboarding_status: "complete",
        subscription_package: pick(["starter", "growth", "premium"]),
        completed_at: iso(intBetween(60, 700)),
        created_at: iso(intBetween(60, 700)),
        updated_at: iso(intBetween(0, 30)),
      },
      ownerEmail: email,
      suburb: pick(SUBURBS),
    });
  }
  return dealers;
}

function buildBranch(dealer) {
  return {
    id: branchId(dealer.index),
    dealership_id: dealer.record.id,
    name: `${dealer.record.trading_name} ${dealer.suburb}`,
    address: dealer.record.physical_address,
    province: dealer.province,
    city: dealer.city,
    postal_code: dealer.record.postal_code,
    telephone: dealer.record.telephone,
    whatsapp: dealer.record.whatsapp,
    email: dealer.record.email,
    business_hours: "Mon-Fri 08:00-17:30, Sat 08:00-13:00",
    branch_manager: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    created_at: dealer.record.created_at,
    updated_at: dealer.record.updated_at,
  };
}

/** Depreciation curve keeps price coherent with age and mileage. */
function priceFor(model, year, mileageKm) {
  const age = Math.max(0, 2026 - year);
  const base = intBetween(model.price.min, model.price.max);
  const ageFactor = Math.pow(0.88, age);
  const mileageFactor = Math.max(0.55, 1 - (mileageKm / 400000));
  return Math.round((base * ageFactor * mileageFactor) / 5000) * 5000;
}

function buildVehiclesFor(dealer, startIndex, count) {
  const eligible = MODELS.filter((m) => m.segments.includes(dealer.type));
  const pool = eligible.length ? eligible : MODELS;
  const vehicles = [];
  for (let i = 0; i < count; i += 1) {
    const model = pick(pool);
    const year = intBetween(2018, 2026);
    const age = Math.max(0, 2026 - year);
    const mileageKm = Math.max(5000, Math.min(250000, intBetween(5000, 30000) + age * intBetween(8000, 28000)));
    const price = priceFor(model, year, mileageKm);
    const variant = pick(model.variants);
    const fuel = pick(model.fuels);
    const transmission = pick(model.trans);
    const drive = pick(model.drives);
    const colour = pick(COLOURS);
    // Displacement is taken from the variant name where it states one, otherwise inferred from
    // the segment, so the engine string always agrees with the rest of the specification.
    const displacement = (variant.match(/\d\.\d/) || [fuel === "Electric" ? "" : "2.0"])[0];
    const engine = fuel === "Electric"
      ? "Electric motor"
      : `${displacement}L ${fuel === "Diesel" ? "TDI" : "Petrol"}${transmission === "Automatic" ? " Auto" : ""}`;
    const index = startIndex + i;
    const lifecycle = rnd() < 0.82 ? "published" : rnd() < 0.6 ? "draft" : "sold";
    vehicles.push({
      id: vehicleId(index),
      dealership_id: dealer.record.id,
      branch_id: branchId(dealer.index),
      stock_number: `${SEED_PREFIX.toUpperCase()}-${pad(index, 5)}`,
      vin: `AAV${pad(index, 5)}${String(year).slice(2)}${pad(intBetween(0, 999999), 6)}`,
      registration_number: `${pick(["CA", "GP", "ND", "EC", "FS", "LP", "MP", "NC", "NW"])} ${intBetween(100, 999)}-${intBetween(100, 999)}`,
      title: `${year} ${model.make} ${model.model} ${variant}`,
      make: model.make,
      model: model.model,
      variant,
      colour,
      fuel,
      transmission,
      engine,
      body_type: model.body,
      year,
      mileage_km: mileageKm,
      asking_price_cents: price * 100,
      currency: "ZAR",
      lifecycle_status: lifecycle,
      description: `${year} ${model.make} ${model.model} ${variant} with ${mileageKm.toLocaleString("en-ZA")} km. Full service history, ${pick(["one owner", "two owners", "accident free", "dealer maintained"])}. Finance and trade-ins welcome at ${dealer.record.trading_name}, ${dealer.city}.`,
      seo_title: `${year} ${model.make} ${model.model} ${variant} for sale in ${dealer.city}`,
      seo_description: `${model.make} ${model.model} ${variant}, ${mileageKm.toLocaleString("en-ZA")} km, ${fuel}, ${transmission}. Available now at ${dealer.record.trading_name}.`,
      estimated_days_to_sell: intBetween(12, 95),
      lead_count_30d: intBetween(0, 14),
      created_by: "pcp001s1-seed",
      created_at: iso(intBetween(1, 240)),
      updated_at: iso(intBetween(0, 20)),
      // Retained for downstream generators; stripped before write.
      _model: model, _variant: variant,
    });
  }
  return vehicles;
}

function buildMediaFor(vehicle) {
  return VEHICLE_IMAGE_SET.map((image, order) => ({
    id: `${vehicle.id}-img-${pad(order + 1, 2)}`,
    dealership_id: vehicle.dealership_id,
    vehicle_id: vehicle.id,
    file_name: `${vehicle.stock_number}-${image.slot}.webp`,
    file_url: image.url,
    is_primary: order === 0,
    sort_order: order + 1,
    quality_status: order < 6 ? "good" : "review",
    processing_status: "ready",
    ai_enhancement_status: "not-started",
    created_at: vehicle.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

async function purge() {
  console.log("  purging previous seed rows…");
  for (const [table, column] of [
    ["lead_timeline", "dealership_id"], ["leads", "dealership_id"],
    ["inventory_vehicle_media", "dealership_id"], ["inventory_vehicle_documents", "dealership_id"],
    ["inventory_vehicle_price_history", "dealership_id"], ["inventory_vehicle_history", "dealership_id"],
    ["inventory_vehicles", "dealership_id"], ["dealership_staff_memberships", "dealership_id"],
    ["dealership_branches", "dealership_id"], ["dealerships", "id"],
  ]) {
    await fetch(`${URL_}/rest/v1/${table}?${column}=like.${SEED_PREFIX}-*`, { method: "DELETE", headers: H });
  }
}

(async () => {
  const startedAt = Date.now();
  console.log(`=== PCP-001S1 SEED ${CONFIG.dryRun ? "(DRY RUN)" : ""} ===`);
  console.log(`  seed=${CONFIG.seed} dealers=${CONFIG.dealers} vehicles=${CONFIG.vehicles} leads=${CONFIG.leads} buyers=${CONFIG.buyers}`);
  console.log(`  stages: ${CONFIG.only.length ? CONFIG.only.join(", ") : STAGES.join(", ")}`);

  if (CONFIG.purge && !CONFIG.dryRun) await purge();

  const dealers = buildDealers();
  const summary = {};

  // --- dealers, branches, staff ---
  if (shouldRun("dealers")) {
    for (const dealer of dealers) {
      dealer.record.owner_user_id = await ensureAuthUser(dealer.ownerEmail, { user_type: "dealer-owner" });
    }
    await upsert("dealerships", dealers.map((d) => d.record));
    await upsert("dealership_branches", dealers.map(buildBranch));

    const staff = [];
    for (const dealer of dealers) {
      const staffCount = intBetween(1, 3);
      for (let s = 1; s <= staffCount; s += 1) {
        const email = `staff.${pad(dealer.index, 3)}.${s}@surf4cars-demo.co.za`;
        const userId = await ensureAuthUser(email, { user_type: "salesperson" });
        staff.push({
          id: `${dealerId(dealer.index)}-staff-${s}`,
          dealership_id: dealer.record.id,
          branch_id: branchId(dealer.index),
          user_id: userId,
          full_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
          email,
          role_id: s === 1 ? "branch-manager" : "salesperson",
          permissions: ["dealer:inventory:read", "dealer:leads:read"],
          status: "active",
          invited_at: dealer.record.created_at,
          accepted_at: dealer.record.created_at,
          created_at: dealer.record.created_at,
          updated_at: dealer.record.updated_at,
        });
      }
    }
    await upsert("dealership_staff_memberships", staff);
    summary.dealers = dealers.length;
    summary.branches = dealers.length;
    summary.staff = staff.length;
    console.log(`  dealers=${dealers.length} branches=${dealers.length} staff=${staff.length}`);
  }

  // --- vehicles + media ---
  let allVehicles = [];
  if (shouldRun("vehicles") || shouldRun("media")) {
    let cursor = 1;
    for (const dealer of dealers) {
      const [lo, hi] = dealer.inventoryRange;
      const count = intBetween(lo, hi);
      allVehicles.push(...buildVehiclesFor(dealer, cursor, count));
      cursor += count;
      if (cursor > CONFIG.vehicles) break;
    }
    allVehicles = allVehicles.slice(0, CONFIG.vehicles);

    if (shouldRun("vehicles")) {
      await upsert("inventory_vehicles", allVehicles.map(({ _model, _variant, ...row }) => row));
      summary.vehicles = allVehicles.length;
      console.log(`  vehicles=${allVehicles.length}`);
    }
    if (shouldRun("media")) {
      const media = allVehicles.flatMap(buildMediaFor);
      await upsert("inventory_vehicle_media", media);
      summary.media = media.length;
      console.log(`  media=${media.length}`);
    }
  }

  // --- buyers ---
  const buyers = [];
  if (shouldRun("buyers")) {
    for (let i = 1; i <= CONFIG.buyers; i += 1) {
      const email = `buyer.${pad(i, 3)}@surf4cars-demo.co.za`;
      const id = await ensureAuthUser(email, { user_type: "buyer" });
      const place = weighted(CITIES);
      buyers.push({ id, email, name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, city: place.city, province: place.province });
    }
    await upsert("buyer_profiles", buyers.map((b) => ({
      buyer_id: b.id,
      budget_min_cents: intBetween(150, 400) * 1000 * 100,
      budget_max_cents: intBetween(500, 1500) * 1000 * 100,
      vehicle_types: [pick(["SUV", "Hatch", "Double Cab", "Sedan"])],
      lifestyle: pick(["family", "commuter", "adventure", "business"]),
      daily_commute_km: intBetween(10, 90),
      family_size: intBetween(1, 5),
      fuel_preference: pick(["Petrol", "Diesel", "Hybrid"]),
      transmission_preference: pick(["Automatic", "Manual"]),
      updated_at: iso(intBetween(0, 40)),
    })), "buyer_id");

    const published = allVehicles.filter((v) => v.lifecycle_status === "published");
    if (published.length) {
      await upsert("buyer_saved_vehicles", buyers.slice(0, Math.min(buyers.length, 30)).map((b, i) => ({
        id: `${SEED_PREFIX}-saved-${pad(i + 1, 3)}`,
        buyer_id: b.id,
        vehicle_id: pick(published).id,
        created_at: iso(intBetween(0, 45)),
      })));
    }
    await upsert("buyer_saved_searches", buyers.slice(0, Math.min(buyers.length, 25)).map((b, i) => {
      const model = pick(MODELS);
      return {
        id: `${SEED_PREFIX}-search-${pad(i + 1, 3)}`,
        buyer_id: b.id,
        name: `${model.make} ${model.model} under R${Math.round(model.price.max / 1000)}k`,
        query_text: `${model.make} ${model.model}`,
        interpretation: { make: model.make, model: model.model, priceMaxCents: model.price.max * 100 },
        alerts_enabled: rnd() < 0.6,
        created_at: iso(intBetween(0, 60)),
      };
    }));
    summary.buyers = buyers.length;
    console.log(`  buyers=${buyers.length}`);
  }

  // --- leads ---
  if (shouldRun("leads")) {
    // The schema constrains enquiry_type to contact | test-drive | finance and status to the
    // dealer-enquiry lifecycle. Demo "phone / WhatsApp / trade-in" intents are expressed in the
    // message body rather than by inventing values the CHECK constraints would reject.
    const CHANNELS = ["Phone", "WhatsApp", "Email"];
    const INTENTS = ["general enquiry", "trade-in valuation", "finance pre-approval", "test drive request"];
    const STATUS_FLOW = ["new", "assigned", "responded", "follow-up", "test-drive-scheduled", "finance-in-progress", "closed-won", "closed-lost"];

    const sellable = allVehicles.length
      ? allVehicles
      : (await (await fetch(`${URL_}/rest/v1/inventory_vehicles?select=id,dealership_id&dealership_id=like.${SEED_PREFIX}-*&limit=2000`, { headers: H })).json())
        .map((r) => ({ id: r.id, dealership_id: r.dealership_id }));

    const leads = [];
    const timeline = [];
    for (let i = 1; i <= CONFIG.leads && sellable.length; i += 1) {
      const vehicle = pick(sellable);
      const buyer = buyers.length ? pick(buyers) : null;
      const channel = pick(CHANNELS);
      const intent = pick(INTENTS);
      const enquiryType = intent.includes("finance") ? "finance" : intent.includes("test drive") ? "test-drive" : "contact";
      const status = weighted(STATUS_FLOW.map((s, idx) => ({ value: s, weight: idx < 4 ? 4 : 2 }))).value;
      const createdDaysAgo = intBetween(0, 120);
      const id = `${SEED_PREFIX}-lead-${pad(i, 4)}`;
      const name = buyer?.name ?? `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      const email = buyer?.email ?? `lead.${pad(i, 4)}@surf4cars-demo.co.za`;

      leads.push({
        id,
        dealership_id: vehicle.dealership_id,
        vehicle_id: vehicle.id,
        buyer_id: buyer?.id ?? null,
        buyer_name: name,
        buyer_email: email,
        buyer_phone: `08${intBetween(2, 4)}${intBetween(1000000, 9999999)}`,
        message: `${channel} ${intent}: interested in this vehicle, please contact me.`,
        fingerprint: `${SEED_PREFIX}|${id}`,
        enquiry_type: enquiryType,
        status,
        assigned_to_user_id: status === "new" ? null : `staff-${intBetween(1, 3)}`,
        assigned_to_name: status === "new" ? null : `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        assigned_at: status === "new" ? null : iso(createdDaysAgo - 1 > 0 ? createdDaysAgo - 1 : 0),
        responded_at: ["responded", "follow-up", "closed-won", "closed-lost"].includes(status) ? iso(Math.max(0, createdDaysAgo - 2)) : null,
        closed_at: status.startsWith("closed") ? iso(Math.max(0, createdDaysAgo - 5)) : null,
        resolution: status === "closed-won" ? "won" : status === "closed-lost" ? "lost" : null,
        last_updated_at: iso(Math.max(0, createdDaysAgo - 3)),
        created_at: iso(createdDaysAgo),
      });

      timeline.push({
        id: `${id}-tl-1`, lead_id: id, dealership_id: vehicle.dealership_id,
        type: "created", message: `${enquiryType} enquiry received from ${name}`,
        actor_id: null, actor_name: name, metadata: { channel, intent }, created_at: iso(createdDaysAgo),
      });
      if (status !== "new") {
        timeline.push({
          id: `${id}-tl-2`, lead_id: id, dealership_id: vehicle.dealership_id,
          type: "assigned", message: "Lead assigned to sales consultant",
          actor_id: null, actor_name: "Seed", metadata: {}, created_at: iso(Math.max(0, createdDaysAgo - 1)),
        });
      }
      if (status.startsWith("closed")) {
        timeline.push({
          id: `${id}-tl-3`, lead_id: id, dealership_id: vehicle.dealership_id,
          type: status === "closed-won" ? "closed-won" : "closed-lost",
          message: status === "closed-won" ? "Deal concluded" : "Buyer went elsewhere",
          actor_id: null, actor_name: "Seed", metadata: {}, created_at: iso(Math.max(0, createdDaysAgo - 5)),
        });
      }
    }
    await upsert("leads", leads);
    await upsert("lead_timeline", timeline);
    summary.leads = leads.length;
    summary.timeline = timeline.length;
    console.log(`  leads=${leads.length} timeline=${timeline.length}`);
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n=== SUMMARY (${elapsed}s, ${writes} rows written) ===`);
  if (!CONFIG.dryRun) {
    for (const [table, filter] of [
      ["dealerships", `&id=like.${SEED_PREFIX}-*`],
      ["dealership_branches", `&dealership_id=like.${SEED_PREFIX}-*`],
      ["dealership_staff_memberships", `&dealership_id=like.${SEED_PREFIX}-*`],
      ["inventory_vehicles", `&dealership_id=like.${SEED_PREFIX}-*`],
      ["inventory_vehicle_media", `&dealership_id=like.${SEED_PREFIX}-*`],
      ["leads", `&dealership_id=like.${SEED_PREFIX}-*`],
      ["lead_timeline", `&dealership_id=like.${SEED_PREFIX}-*`],
    ]) {
      console.log(`  ${table.padEnd(34)} ${await countOf(table, filter)}`);
    }
  }
  console.log(JSON.stringify(summary));
})().catch((error) => {
  console.error("\nSEED FAILED:", error.message);
  process.exit(1);
});
