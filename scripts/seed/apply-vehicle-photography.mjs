/**
 * Points every vehicle's media rows at real photography from the demonstration library.
 *
 * Before this ran, inventory_vehicle_media held 2779 rows sharing 6 URLs, none of which were
 * vehicle photographs — the marketplace advertised hundreds of cars using five recycled UI hero
 * graphics. This assigns each vehicle a gallery from its own make and model where the library has
 * one, and from a body-type-appropriate fallback where it does not.
 *
 * Idempotent: re-running produces the same assignment for the same vehicle, because the gallery
 * offset is derived from the vehicle id rather than from row order.
 *
 * Usage:
 *   node scripts/seed/apply-vehicle-photography.mjs [--dry-run]
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");
const MANIFEST = join("public", "images", "vehicles", "library", "attribution.json");

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

const slugify = (value) =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Stable hash so a vehicle always receives the same gallery across runs. */
function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** The order buyers expect to inspect a car in, per the Experience Bible. */
const SLOT_ORDER = ["front", "rear", "side", "interior", "dashboard", "wheel", "engine"];

async function fetchAll(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).order("id").range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return rows;
}

async function main() {
  if (!existsSync(MANIFEST)) {
    console.error(`No library found at ${MANIFEST}. Run fetch-vehicle-photography.mjs first.`);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const libraries = Object.entries(manifest).filter(([, images]) => images.length > 0);
  if (libraries.length === 0) {
    console.error("Library manifest is empty.");
    process.exit(1);
  }

  console.log(`Library: ${libraries.length} models, ${libraries.reduce((n, [, i]) => n + i.length, 0)} images`);

  const vehicles = await fetchAll("inventory_vehicles", "id, dealership_id, make, model, body_type");
  console.log(`Vehicles: ${vehicles.length}`);

  // Group the library by body type so a model with no photographs of its own still gets a car of
  // the right shape rather than an arbitrary one.
  const models = JSON.parse(readFileSync(join("scripts", "seed", "vehicle-models.json"), "utf8"));
  const bodyTypeOf = new Map(models.map((m) => [slugify(`${m.make} ${m.model}`), m.bodyType]));
  const byBodyType = new Map();
  for (const [key, images] of libraries) {
    const bodyType = bodyTypeOf.get(key) ?? "unknown";
    if (!byBodyType.has(bodyType)) byBodyType.set(bodyType, []);
    byBodyType.get(bodyType).push([key, images]);
  }

  const rows = [];
  const stats = { exact: 0, bodyType: 0, fallback: 0 };

  for (const vehicle of vehicles) {
    const key = slugify(`${vehicle.make} ${vehicle.model}`);
    let images = manifest[key];

    if (images?.length) {
      stats.exact += 1;
    } else {
      // No photographs of this exact model — borrow from another car of the same body type.
      const pool = byBodyType.get(vehicle.body_type) ?? [];
      if (pool.length) {
        images = pool[hash(vehicle.id) % pool.length][1];
        stats.bodyType += 1;
      } else {
        images = libraries[hash(vehicle.id) % libraries.length][1];
        stats.fallback += 1;
      }
    }

    const ordered = [...images].sort(
      (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot),
    );

    ordered.forEach((image, index) => {
      rows.push({
        id: `${vehicle.id}-media-${image.slot}`,
        vehicle_id: vehicle.id,
        dealership_id: vehicle.dealership_id,
        file_name: `${key}-${image.slot}.jpg`,
        file_url: image.file,
        is_primary: index === 0,
        sort_order: index,
      });
    });
  }

  console.log(
    `Assignment: ${stats.exact} exact model, ${stats.bodyType} same body type, ${stats.fallback} generic`,
  );
  console.log(`Media rows to write: ${rows.length} (${new Set(rows.map((r) => r.file_url)).size} distinct URLs)`);

  if (DRY_RUN) {
    console.log("\n--dry-run: nothing written.");
    return;
  }

  // Replace wholesale: the old rows point at graphics that are no longer vehicle photography.
  const existing = await fetchAll("inventory_vehicle_media", "id");
  console.log(`Deleting ${existing.length} existing media rows…`);
  for (let i = 0; i < existing.length; i += 500) {
    const batch = existing.slice(i, i + 500).map((r) => r.id);
    const { error } = await supabase.from("inventory_vehicle_media").delete().in("id", batch);
    if (error) throw new Error(`delete: ${error.message}`);
  }

  console.log(`Inserting ${rows.length} media rows…`);
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase
      .from("inventory_vehicle_media")
      .upsert(rows.slice(i, i + 500), { onConflict: "id" });
    if (error) throw new Error(`insert: ${error.message}`);
  }

  const { count } = await supabase
    .from("inventory_vehicle_media")
    .select("id", { count: "exact", head: true });
  console.log(`Done. inventory_vehicle_media now holds ${count} rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
