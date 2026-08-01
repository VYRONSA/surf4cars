/**
 * Strips test-run timestamps from vehicle titles.
 *
 * 110 of 330 vehicles carried a uniqueness suffix from automated publish tests —
 * "2024 Volvo XC90 B5 Ultimate 1785341064414". The title is the headline on every vehicle card and
 * the <h1> of every vehicle page, so a raw millisecond timestamp was the most prominent text after
 * the price.
 *
 * The structured columns (year, make, model, variant) were never corrupted, so the title is simply
 * rebuilt from them rather than patched.
 *
 * Usage: node scripts/seed/repair-vehicle-titles.mjs [--dry-run]
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

/** A 10+ digit run, a test prefix, or a "Duplicate" marker left by publish tests. */
const ARTEFACT = /\b\d{10,}\b|pcp\d{3}[a-z0-9-]*|cctrace[a-z0-9-]*|ccpost[a-z0-9-]*|\bDuplicate\b/gi;

async function main() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("inventory_vehicles")
      .select("id, title, year, make, model, variant")
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }

  const updates = [];
  for (const vehicle of rows) {
    if (!ARTEFACT.test(vehicle.title ?? "")) continue;
    ARTEFACT.lastIndex = 0;

    const title = [vehicle.year, vehicle.make, vehicle.model, vehicle.variant]
      .filter(Boolean)
      .join(" ")
      .replace(ARTEFACT, "")
      .replace(/\s+/g, " ")
      .trim();
    ARTEFACT.lastIndex = 0;

    if (title && title !== vehicle.title) {
      updates.push({ id: vehicle.id, from: vehicle.title, to: title });
    }
  }

  console.log(`${rows.length} vehicles, ${updates.length} titles to repair`);
  updates.slice(0, 6).forEach((u) => console.log(`  ${u.from.slice(0, 44).padEnd(46)} → ${u.to}`));
  if (updates.length > 6) console.log(`  … and ${updates.length - 6} more`);

  if (DRY_RUN) {
    console.log("\n--dry-run: nothing written.");
    return;
  }

  for (const update of updates) {
    const { error } = await supabase
      .from("inventory_vehicles")
      .update({ title: update.to })
      .eq("id", update.id);
    if (error) throw new Error(`${update.id}: ${error.message}`);
  }

  console.log(`\nRepaired ${updates.length} title(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
