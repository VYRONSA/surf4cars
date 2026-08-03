/**
 * Homepage merchandising verification (PCP-041A).
 *
 * TWO PASSES, BECAUSE THEY FAIL DIFFERENTLY
 * =========================================
 * The first bundles the merchandising engine and asks it about vehicles that are not in stock —
 * Ferraris, a C63, a Golf GTI, an i30 N. That coverage cannot come from the live marketplace, which
 * today holds no genuine performance car at all, and a rule nobody can exercise is a rule nobody can
 * trust. It also pins the distinction the whole layer turns on: an "AMG Line" is a bumper, a "C63
 * AMG" is an engine, and merchandising the first as the second is the exact convincing-fabrication
 * failure AGENTS.md was written about.
 *
 * The second loads the real homepage and checks what a visitor actually gets: rails in the right
 * order, no vehicle shown twice, no photograph shown twice, and — the one that matters most — no
 * headline claiming something the cars beneath it do not support.
 *
 *   npm run build && npx next start -p 3100
 *   node scripts/verify-homepage-merchandising.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { chromium } from "playwright";

const APP = process.env.APP_URL ?? "http://localhost:3100";

let passed = 0;
let failed = 0;
const failures = [];
const heading = (text) => console.log(`\n${text}\n${"─".repeat(text.length)}`);
const check = (label, ok, detail = "") => {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

/* ── Build the engine in isolation ────────────────────────────────────────────────────────────── */

const OUT = ".merchandising-verify";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

console.log("\nHomepage merchandising (PCP-041A)\n─────────────────────────────────");
heading("Build");

const bundle = (entry, name) =>
  execSync(
    `npx esbuild ${entry} --bundle --platform=node --format=esm --outfile=${OUT}/${name}.mjs --alias:@=./src --log-level=error`,
    { stdio: "pipe" },
  );

try {
  bundle("src/services/presentation/vehicle-merchandising.service.ts", "merchandising");
  bundle("src/config/media/index.ts", "media");
  check("the merchandising engine bundles with no browser or request context", true);
} catch (error) {
  check("the merchandising engine bundles with no browser or request context", false, String(error).slice(0, 200));
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(1);
}

const { buildPriceContext, classifyAspiration, classifySegment, railCopy, rankByAspiration } = await import(
  `../${OUT}/merchandising.mjs`
);
const { isEditorialGrade, isPresentablePhotograph } = await import(`../${OUT}/media.mjs`);

/* A price distribution wide enough for the bands to mean something. R60k … R2m. */
const PRICES = Array.from({ length: 40 }, (_, index) => (60_000 + index * 50_000) * 100);
const context = buildPriceContext(PRICES);

const vehicle = (make, model, variant, extra = {}) => ({
  id: `${make}-${model}-${variant ?? ""}`,
  imageSrc: "/images/vehicles/library/example/front.webp",
  make,
  model,
  variant,
  bodyType: "SUV",
  priceCents: 500_000_00,
  ...extra,
});

const verdictFor = (make, model, variant, extra) =>
  classifyAspiration(vehicle(make, model, variant, extra), context);

/* ── A trim package is not a performance car ──────────────────────────────────────────────────── */

heading("Appearance packages must never read as performance models");

/*
  Every one of these is in the live inventory today, and every one shares its letters with a genuine
  performance sub-brand. This is the single most consequential rule in the layer: a naive match here
  puts a Kia Sonet GT-Line in a rail promising supercars.
*/
for (const [make, model, variant] of [
  ["Mercedes-Benz", "C-Class", "C200 AMG Line"],
  ["BMW", "X3", "xDrive30d M Sport"],
  ["BMW", "320i", "M Sport"],
  ["Audi", "Q5", "40 TDI quattro S line"],
  ["Audi", "A3", "35 TFSI S line"],
  ["Jaguar", "F-Pace", "R-Dynamic"],
  ["Kia", "Sportage", "1.6T GT-Line"],
  ["Kia", "Sonet", "1.0T GT-Line"],
  ["Hyundai", "Tucson", "2.0 N Line"],
  ["Lexus", "NX", "350h F Sport"],
  ["Volkswagen", "Tiguan", "1.4 TSI R-Line"],
]) {
  const verdict = verdictFor(make, model, variant);
  check(`"${variant}" is a trim, not a badge`, verdict.badge === null, verdict.badge ?? "no badge");
}

