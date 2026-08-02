/**
 * Does an import actually write, and does undo actually undo?
 *
 * WHY THIS RUNS AGAINST THE REAL DATABASE
 * =======================================
 * `verify-dealer-migration.mjs` proves the planner in isolation — it bundles the engine and feeds it
 * fixtures, which is right for logic and useless for this. Everything that can go wrong in an
 * executor is a fact about the database: a not-null column, a foreign key, a check constraint, a
 * column name that is `equipment_item_id` and not `equipment_id`. A mock cannot fail those, so a
 * test against a mock proves nothing about whether 250 vehicles will land.
 *
 * WHAT IT WRITES, AND WHY THAT IS SAFE
 * ====================================
 * Vehicles are imported against a dealership flagged `is_demonstration`, which is precisely what
 * those records exist for, and they land as drafts — never visible to a buyer. The last step is
 * `revertImportBatch`, so the cleanup *is* the assertion: if undo does not work, the test fails and
 * says so rather than quietly leaving stock behind.
 *
 * Usage:
 *   node scripts/verify-import-execution.mjs
 */
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
  if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
}
for (const [key, value] of Object.entries(env)) process.env[key] ??= value;

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SECRET_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

let passed = 0;
let failed = 0;
const check = (label, condition, detail = "") => {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

const rest = async (path, init = {}) => {
  const response = await fetch(`${URL_BASE}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init.headers } });
  if (!response.ok) throw new Error(`${path} → ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

/* The executor is TypeScript with path aliases, so it is bundled the same way the planner is —
   which also re-proves it carries no React, Next or request-context dependency. */
const outDir = mkdtempSync(join(tmpdir(), "surf-exec-"));
const outFile = join(outDir, "executor.mjs");
execSync(
  `npx esbuild src/features/dealer-migration/server/index-verify.ts --bundle --platform=node --format=esm --outfile=${outFile} --alias:@=./src --log-level=error`,
  { stdio: "inherit" },
);
const { buildImportPlan, executeImportPlan, revertImportBatch, buildImportReportCsv, getImportBatch } =
  await import(`file://${outFile}`);

console.log("\nDealer import execution (PCP-037)\n─────────────────────────────────");

const [dealership] = await rest("dealerships?select=id,business_name&is_demonstration=eq.true&limit=1");
if (!dealership) {
  console.log("  FAIL  no demonstration dealership to test against");
  process.exit(1);
}
const [branch] = await rest(`dealership_branches?select=id,name&dealership_id=eq.${dealership.id}&limit=1`);
console.log(`  Using ${dealership.business_name} / ${branch.name}\n`);

const stamp = Date.now();
const csv = [
  "Stock No,VIN,Make,Model,Derivative,Year,Mileage,Fuel,Transmission,Colour,Retail Price,Cost Price,Description,Features,Images",
  `PCP037-${stamp}-A,WVWZZZAUZJP000001,Volkswagen,Golf,1.4 TSI Comfortline,2019,54000,Petrol,Automatic,White,R 349 900,R 300 000,"Full service history, one owner.",Cruise Control;Bluetooth,https://example.org/a1.jpg;https://example.org/a2.jpg`,
  `PCP037-${stamp}-B,WVWZZZAUZJP000002,Volkswagen,Polo,1.0 TSI,2021,22000,Petrol,Manual,Blue,R 249 900,R 210 000,"Balance of motor plan.",Bluetooth,https://example.org/b1.jpg`,
  `PCP037-${stamp}-C,,Toyota,Hilux,2.8 GD-6,2022,61000,Diesel,Automatic,Silver,R 649 900,R 590 000,"Double cab 4x4.",,`,
  `PCP037-${stamp}-D,WVWZZZAUZJP000004,Ford,Ranger,,2020,-5,Diesel,Automatic,Grey,-R 100,R 400 000,,,`,
].join("\n");

const plan = buildImportPlan({
  dealershipId: dealership.id,
  fileName: "pcp037-verification.csv",
  content: csv,
  existing: [],
  corpus: [],
  branchNames: [branch.name],
});

check("the plan reads all four rows", plan.rows.length === 4, `${plan.rows.length} rows`);
check(
  "a cost price is never mapped to the public asking price",
  plan.mapping.mapping.priceRand === "Retail Price" && plan.mapping.ignoredColumns.includes("Cost Price"),
  `priceRand=${plan.mapping.mapping.priceRand}, ignored=${plan.mapping.ignoredColumns.join("|")}`,
);
check("the negative-price row is rejected", plan.summary.rejected === 1, `${plan.summary.rejected} rejected`);

const result = await executeImportPlan({
  plan,
  defaultBranchId: branch.id,
  createdBy: "pcp037-verification",
});

check("three vehicles were imported", result.imported === 3, `${result.imported} imported`);
check("one was rejected and not written", result.rejected === 1, `${result.rejected} rejected`);
check("photographs were written", result.mediaWritten === 3, `${result.mediaWritten} media rows`);

const written = await rest(
  `inventory_vehicles?select=id,vin,stock_number,lifecycle_status,asking_price_cents,title&dealership_id=eq.${dealership.id}&stock_number=like.PCP037-${stamp}*`,
);
check("imported vehicles exist in inventory", written.length === 3, `${written.length} found`);
check(
  "every imported vehicle is a draft, never published",
  written.every((row) => row.lifecycle_status === "draft"),
  written.map((r) => r.lifecycle_status).join(","),
);
check(
  "the asking price is the retail price, not the cost price",
  written.some((row) => row.asking_price_cents === 34990000),
  `prices: ${written.map((r) => r.asking_price_cents).join(",")}`,
);
check(
  "a vehicle with no VIN stores NULL, never an empty string",
  written.some((row) => row.vin === null),
  `vins: ${written.map((r) => JSON.stringify(r.vin)).join(",")}`,
);
check(
  "the title is composed from the dealer's own fields",
  written.some((row) => row.title === "2019 Volkswagen Golf 1.4 TSI Comfortline"),
  written.map((r) => r.title).join(" | "),
);

const equipment = await rest(
  `vehicle_equipment?select=vehicle_id,equipment_item_id,provenance&vehicle_id=in.(${written.map((r) => r.id).join(",")})`,
);
check("equipment matched the canonical vocabulary", equipment.length > 0, `${equipment.length} rows`);
check(
  "imported equipment is recorded as dealer-supplied, not VIN-decoded",
  equipment.every((row) => row.provenance === "dealer"),
  [...new Set(equipment.map((r) => r.provenance))].join(","),
);

const batch = await getImportBatch(result.batchId, dealership.id);
check("the ledger kept every source row, including the rejected one", batch.rows.length === 4, `${batch.rows.length} rows`);
check(
  "the ledger kept the dealer's raw cells verbatim",
  batch.rows[0].raw["Cost Price"] === "R 300 000",
  `raw cost price = ${batch.rows[0].raw["Cost Price"]}`,
);
check(
  "the rejected row explains itself rather than saying 'failed'",
  batch.rows.some((row) => row.decision === "rejected" && row.issues.some((issue) => /price/i.test(issue.message))),
);

const csvReport = buildImportReportCsv(batch);
check("the report names the columns that were not imported", csvReport.includes("Cost Price"));
check("the report contains every row, not only the problems", csvReport.split("\r\n").length >= 4 + 10);

const reverted = await revertImportBatch({ batchId: result.batchId, dealershipId: dealership.id });
check("undo removed exactly what the import created", reverted.deleted === 3, `${reverted.deleted} deleted`);

const after = await rest(
  `inventory_vehicles?select=id&dealership_id=eq.${dealership.id}&stock_number=like.PCP037-${stamp}*`,
);
check("nothing is left behind after undo", after.length === 0, `${after.length} remaining`);

const mediaAfter = await rest(
  `inventory_vehicle_media?select=id&vehicle_id=in.(${written.map((r) => r.id).join(",")})`,
);
check("photographs cascaded away with their vehicles", mediaAfter.length === 0, `${mediaAfter.length} remaining`);

const ledgerAfter = await getImportBatch(result.batchId, dealership.id);
check(
  "the import record survives the undo — the ledger is evidence, not a staging area",
  ledgerAfter !== null && ledgerAfter.rows.length === 4,
  `status=${ledgerAfter?.status}`,
);

rmSync(outDir, { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
