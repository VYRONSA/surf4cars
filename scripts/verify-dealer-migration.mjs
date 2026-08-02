/**
 * Dealer migration engine verification.
 *
 * WHY THIS RUNS THE ENGINE RATHER THAN A BROWSER
 * ==============================================
 * The wizard does not exist yet. What exists is the engine, and the engine is where every claim in
 * the founder report comes from — so this drives it directly through a compiled entry point, with
 * files shaped like the exports dealerships actually send.
 *
 * The scale runs are the part that matters. "A dealership can migrate in an afternoon" is a
 * performance claim, and a 250-vehicle migration that takes four minutes to validate is a different
 * product from one that takes four seconds.
 *
 * Usage:  node scripts/verify-dealer-migration.mjs
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

let pass = 0;
let fail = 0;
const failures = [];
const heading = (t) => console.log(`\n${t}\n${"─".repeat(t.length)}`);
function check(label, ok, detail = "") {
  if (ok) pass += 1;
  else {
    fail += 1;
    failures.push(label);
  }
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

/* ── Compile the engine to plain JS so it can be exercised without Next ───────────────────────
   The engine is deliberately free of React, Next and Supabase imports at plan time, which is what
   makes this possible — and is itself worth asserting, because the moment planning needs a request
   context it stops being testable at scale.
   ──────────────────────────────────────────────────────────────────────────────────────────── */

const OUT = ".migration-verify";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

heading("Build");
try {
  execSync(
    `npx esbuild src/features/dealer-migration/server/import-planner.ts --bundle --platform=node --format=esm --outfile=${OUT}/planner.mjs --alias:@=./src --log-level=error`,
    { stdio: "pipe" },
  );
  check("the planning engine bundles without a browser or request context", true);
} catch (error) {
  check("the planning engine bundles without a browser or request context", false, String(error).slice(0, 200));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(1);
}

const { buildImportPlan } = await import(`../${OUT}/planner.mjs`);

/* ── Fixtures ─────────────────────────────────────────────────────────────────────────────── */

const MAKES = [
  ["Toyota", ["Hilux", "Corolla Cross", "Fortuner"]],
  ["Volkswagen", ["Polo", "Golf", "Amarok"]],
  ["BMW", ["X5", "320i", "X3"]],
  ["Ford", ["Ranger", "EcoSport"]],
  ["Haval", ["Jolion", "H6"]],
];

/** An AutoTrader-shaped export: their column names, their quirks. */
function autotraderCsv(count) {
  const header =
    "Stock Ref,VIN,Reg No,Make,Model,Derivative,Model Year,Mileage,Fuel Type,Gearbox,Colour,Body Style,Retail Price,Advert Text,Features,Image URLs,Branch";
  const lines = [header];
  for (let i = 0; i < count; i += 1) {
    const [make, models] = MAKES[i % MAKES.length];
    const model = models[i % models.length];
    const images = Array.from({ length: (i % 9) + 1 }, (_, n) => `https://cdn.example.com/v${i}/${n}.jpg`).join(" ");
    lines.push(
      [
        `STK-${1000 + i}`,
        `WVW${String(i).padStart(14, "0")}`,
        `CA ${100 + i}-${200 + i}`,
        make,
        model,
        `2.0 TDI`,
        String(2018 + (i % 8)),
        `${(20 + (i % 180)) * 1000}`,
        i % 3 === 0 ? "Diesel" : "Petrol",
        i % 2 === 0 ? "Automatic" : "Manual",
        ["White", "Silver", "Black"][i % 3],
        i % 4 === 0 ? "Double Cab" : "SUV",
        `R ${(180 + (i % 400)) * 1000}`,
        i % 5 === 0 ? "" : `"Well maintained ${make} ${model}, full service history, one owner from new. Available for viewing at our branch."`,
        i % 6 === 0 ? "" : "Air Conditioning;Bluetooth;Reverse Camera;Cruise Control",
        images,
        "Main Branch",
      ].join(","),
    );
  }
  return lines.join("\n");
}

const EMPTY_CONTEXT = { existing: [], corpus: [], branchNames: ["Main Branch"] };

/* ── Adapter detection and mapping ───────────────────────────────────────────────────────── */

