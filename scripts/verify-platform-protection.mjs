/**
 * PCP-048 — Platform Protection verification.
 *
 * Probes the platform the way an unauthenticated stranger would: with the anon key, which is public
 * by design — it ships in the client bundle and appears in the Content-Security-Policy header. This
 * is not a test of our code, it is a test of what the database will hand out to anybody who asks.
 *
 * Two halves, and both matter:
 *
 *   MUST BE CLOSED   identifiers and internal state that no shopper needs.
 *   MUST STAY OPEN   the columns the marketplace itself renders. A protection change that quietly
 *                    breaks the shop window is worse than the exposure it fixed, and "nothing looked
 *                    different locally" is how that ships. The open checks are here so a revoke that
 *                    goes one column too far fails loudly rather than at a dealer's expense.
 *
 * Run before and after applying a migration; the output is designed to be diffed.
 *
 *   node scripts/verify-platform-protection.mjs
 */

import { readFileSync } from "node:fs";

/* ── Environment ──────────────────────────────────────────────────────────────────────────────── */

function loadEnv() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

const env = loadEnv();
const SUPABASE_URL = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.");
  process.exit(1);
}

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

/* ── Reporting ────────────────────────────────────────────────────────────────────────────────── */

let failures = 0;

const heading = (text) => console.log(`\n${text}\n${"─".repeat(text.length)}`);

function check(label, passed, detail = "") {
  if (!passed) failures += 1;
  console.log(`  ${passed ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

/**
 * Reads one column as `anon`.
 *
 * A 200 means the column is readable. 401/403 is a privilege refusal and 400 is PostgREST reporting
 * that the column is not selectable — both are "closed" for our purposes, and the distinction is
 * reported rather than flattened, because a 400 can also mean the column was renamed. A check that
 * passes because the column no longer exists is not the check anybody thought they were running.
 */
async function readColumn(table, column) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${column}&limit=1`, { headers });
  return { open: response.status === 200, status: response.status };
}

/* ── Must be closed ───────────────────────────────────────────────────────────────────────────── */

heading("Vehicle identity documents are not public");

for (const column of ["vin", "registration_number"]) {
  const { open, status } = await readColumn("inventory_vehicles", column);
  check(`inventory_vehicles.${column} is refused to anon`, !open, `HTTP ${status}`);
}

heading("Internal state is not public");

for (const [table, column] of [
  ["dealerships", "owner_user_id"],
  ["dealerships", "subscription_package"],
  ["dealerships", "verification_note"],
  ["inventory_vehicles", "lead_count_30d"],
  ["inventory_vehicles", "created_by"],
]) {
  const { open, status } = await readColumn(table, column);
  check(`${table}.${column} is refused to anon`, !open, `HTTP ${status}`);
}

heading("Whole-table reads are refused");

for (const table of ["dealerships", "inventory_vehicles"]) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, { headers });
  check(`${table} select=* is refused to anon`, response.status !== 200, `HTTP ${response.status}`);
}

/* ── Must stay open ───────────────────────────────────────────────────────────────────────────── */

heading("The marketplace still works");

for (const [table, column] of [
  ["inventory_vehicles", "id"],
  ["inventory_vehicles", "title"],
  ["inventory_vehicles", "asking_price_cents"],
  ["inventory_vehicles", "make"],
  ["inventory_vehicles", "lifecycle_status"],
  ["dealerships", "business_name"],
  ["dealerships", "city"],
  ["dealerships", "is_demonstration"],
]) {
  const { open, status } = await readColumn(table, column);
  check(`${table}.${column} still readable`, open, `HTTP ${status}`);
}

/* ── Harvesting reach ─────────────────────────────────────────────────────────────────────────── */

heading("Harvesting reach (reported, not asserted)");

const bulk = await fetch(`${SUPABASE_URL}/rest/v1/inventory_vehicles?select=id&limit=100000`, {
  headers: { ...headers, Prefer: "count=exact" },
});
const range = bulk.headers.get("content-range") ?? "unknown";
const rows = bulk.status === 200 ? JSON.parse(await bulk.text()).length : 0;

console.log(`  rows returned in one anonymous request : ${rows}`);
console.log(`  content-range                          : ${range}`);
console.log(
  "  note: row-count reach is a PostgREST setting, not a grant. Capping it is a separate control",
);
console.log("        (db-max-rows) and is deliberately not asserted here.");

/* ── Result ───────────────────────────────────────────────────────────────────────────────────── */

console.log(
  failures === 0
    ? "\nAll platform protection checks passed.\n"
    : `\n${failures} check(s) failed.\n`,
);

process.exit(failures === 0 ? 0 : 1);