heading("Genuine performance models must be recognised");

for (const [make, model, variant] of [
  ["Mercedes-Benz", "C-Class", "C63 AMG"],
  ["Mercedes-Benz", "A-Class", "A45 S"],
  ["BMW", "M3", "Competition"],
  ["BMW", "X5", "M"],
  ["BMW", "3 Series", "M340i xDrive"],
  ["Audi", "RS6", "Avant"],
  ["Audi", "S3", "Sportback"],
  ["Volkswagen", "Golf", "GTI"],
  ["Ford", "Ranger", "3.0 V6 Raptor"],
  ["Honda", "Civic", "Type R"],
  ["Nissan", "GT-R", "Premium"],
  ["Porsche", "911", "GT3"],
  ["Toyota", "GR Yaris", "1.6T"],
  ["Hyundai", "i30", "N"],
  ["Land Rover", "Range Rover Sport", "SVR"],
]) {
  const verdict = verdictFor(make, model, variant);
  check(`${make} ${model} ${variant} carries a genuine badge`, verdict.badge !== null, verdict.badge ?? "none");
}

heading("Badges are scoped to the marque that uses them");

/*
  "RS" on an Audi is Quattro GmbH; on a Toyota Hilux Legend RS it is a decal, and that exact vehicle
  is in the live inventory. A global pattern cannot tell them apart.
*/
check(
  "Toyota Hilux Legend RS is not treated as a performance model",
  verdictFor("Toyota", "Hilux", "2.8 GD-6 Legend RS").badge === null,
);
check("Audi RS3 is", verdictFor("Audi", "RS3", "Sportback").badge !== null);
check(
  "Toyota Fortuner VX is not promoted by the Toyota badge list",
  verdictFor("Toyota", "Fortuner", "2.8 GD-6 VX").badge === null,
);

/* ── Standing, price and tiering ──────────────────────────────────────────────────────────────── */

heading("Marque standing and tiering");

check("Ferrari is exotic", verdictFor("Ferrari", "Roma", null).marque === "exotic");
check("Rolls-Royce is exotic", verdictFor("Rolls-Royce", "Ghost", null).marque === "exotic");
check("BMW is luxury", verdictFor("BMW", "X3", "xDrive20d").marque === "luxury");
check("Suzuki is mainstream", verdictFor("Suzuki", "Swift", "1.2 GL").marque === "mainstream");
check(
  "an unknown marque is never guessed upward",
  verdictFor("Wuling", "Almaz", null).marque === "mainstream",
);

check(
  "an exotic marque is exceptional even when it is not expensive",
  verdictFor("Porsche", "Boxster", null, { priceCents: 200_000_00 }).tier === "exceptional",
);
check(
  "a luxury marque at an ordinary price is premium, not exceptional",
  verdictFor("BMW", "X1", "sDrive18i", { priceCents: 300_000_00 }).tier === "premium",
);
check(
  "a luxury marque at the top of the market is exceptional",
  verdictFor("BMW", "X7", "xDrive40i", { priceCents: 2_000_000_00 }).tier === "exceptional",
);
check(
  "an ordinary mainstream car is everyday",
  verdictFor("Suzuki", "Swift", "1.2 GL", { priceCents: 135_000_00 }).tier === "everyday",
);
check(
  "a genuine performance model is exceptional whatever the marque",
  verdictFor("Ford", "Ranger", "3.0 V6 Raptor", { priceCents: 400_000_00 }).tier === "exceptional",
);

heading("Missing fields are gaps in a record, not modest cars");

const sparse = classifyAspiration(
  { id: "sparse", imageSrc: "/x.webp", make: "Ferrari", model: "812" },
  context,
);
check("a vehicle with no body type or price still classifies", sparse.tier === "exceptional");
check("and its price band is simply unset", sparse.priceBand === null);

/* ── The price context is a fact about the marketplace ────────────────────────────────────────── */

heading("Price banding is a percentile, not a fixed rand figure");