heading("Source detection and mapping");
{
  const plan = buildImportPlan({
    dealershipId: "d1",
    fileName: "stock.csv",
    content: autotraderCsv(5),
    ...EMPTY_CONTEXT,
  });

  check("recognises an AutoTrader export from its columns", plan.sourceKind === "autotrader", plan.sourceKind);

  const m = plan.mapping.mapping;
  const expected = {
    vin: "VIN",
    stockNumber: "Stock Ref",
    registration: "Reg No",
    make: "Make",
    model: "Model",
    variant: "Derivative",
    year: "Model Year",
    mileageKm: "Mileage",
    fuel: "Fuel Type",
    transmission: "Gearbox",
    colour: "Colour",
    bodyType: "Body Style",
    priceRand: "Retail Price",
    description: "Advert Text",
    equipment: "Features",
    imageUrls: "Image URLs",
    branch: "Branch",
  };
  const wrong = Object.entries(expected).filter(([field, column]) => m[field] !== column);
  check("maps all 17 columns to the right fields", wrong.length === 0, wrong.map(([f, c]) => `${f}≠${c}`).join(", ") || "all correct");
  check("nothing is left unexplained", plan.mapping.ignoredColumns.length === 0, plan.mapping.ignoredColumns.join(", ") || "no ignored columns");
}

{
  const csv = [
    "Stock No,Make,Model,Retail Price,Cost Price,Warranty Expiry,Internal Notes",
    "A1,Toyota,Hilux,R250 000,R180 000,2027-01-01,check paint",
  ].join(String.fromCharCode(10));
  const plan = buildImportPlan({ dealershipId: "d1", fileName: "x.csv", content: csv, ...EMPTY_CONTEXT });
  check(
    "columns SURF4CARS cannot use are reported, never dropped",
    plan.mapping.ignoredColumns.includes("Warranty Expiry"),
    plan.mapping.ignoredColumns.join(", "),
  );
  /*
    The two guesses that would do real commercial damage, and both were live until this ran.
    "Cost Price" ends in "price" and scored identically to "Retail Price"; on a file listing cost
    first, a dealership's buying price would have been published to the open marketplace.
  */
  check(
    "a cost price is never mapped to the public asking price",
    plan.mapping.mapping.priceRand === "Retail Price" && plan.mapping.ignoredColumns.includes("Cost Price"),
    `priceRand=${plan.mapping.mapping.priceRand}`,
  );
  check(
    "internal notes never become the public description",
    plan.mapping.mapping.description !== "Internal Notes" && plan.mapping.ignoredColumns.includes("Internal Notes"),
    `description=${plan.mapping.mapping.description ?? "unmapped"}`,
  );
}

/* ── Parsing the awkward cases ────────────────────────────────────────────────────────────── */

heading("Reading what dealers actually send");
{
  const csv = [
    "VIN,Make,Model,Price,Mileage,Advert Text",
    `V1,Toyota,Hilux,"R 249 900",45000,"Line one.\nLine two with a comma, and more."`,
    `V2,BMW,X5,"1.250.000,00",30000,short`,
    "V3,Ford,Ranger,R199950.00,12000,ok",
  ].join("\n");
  const plan = buildImportPlan({ dealershipId: "d1", fileName: "x.csv", content: csv, ...EMPTY_CONTEXT });

  check("a description containing newlines stays one row", plan.rows.length === 3, `${plan.rows.length} rows`);
  check("reads “R 249 900”", plan.rows[0].mapped.priceCents === 24_990_000, String(plan.rows[0].mapped.priceCents));
  check("reads European grouping “1.250.000,00”", plan.rows[1].mapped.priceCents === 125_000_000, String(plan.rows[1].mapped.priceCents));
  check("reads “R199950.00”", plan.rows[2].mapped.priceCents === 19_995_000, String(plan.rows[2].mapped.priceCents));
  check("row numbers match the dealer's spreadsheet", plan.rows[0].rowNumber === 2, `first data row is ${plan.rows[0].rowNumber}`);
}

/* ── Validation ───────────────────────────────────────────────────────────────────────────── */

