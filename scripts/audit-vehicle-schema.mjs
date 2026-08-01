/**
 * Vehicle schema drift check.
 *
 * The TypeScript domain model is the source of truth. This compares the repository's VehicleRow
 * contract, the local persistence record, and the live Supabase columns, and reports any field the
 * domain expects that the database cannot store.
 *
 * Exit code 1 on drift, so it can gate a build or run in CI.
 *
 * Usage: node scripts/audit-vehicle-schema.mjs [--json]
 */
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local", "utf8");
const readEnv = (k) => (env.match(new RegExp(`${k}=(.*)`)) || [, ""])[1].trim();
const URL_ = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SECRET = readEnv("SUPABASE_SECRET_KEY");

const camelToSnake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

/** Extracts `readonly name: type;` pairs from an exported interface. */
function readInterface(file, name) {
  const src = readFileSync(file, "utf8");
  const start = src.indexOf(`interface ${name} {`);
  if (start === -1) throw new Error(`interface ${name} not found in ${file}`);
  const body = src.slice(start, src.indexOf("\n}", start));
  const fields = new Map();
  for (const m of body.matchAll(/readonly\s+([a-zA-Z0-9_]+)\??\s*:\s*([^;]+);/g)) {
    fields.set(m[1], m[2].trim().replace(/\s+/g, " "));
  }
  return fields;
}

const OVERRIDES = new Map([["bodyType", "body_type"]]);
const toColumn = (field) => OVERRIDES.get(field) ?? camelToSnake(field);

/** Fields the repository derives rather than persists. */
const DERIVED = new Set(["mileageDisplay", "subtitle", "condition"]);

(async () => {
  const repoRow = readInterface("src/services/vehicle-engine/vehicle-record.mapper.ts", "VehicleRow");
  const localRow = readInterface("src/lib/local-persistence/platform-store.ts", "LocalInventoryVehicleRecord");

  const spec = await (await fetch(`${URL_}/rest/v1/`, {
    headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}` },
  })).json();
  const dbColumns = new Set(Object.keys(spec.definitions?.inventory_vehicles?.properties ?? {}));
  const dbTypes = spec.definitions?.inventory_vehicles?.properties ?? {};

  const rows = [];
  const missing = [];

  for (const [field, type] of repoRow) {
    if (DERIVED.has(field)) continue;
    const column = toColumn(field);
    const inDb = dbColumns.has(column);
    const inLocal = localRow.has(field);
    if (!inDb) missing.push({ field, column, type });
    rows.push({ field, column, type, inDb, inLocal, dbType: inDb ? (dbTypes[column].format ?? dbTypes[column].type) : "-" });
  }

  const repoColumns = new Set(rows.map((r) => r.column));
  const unused = [...dbColumns].filter((c) => !repoColumns.has(c)).sort();

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ rows, missing, unused }, null, 2));
  } else {
    console.log("=== VEHICLE FIELD ALIGNMENT (domain model -> database) ===");
    console.log("field".padEnd(20) + "column".padEnd(22) + "domain type".padEnd(20) + "db".padEnd(6) + "local".padEnd(7) + "db type");
    for (const r of rows) {
      console.log(
        r.field.padEnd(20) + r.column.padEnd(22) + r.type.slice(0, 18).padEnd(20)
        + (r.inDb ? "yes" : "NO ").padEnd(6) + (r.inLocal ? "yes" : "no ").padEnd(7) + r.dbType,
      );
    }
    console.log(`\n=== MISSING FROM DATABASE (${missing.length}) ===`);
    for (const m of missing) console.log(`  ${m.column.padEnd(22)} ${m.type}`);
    console.log(`\n=== IN DATABASE, NOT READ BY REPOSITORY (${unused.length}) ===`);
    console.log(unused.length ? "  " + unused.join(", ") : "  none");
  }

  if (missing.length) {
    console.error(`\nSCHEMA DRIFT: ${missing.length} domain field(s) have no database column.`);
    process.exit(1);
  }
  console.log("\nNo drift: every domain field has a database column.");
})();