check("a marketplace of four priced cars gets no price context", buildPriceContext([1, 2, 3, 4].map((n) => n * 100_00)) === null);
check("a marketplace of forty does", context !== null && context.sample === 40);
/*
  R1.9m tops a marketplace running to R2m and is unremarkable in one running to R4.9m. The first
  version of this check used R900k, which is mid-market in both — it asserted nothing, and passing it
  would have told me the bands worked when they had never been exercised.
*/
const dearMarket = buildPriceContext(Array.from({ length: 40 }, (_, i) => (1_000_000 + i * 100_000) * 100));
const expensiveCar = (prices) =>
  classifyAspiration(vehicle("Kia", "Sportage", "1.6T", { priceCents: 1_900_000_00 }), prices).priceBand;
check(
  "the same car is judged against the market it is in",
  expensiveCar(context) === "top" && expensiveCar(dearMarket) === "mid",
  `${expensiveCar(context)} here, ${expensiveCar(dearMarket)} in a dearer market`,
);

/* ── Ranking ──────────────────────────────────────────────────────────────────────────────────── */

heading("Ranking");

const ranked = rankByAspiration(
  [
    vehicle("Suzuki", "Swift", "1.2 GL", { priceCents: 135_000_00 }),
    vehicle("BMW", "X3", "xDrive30d M Sport"),
    vehicle("Ferrari", "Roma", null),
    vehicle("Ford", "Ranger", "3.0 V6 Raptor"),
  ],
  context,
);
check("the exotic marque leads", ranked[0].vehicle.make === "Ferrari", ranked.map((r) => r.vehicle.make).join(" > "));
check("the mainstream hatch is last", ranked.at(-1).vehicle.make === "Suzuki");
check(
  "a genuine performance model outranks a trim package",
  ranked.findIndex((r) => r.vehicle.make === "Ford") < ranked.findIndex((r) => r.vehicle.make === "BMW"),
);

/* ── The headline may not outrun the cars ─────────────────────────────────────────────────────── */

heading("A rail may only claim what its cars support");

const verdicts = (...specs) => specs.map(([make, model, variant, extra]) => verdictFor(make, model, variant, extra));

const oneRaptorInFive = verdicts(
  ["Ford", "Ranger", "3.0 V6 Raptor"],
  ["Audi", "Q5", "40 TDI quattro S line"],
  ["Audi", "Q3", "40 TDI quattro"],
  ["Lexus", "NX", "350h SE"],
  ["Mercedes-Benz", "C-Class", "C200 AMG Line"],
);
const mixedCopy = railCopy("exceptional", oneRaptorInFive);
check(
  "one performance car among five does not make the rail 'genuine performance models'",
  !/genuine performance models/i.test(mixedCopy.description ?? ""),
  mixedCopy.headline,
);
check(
  "…it says something true of the mixture instead",
  mixedCopy.headline === "Performance and prestige",
  mixedCopy.headline,
);

/*
  The finer version of the same failure: the cars beside the standout are expensive rather than
  premium. "Prestige" is a claim about the marque, and a Kia Sportage does not carry it however much
  it costs.
*/
/* Priced into the upper band of the synthetic market above, so they reach the rail on price alone —
   which is the whole point of the check. At their real-world prices they would be everyday cars in
   this fixture's market and the branch under test would never be reached. */
const oneRaptorAmongExpensiveMainstream = verdicts(
  ["Ford", "Ranger", "3.0 V6 Raptor"],
  ["Kia", "Sportage", "1.6T GT-Line", { priceCents: 1_600_000_00 }],
  ["Volkswagen", "Amarok", "3.0 V6 Aventura", { priceCents: 1_700_000_00 }],
  ["Toyota", "Prado", "3.0 DT VX", { priceCents: 1_650_000_00 }],
);
const priceLedCopy = railCopy("exceptional", oneRaptorAmongExpensiveMainstream);
check(
  "expensive mainstream cars are not introduced as 'premium marques'",
  !/premium marques/i.test(priceLedCopy.description ?? ""),
  priceLedCopy.headline,
);
check(
  "…the rail describes them by price instead, which is what they are",
  /highest-priced/i.test(priceLedCopy.description ?? ""),
  priceLedCopy.description ?? "",
);

/*
  A majority is not enough for a plural sentence, and the smallest rail is where that bites. Two
  cards, one of them a genuine Raptor, is a 50% share — and "these are genuine performance models"
  would still be false of the Audi beside it. This is the live case after the photography standard
  thinned the rail, not a hypothetical.
*/
const twoCardsOneBadge = verdicts(
  ["Ford", "Ranger", "3.0 V6 Raptor"],
  ["Audi", "A3", "35 TFSI S line"],
);
check(
  "half a rail carrying a badge does not earn a plural performance claim",
  !/genuine performance models/i.test(railCopy("exceptional", twoCardsOneBadge).description ?? ""),
  railCopy("exceptional", twoCardsOneBadge).headline,
);
check(
  "…it becomes 'Performance and prestige', which is true of both",
  railCopy("exceptional", twoCardsOneBadge).headline === "Performance and prestige",
);