heading("Validation — every rule explains itself");
{
  const nextYear = new Date().getFullYear() + 5;
  const csv = [
    "VIN,Stock No,Reg No,Make,Model,Model Year,Mileage,Price,Image URLs,Advert Text,Features",
    `GOOD1234567890123,S1,CA 111-111,Toyota,Hilux,2022,45000,R250 000,https://a/1.jpg https://a/2.jpg https://a/3.jpg https://a/4.jpg https://a/5.jpg https://a/6.jpg,"A properly written description that runs past sixty characters so it counts.",Bluetooth`,
    `GOOD1234567890123,S2,CA 222-222,Toyota,Hilux,2022,45000,R250 000,https://a/1.jpg,short,`,
    `BAD2,S1,CA 333-333,Toyota,Hilux,${nextYear},45000,R250 000,,,`,
    `BAD3,S3,CA 444-444,Toyota,Hilux,2022,9999999,R250 000,,,`,
    `BAD4,S4,CA 555-555,Toyota,Hilux,2022,45000,-500,,,`,
    `BAD5,S5,CA 666-666,,Hilux,2022,45000,R250 000,,,`,
    `BAD6,S6,CA 777-777,Toyota,Hilux,2022,45000,,,,`,
    `BAD7,S7,CA 888-888,Toyota,Hilux,2022,45000,notaprice,,,`,
  ].join("\n");

  const plan = buildImportPlan({ dealershipId: "d1", fileName: "x.csv", content: csv, ...EMPTY_CONTEXT });
  const at = (n) => plan.rows.find((row) => row.rowNumber === n);
  const has = (n, needle) => (at(n)?.issues ?? []).some((i) => i.message.toLowerCase().includes(needle));

  check("duplicate VIN inside the file is rejected and names the other row", has(3, "row 2"), (at(3)?.issues ?? []).map((i) => i.message)[0] ?? "");
  check("duplicate stock number is caught", has(4, "stock number also appears"));
  /* Row 1 is the header, so the first data line is row 2 and the eight faulty rows run 4–9. The
     first version of these assertions was off by one and reported six failures against a validator
     that was working — the summary said 7 rejected the whole time. */
  check("a model year in the future is rejected", has(4, "further ahead"));
  check("an impossible mileage is rejected", has(5, "not a plausible reading"));
  check("a negative price is rejected", has(6, "negative"));
  check("a missing make is rejected", has(7, "no make"));
  check("a missing price is rejected", has(8, "no asking price"));
  check("an unreadable price is rejected", has(9, "could not read the price"));

  check("no photographs raises a warning, not a rejection", has(4, "no photographs"));
  check("a thin description warns", has(3, "no description worth publishing"));
  check("every issue names a row and a column", plan.rows.every((row) => row.issues.every((i) => i.rowNumber > 0 && (i.sourceColumn !== undefined))));
  check("a complete row imports cleanly", at(2)?.decision === "import" && (at(2)?.issues.length ?? 1) === 0, `decision ${at(2)?.decision}, ${at(2)?.issues.length} issues`);
  check("rejected rows are counted separately from warnings", plan.summary.rejected >= 6, `${plan.summary.rejected} rejected`);
}

/* ── Duplicates against existing stock ────────────────────────────────────────────────────── */

heading("Duplicates never overwrite");
{
  const existing = [
    {
      id: "veh-1",
      core: { vin: "EXIST1234567890AB", title: "2022 Toyota Hilux", registration: "CA 999-999" },
      dealer: { stockNumber: "STK-9" },
    },
  ];
  const csv = [
    "VIN,Stock No,Make,Model,Price,Image URLs,Advert Text",
    `EXIST1234567890AB,STK-NEW,Toyota,Hilux,R260 000,https://a/1.jpg,"A description long enough to be worth publishing on the marketplace today."`,
    `NEWVIN00000000001,STK-9,Toyota,Hilux,R270 000,https://a/1.jpg,"A description long enough to be worth publishing on the marketplace today."`,
    `NEWVIN00000000002,STK-X,Toyota,Hilux,R280 000,https://a/1.jpg,"A description long enough to be worth publishing on the marketplace today."`,
  ].join("\n");

  const plan = buildImportPlan({ dealershipId: "d1", fileName: "x.csv", content: csv, existing, corpus: [], branchNames: [] });
  const at = (n) => plan.rows.find((row) => row.rowNumber === n);

  check("a matching VIN is detected", at(2)?.matchedVehicleId === "veh-1", at(2)?.matchReason ?? "no match");
  check("a matching stock number is detected", at(3)?.matchedVehicleId === "veh-1", at(3)?.matchReason ?? "no match");
  check("the default for a duplicate is to keep what exists", at(2)?.decision === "skip" && at(3)?.decision === "skip");
  check("nothing is marked for update without the dealer asking", plan.summary.toUpdate === 0);
  check("a genuinely new vehicle still imports", at(4)?.decision === "import");
}