const allPerformance = verdicts(
  ["Ford", "Ranger", "3.0 V6 Raptor"],
  ["BMW", "M3", "Competition"],
  ["Audi", "RS6", "Avant"],
);
check(
  "a rail where every car is a genuine performance model does earn the claim",
  /genuine performance models/i.test(railCopy("exceptional", allPerformance).description ?? ""),
);

const allExotic = verdicts(
  ["Ferrari", "Roma", null],
  ["Lamborghini", "Urus", null],
  ["Porsche", "911", "Carrera"],
);
check(
  "a rail of exotic marques earns the strongest headline",
  railCopy("exceptional", allExotic).headline === "Cars you do not see every day",
);
check(
  "…and one ordinary SUV among them takes it away",
  railCopy("exceptional", [...allExotic, ...verdicts(["BMW", "X5", "xDrive40i"])]).headline
    !== "Cars you do not see every day",
);

const nothingSpecial = verdicts(
  ["Toyota", "Land Cruiser 300", "3.3 ZX", { priceCents: 1_480_000_00 }],
  ["Suzuki", "Swift", "1.2 GL", { priceCents: 135_000_00 }],
);
const plainCopy = railCopy("exceptional", nothingSpecial);
check(
  "a rail with nothing extraordinary in it says so",
  plainCopy.headline === "The best of what is listed today",
  plainCopy.headline,
);
check(
  "…and makes no premium claim when an ordinary car is in the rail",
  plainCopy.description === null,
);

const mainstreamPremiumRail = verdicts(
  ["Toyota", "Prado", "3.0 DT VX", { priceCents: 745_000_00 }],
  ["Ford", "Everest", "2.0 BiT XLT", { priceCents: 695_000_00 }],
  ["Volkswagen", "Amarok", "3.0 V6", { priceCents: 800_000_00 }],
);
check(
  "a price-led rail of mainstream marques is not headlined 'Premium marques'",
  railCopy("premium", mainstreamPremiumRail).headline !== "Premium marques",
  railCopy("premium", mainstreamPremiumRail).headline,
);

/* ── The rendered homepage ────────────────────────────────────────────────────────────────────── */

heading("The homepage a visitor actually gets");

/*
  Approve the library for the duration of this suite, then put it back exactly as it was.
  ======================================================================================
  PCP-043 gated every homepage rail on Founder approval, and nothing is approved — so on the live
  marketplace these assertions had nothing to measure and three of them failed. The tempting fix is
  to make them conditional and skip, which would quietly retire the segmentation coverage the moment
  it stopped being exercised: a suite that reports green because it checked nothing is worse than
  one that fails.

  So this approves every in-use photograph that is not rejected, measures the page the segments
  produce, and restores each row to its previous state — including deleting the rows that did not
  exist. The gate itself is proved separately, in both directions, by `verify-founder-curation.mjs`.
*/
const { createClient: createDb } = await import("@supabase/supabase-js");
const envForApproval = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
);
const approvalDb = createDb(envForApproval.NEXT_PUBLIC_SUPABASE_URL, envForApproval.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const { data: mediaRows } = await approvalDb.from("inventory_vehicle_media").select("file_url").limit(4000);
const { data: reviewRows } = await approvalDb.from("media_reviews").select("photograph,state,note");

const priorByPhotograph = new Map((reviewRows ?? []).map((row) => [row.photograph, row]));
/*
  Only genuinely unreviewed frames. The first version approved everything not rejected, which
  included the frames already recorded as search-only — and the suite promptly caught itself putting
  a petrol-station forecourt and a motor show hall on the homepage. A harness that overrides a
  recorded decision to make its own assertions pass is not testing the product.
*/
const inUsePhotographs = [...new Set((mediaRows ?? []).map((row) => row.file_url).filter(Boolean))].filter(
  (url) => !priorByPhotograph.has(url),
);

const restoreReviews = async () => {
  const created = inUsePhotographs.filter((url) => !priorByPhotograph.has(url));
  if (created.length > 0) await approvalDb.from("media_reviews").delete().in("photograph", created);
  const changed = inUsePhotographs
    .map((url) => priorByPhotograph.get(url))
    .filter(Boolean)
    .map((row) => ({ photograph: row.photograph, state: row.state, note: row.note }));
  if (changed.length > 0) await approvalDb.from("media_reviews").upsert(changed, { onConflict: "photograph" });
};

await approvalDb.from("media_reviews").upsert(
  inUsePhotographs.map((url) => ({
    photograph: url,
    state: "approved_homepage",
    note: "temporary — merchandising verification",
  })),
  { onConflict: "photograph" },
);
check(`approved ${inUsePhotographs.length} photographs for the duration of this suite`, inUsePhotographs.length > 0);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

/*
  Wait for a render that matches *these* approvals, not merely for one that has rails on it.
  =========================================================================================
  The first version polled until any rail appeared, and the homepage is revalidated rather than
  rendered per request — so it accepted the previous run's cached page, which had been generated
  while a broader set of approvals was live. The suite then reported three non-editorial frames on
  the homepage and sent me looking for a bug in the gate that was really a bug in the harness.

  Matching the rendered photographs against the approved set makes staleness impossible to mistake
  for a failure: a stale page simply does not match, and the loop keeps waiting.
*/
const approvedSet = new Set(inUsePhotographs);
const renderedPhotographs = async () =>
  page.locator('section[data-rail] a[href^="/vehicle/"] img').evaluateAll((images) =>
    images.map((image) => {
      const raw = image.getAttribute("src") ?? "";
      try {
        return decodeURIComponent(new URL(raw, location.origin).searchParams.get("url") ?? raw);
      } catch {
        return raw;
      }
    }),
  );

let attempts = 0;
let matched = false;
for (; attempts < 40 && !matched; attempts += 1) {
  await page.goto(`${APP}/`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const shown = await renderedPhotographs();
  matched = shown.length > 0 && shown.every((src) => approvedSet.has(src));
  if (!matched) await page.waitForTimeout(4000);
}
check("the rendered page reflects exactly these approvals", matched, `after ${attempts} polls`);

await page.goto(`${APP}/`, { waitUntil: "load" });
await page.locator("[data-rail]").first().waitFor({ state: "visible", timeout: 20000 }).catch(() => {});

const railsOnPage = await page.locator("section[data-rail]").evaluateAll((sections) =>
  sections.map((section) => ({
    key: section.getAttribute("data-rail"),
    heading: section.querySelector("h2")?.textContent?.trim() ?? "",
    description: section.querySelector("h2 + p")?.textContent?.trim() ?? "",
    cards: [...section.querySelectorAll('a[href^="/vehicle/"]')].map((anchor) => ({
      href: anchor.getAttribute("href"),
      title: anchor.querySelector("h3")?.textContent?.trim() ?? "",
      image: anchor.querySelector("img")?.getAttribute("src") ?? "",
    })),
  })),
);

check("the homepage renders at least one vehicle rail", railsOnPage.length >= 1, `${railsOnPage.length} rails`);
console.log(
  railsOnPage.map((rail) => `        · ${rail.key}: "${rail.heading}" (${rail.cards.length} cars)`).join("\n"),
);

const SEGMENT_ORDER = [
  "homepage-featured",
  "sports-performance",
  "luxury",
  "premium-suv",
  "executive-sedan",
  "family",
  "commercial",
  "marketplace",
];
const merchandised = railsOnPage.filter((rail) => SEGMENT_ORDER.includes(rail.key));
check("the merchandised rails are present", merchandised.length >= 1, merchandised.map((r) => r.key).join(" → "));

/* A plural heading over one card reads as a section that failed to load. Only the lead rail, which
   is allowed to be a single large photograph, may be shorter than two. */
const shortTrailingRails = railsOnPage.slice(1).filter((rail) => rail.cards.length === 1);
check(
  "no rail below the first stands on a single card",
  shortTrailingRails.length === 0,
  shortTrailingRails.map((rail) => rail.key).join(", "),
);

const order = merchandised.map((rail) => rail.key);
check(
  "the segments run in the Founder's order, with the broader marketplace last",
  order.every((key, index) => index === 0 || SEGMENT_ORDER.indexOf(key) > SEGMENT_ORDER.indexOf(order[index - 1])),
  order.join(" → "),
);

/*
  Editorial below the stock, which is the whole of item 1.
  ======================================================
  "Find your next journey" is the lifestyle block. It is checked by position rather than by absence,
  because the requirement is not that it is gone — it is that a visitor meets vehicles first.
*/
const positions = await page.evaluate(() => {
  const find = (text) =>
    [...document.querySelectorAll("h2")].find((node) => node.textContent.trim().startsWith(text));
  const topOf = (node) => (node ? Math.round(node.getBoundingClientRect().top + window.scrollY) : null);
  const rails = [...document.querySelectorAll("section[data-rail]")].map((section) => ({
    key: section.getAttribute("data-rail"),
    top: Math.round(section.getBoundingClientRect().top + window.scrollY),
  }));
  return { editorial: topOf(find("Find your next journey")), rails };
});

const lastSegmentTop = Math.max(
  ...positions.rails.filter((rail) => rail.key !== "marketplace").map((rail) => rail.top),
);
check(
  "the editorial collections sit below every segment rail",
  positions.editorial === null || positions.editorial > lastSegmentTop,
  positions.editorial === null ? "not present" : `editorial at ${positions.editorial}px, last rail at ${lastSegmentTop}px`,
);

const firstRailTop = Math.min(...positions.rails.map((rail) => rail.top));
check(
  "the first thing below the hero is vehicles for sale",
  positions.editorial === null || firstRailTop < positions.editorial,
  `first rail ${firstRailTop}px`,
);

/* Never the same vehicle twice, and never the same photograph twice — across every rail on the page. */
const allCards = railsOnPage.flatMap((rail) => rail.cards.map((card) => ({ ...card, rail: rail.key })));
const hrefCounts = new Map();
const imageCounts = new Map();
for (const card of allCards) {
  hrefCounts.set(card.href, [...(hrefCounts.get(card.href) ?? []), card.rail]);
  if (card.image) imageCounts.set(card.image, [...(imageCounts.get(card.image) ?? []), card.rail]);
}
const repeatedVehicles = [...hrefCounts.entries()].filter(([, rails]) => rails.length > 1);
const repeatedImages = [...imageCounts.entries()].filter(([, rails]) => rails.length > 1);
check(
  `no vehicle appears in more than one rail (${allCards.length} cards)`,
  repeatedVehicles.length === 0,
  repeatedVehicles.slice(0, 3).map(([href, rails]) => `${href} in ${rails.join("+")}`).join("; "),
);
check(
  "no photograph appears more than once on the page",
  repeatedImages.length === 0,
  repeatedImages.slice(0, 3).map(([src, rails]) => `${src.split("/").slice(-2).join("/")} in ${rails.join("+")}`).join("; "),
);

/*
  The photography rules still bind. This is the founder rule that merchandising is most likely to
  break — an expensive car with a bad photograph is exactly the trade the ranking wants to make.
*/
const decodeNextImage = (src) => {
  if (!src.startsWith("/_next/image")) return src;
  try {
    return decodeURIComponent(new URL(src, APP).searchParams.get("url") ?? src);
  } catch {
    return src;
  }
};
const railImages = allCards.map((card) => decodeNextImage(card.image)).filter(Boolean);
const notPresentable = railImages.filter((src) => !isPresentablePhotograph(src));
const notEditorial = railImages.filter((src) => !isEditorialGrade(src));
check("no denied photograph reaches the homepage", notPresentable.length === 0, notPresentable.slice(0, 3).join(", "));
check(
  "no non-editorial photograph leads a homepage card, however expensive the car",
  notEditorial.length === 0,
  notEditorial.slice(0, 3).join(", "),
);

/* ── The headline, checked against the database rather than against itself ────────────────────── */

heading("Headline honesty, cross-checked against live inventory");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await db
    .from("inventory_vehicles")
    .select("title,make,model,variant,body_type,asking_price_cents,lifecycle_status")
    .range(from, from + 999);
  if (error) throw new Error(error.message);
  rows.push(...data);
  if (data.length < 1000) break;
}
const published = rows.filter((row) => row.lifecycle_status === "published");
const byTitle = new Map(published.map((row) => [row.title, row]));
const liveContext = buildPriceContext(published.map((row) => row.asking_price_cents));

/*
  Does each rail contain what its heading says it contains?
  ========================================================
  This replaces the headline-honesty checks that preceded the segment architecture. Those existed
  because the old rails had *computed* headings over a "best we have" membership, so the sentence
  could outrun the cars — and it did, three times.

  Segment rails cannot fail that way, because membership is a rule and the heading is its definition.
  What they *can* fail is the rule itself: a body-type pattern that misses "Double Cab", a marque
  register that has not heard of Genesis, and suddenly "Bakkies & commercial" contains a saloon. So
  the assertion is turned around — every card on the page is re-classified from the database, and
  each must land in the rail it is actually in.

  Re-classified from the database rather than from the page, deliberately. Reading the rule's own
  output back off the markup it produced would prove only that the page renders what it computed.
*/
const verdictFromRow = (row) =>
  classifyAspiration(
    {
      id: row.title,
      imageSrc: "/x.webp",
      make: row.make,
      model: row.model,
      variant: row.variant,
      bodyType: row.body_type,
      priceCents: row.asking_price_cents,
    },
    liveContext,
  );

const segmentRails = merchandised.filter(
  (rail) => rail.key !== "marketplace" && rail.key !== "homepage-featured",
);

let cardsChecked = 0;
const misfiled = [];
const unmatched = [];

for (const rail of segmentRails) {
  for (const card of rail.cards) {
    const row = byTitle.get(card.title);
    if (!row) {
      unmatched.push(card.title);
      continue;
    }
    cardsChecked += 1;
    const vehicle = {
      id: row.title,
      imageSrc: "/x.webp",
      make: row.make,
      model: row.model,
      variant: row.variant,
      bodyType: row.body_type,
      priceCents: row.asking_price_cents,
    };
    const belongs = classifySegment(vehicle, verdictFromRow(row));
    if (belongs !== rail.key) misfiled.push(`${card.title} → ${belongs ?? "none"}, shown in ${rail.key}`);
  }
}

check(
  "every card on the page resolves to a live published vehicle",
  unmatched.length === 0,
  unmatched.slice(0, 3).join("; "),
);
check(
  `every card sits in the segment it belongs to (${cardsChecked} checked)`,
  misfiled.length === 0,
  misfiled.slice(0, 4).join("; "),
);

/* The specific claims each heading makes, asserted directly rather than through the rule. */
const railByKey = new Map(segmentRails.map((rail) => [rail.key, rail]));
const rowsOf = (key) => (railByKey.get(key)?.cards ?? []).map((card) => byTitle.get(card.title)).filter(Boolean);

const sports = rowsOf("sports-performance");
check(
  "everything under Sports & performance is exotic, badged or a sporting body",
  sports.every((row) => {
    const verdict = verdictFromRow(row);
    return verdict.marque === "exotic" || verdict.badge !== null || /coupe|convertible|roadster/i.test(row.body_type ?? "");
  }),
  `${sports.length} cars`,
);

const luxury = rowsOf("luxury");
check(
  "everything under Luxury vehicles carries a premium marque",
  luxury.every((row) => verdictFromRow(row).marque !== "mainstream"),
  luxury.map((row) => row.make).join(", ") || "empty",
);

const commercial = rowsOf("commercial");
check(
  "everything under Bakkies & commercial is a working vehicle",
  commercial.every((row) => /cab|bakkie|pick|van|truck/i.test(row.body_type ?? "")),
  [...new Set(commercial.map((row) => row.body_type))].join(", ") || "empty",
);

/* The founder objective: the most aspirational stock the marketplace can honestly show goes first. */
const firstRail = segmentRails[0];
check(
  "the page opens with its most aspirational band",
  firstRail === undefined || firstRail.key === "sports-performance" || firstRail.key === "luxury",
  firstRail?.key ?? "no segment rails",
);

await browser.close();
rmSync(OUT, { recursive: true, force: true });

await restoreReviews();
const { count: stillApproved } = await approvalDb
  .from("media_reviews")
  .select("photograph", { count: "exact", head: true })
  .eq("state", "approved_homepage");
console.log(
  `\nreview table restored — ${stillApproved ?? 0} photographs approved for the homepage${
    (stillApproved ?? 0) === 0 ? " (as found)" : ""
  }`,
);

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failures.length) console.log(failures.map((f) => `  · ${f}`).join("\n") + "\n");
process.exit(failed === 0 ? 0 : 1);