/* ── Readiness reuses the shared engine ───────────────────────────────────────────────────── */

heading("Readiness");
{
  const rich = `https://a/1.jpg https://a/2.jpg https://a/3.jpg https://a/4.jpg https://a/5.jpg https://a/6.jpg`;
  const csv = [
    "VIN,Make,Model,Price,Mileage,Fuel Type,Gearbox,Body Style,Engine,Colour,Image URLs,Advert Text,Features",
    `FULL1234567890123,Toyota,Hilux,R250 000,45000,Diesel,Automatic,Double Cab,2.8 GD-6,White,${rich},"A properly written description that runs comfortably past sixty characters.",Bluetooth;Cruise Control`,
    `THIN1234567890123,Toyota,Hilux,R250 000,45000,,,,,,https://a/1.jpg,,`,
  ].join("\n");
  const plan = buildImportPlan({ dealershipId: "d1", fileName: "x.csv", content: csv, ...EMPTY_CONTEXT });

  check("a complete listing scores ready", plan.rows[0].readinessState === "ready", `${plan.rows[0].readinessScore}%`);
  check("a bare listing is flagged rather than rejected", plan.rows[1].decision === "import" && plan.rows[1].readinessState !== "ready", `${plan.rows[1].readinessScore}% ${plan.rows[1].readinessState}`);
  check("readiness is reported per row", plan.rows.every((row) => typeof row.readinessScore === "number"));
}

/* ── Scale ────────────────────────────────────────────────────────────────────────────────── */

heading("Scale — the afternoon test");
const timings = [];
for (const count of [20, 50, 100, 300, 1000]) {
  const content = autotraderCsv(count);
  const before = process.memoryUsage().heapUsed;
  const started = performance.now();
  const plan = buildImportPlan({ dealershipId: "d1", fileName: `stock-${count}.csv`, content, ...EMPTY_CONTEXT });
  const ms = performance.now() - started;
  const mb = (process.memoryUsage().heapUsed - before) / 1024 / 1024;
  timings.push({ count, ms, mb, rows: plan.rows.length, images: plan.summary.imagesFound });
  console.log(
    `  ${String(count).padStart(4)} vehicles  ${ms.toFixed(0).padStart(5)}ms  ${mb.toFixed(1).padStart(6)}MB heap  ` +
      `${plan.summary.toImport} to import, ${plan.summary.rejected} rejected, ${plan.summary.imagesFound} photographs`,
  );
  if (plan.rows.length !== count) {
    check(`${count} rows all planned`, false, `${plan.rows.length} planned`);
  }
}
const thousand = timings.find((t) => t.count === 1000);
check("1 000 vehicles plan in under 5 seconds", thousand.ms < 5000, `${thousand.ms.toFixed(0)}ms`);
check("planning scales roughly linearly", thousand.ms / (timings[0].ms || 1) < 200, `20→1000 is ${(thousand.ms / (timings[0].ms || 1)).toFixed(0)}×`);

/* ── Architecture ─────────────────────────────────────────────────────────────────────────── */

heading("Architecture (Phase 13)");
{
  const adapters = readFileSync("src/features/dealer-migration/adapters/index.ts", "utf8");
  check(
    "no adapter touches the database",
    !/supabase|createClient|from\(/.test(adapters.replace(/\/\*[\s\S]*?\*\//g, "")),
    "adapters parse only",
  );
  const planner = readFileSync("src/features/dealer-migration/server/import-planner.ts", "utf8");
  check(
    "readiness comes from the existing engine, not a second one",
    planner.includes("buildListingReadiness") && !/function\s+scoreListing/.test(planner),
  );
  check(
    "adding a source touches only the adapter registry",
    adapters.includes("SOURCE_ADAPTERS") && !/import .*validation|import .*column-mapping/.test(adapters),
  );
}

rmSync(OUT, { recursive: true, force: true });

writeFileSync(
  "docs/reports/pcp036-performance.json",
  JSON.stringify({ measuredAt: null, timings }, null, 2),
);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFAILED:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(fail > 0 ? 1 : 0);
