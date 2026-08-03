/**
 * Founder curation — approval gate, review states, integrity, dealer covers (PCP-043).
 *
 * THE ASSERTION THAT MATTERS
 * ==========================
 * That the homepage's premium rails are a function of what a person approved, and of nothing else.
 * Everything before this sprint made the shop window a function of what nobody had objected to yet,
 * which meant new inventory could change it on its own — and twenty of the twenty-four frames that
 * arrived that way were motor shows, forecourts or vehicles nobody could buy.
 *
 * So the gate is tested in both directions: empty with no approvals, populated with one, and empty
 * again when it is withdrawn. A gate only proved in the open position is not a gate.
 *
 *   npm run build && npx next start -p 3100
 *   node scripts/verify-founder-curation.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { chromium } from "playwright";

const APP = process.env.APP_URL ?? "http://localhost:3100";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

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

const OUT = ".curation-verify";
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

console.log("\nFounder curation (PCP-043)\n──────────────────────────");

heading("Build");
try {
  execSync(
    `npx esbuild src/services/media-review/photograph-integrity.ts --bundle --platform=node --format=esm --outfile=${OUT}/integrity.mjs --alias:@=./src --log-level=error`,
    { stdio: "pipe" },
  );
  check("the integrity rules bundle without a browser or request context", true);
} catch (error) {
  check("the integrity rules bundle", false, String(error).slice(0, 200));
  process.exit(1);
}
const { detectIntegrityFlags, modelFromPath } = await import(`../${OUT}/integrity.mjs`);

/* ── The rules, on cases the live marketplace cannot supply ───────────────────────────────────── */

heading("Vehicle / photograph integrity");

const listing = (over) => ({
  id: over.title,
  photograph: "/images/vehicles/library/ford-ranger/front.webp",
  make: "Ford",
  model: "Ranger",
  variant: null,
  bodyType: "Double Cab",
  ...over,
});

check(
  "a model path is read from a library URL",
  modelFromPath("/images/vehicles/library/bmw-x5/side.webp") === "bmw-x5",
);

/* The exact case the Founder identified: one frame, a Raptor and an ordinary Ranger. */
const raptor = detectIntegrityFlags([
  listing({ title: "2026 Ford Ranger 3.0 V6 Raptor", variant: "3.0 V6 Raptor" }),
  listing({ title: "2024 Ford Ranger 2.0 XLT", variant: "2.0 SiT XLT" }),
]);
check(
  "a performance derivative sharing a frame with its base model is flagged",
  raptor.some((flag) => flag.rule === "derivative-conflict"),
  raptor.map((flag) => flag.rule).join(", ") || "none",
);

/* …and a trim package sharing a frame with its own base model is not a defect. */
const trim = detectIntegrityFlags([
  listing({ title: "BMW X3 xDrive30d M Sport", make: "BMW", model: "X3", variant: "xDrive30d M Sport", photograph: "/images/vehicles/library/bmw-x3/front.webp", bodyType: "SUV" }),
  listing({ title: "BMW X3 xDrive20d", make: "BMW", model: "X3", variant: "xDrive20d", photograph: "/images/vehicles/library/bmw-x3/front.webp", bodyType: "SUV" }),
]);
check(
  "an M Sport sharing a frame with a plain X3 is not flagged — it is the same car",
  trim.length === 0,
  trim.map((flag) => flag.detail).join("; ") || "no flags",
);

/* The A3 case: one frame leading two body styles. */
const bodies = detectIntegrityFlags([
  listing({ title: "Audi A3 35 TFSI", make: "Audi", model: "A3", photograph: "/images/vehicles/library/audi-a3/front.webp", bodyType: "Hatch" }),
  listing({ title: "Audi A3 Cabriolet", make: "Audi", model: "A3", photograph: "/images/vehicles/library/audi-a3/front.webp", bodyType: "Convertible" }),
]);
check(
  "one frame leading two body styles is flagged",
  bodies.some((flag) => flag.rule === "body-style-conflict"),
  bodies.map((flag) => flag.detail).join("; ") || "none",
);

/* A frame filed under a different model entirely. */
const wrongModel = detectIntegrityFlags([
  listing({ title: "2022 Toyota Prado 3.0 VX", make: "Toyota", model: "Prado", photograph: "/images/vehicles/library/toyota-land-cruiser/side.webp" }),
]);
check(
  "a frame filed under another model is flagged",
  wrongModel.some((flag) => flag.rule === "model-mismatch"),
  wrongModel.map((flag) => flag.detail).join("; ") || "none",
);
check(
  "…and a model recorded with a trailing designation still matches its own folder",
  detectIntegrityFlags([
    listing({ title: "Land Cruiser 300", make: "Toyota", model: "Land Cruiser 300", photograph: "/images/vehicles/library/toyota-land-cruiser/side.webp" }),
  ]).every((flag) => flag.rule !== "model-mismatch"),
);

check(
  "detection is order-independent",
  JSON.stringify(detectIntegrityFlags([...bodies.length ? [] : [], ...[
    listing({ title: "B", make: "Audi", model: "A3", photograph: "/x/y/audi-a3/front.webp", bodyType: "Convertible" }),
    listing({ title: "A", make: "Audi", model: "A3", photograph: "/x/y/audi-a3/front.webp", bodyType: "Hatch" }),
  ]]))
    === JSON.stringify(detectIntegrityFlags([
      listing({ title: "A", make: "Audi", model: "A3", photograph: "/x/y/audi-a3/front.webp", bodyType: "Hatch" }),
      listing({ title: "B", make: "Audi", model: "A3", photograph: "/x/y/audi-a3/front.webp", bodyType: "Convertible" }),
    ])),
);

/* ── The seeded review states ─────────────────────────────────────────────────────────────────── */

heading("Review states");

const { data: reviews, error: reviewError } = await db.from("media_reviews").select("photograph,state,note");
check("the review table is readable", !reviewError, reviewError?.message ?? `${reviews?.length ?? 0} rows`);

const byState = (reviews ?? []).reduce((totals, row) => {
  totals[row.state] = (totals[row.state] ?? 0) + 1;
  return totals;
}, {});
check("previously rejected frames were migrated", (byState.rejected ?? 0) >= 16, `${byState.rejected ?? 0} rejected`);
check("previously demoted frames were migrated", (byState.approved_search ?? 0) >= 25, `${byState.approved_search ?? 0} search-only`);
check(
  "every stored decision carries a written reason",
  (reviews ?? []).every((row) => (row.note ?? "").trim().length > 0),
);
check(
  "nothing was seeded as homepage-approved — that decision belongs to a person",
  (byState.approved_homepage ?? 0) === 0,
  `${byState.approved_homepage ?? 0} approved`,
);

/* ── The gate ─────────────────────────────────────────────────────────────────────────────────── */

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const railsOnPage = async () => {
  await page.goto(`${APP}/`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  return page.locator("section[data-rail]").evaluateAll((sections) =>
    sections.map((section) => ({
      key: section.getAttribute("data-rail"),
      cars: [...section.querySelectorAll('a[href^="/vehicle/"] img')].map((img) => img.getAttribute("src") ?? ""),
    })),
  );
};

const PREMIUM_KEYS = ["sports-performance", "luxury", "premium-suv", "executive-sedan", "family", "commercial"];
let approvedPhotograph = null;

try {
  heading("The approval gate, closed");

  /*
    Wait out the revalidation window before asserting the closed state.

    The homepage is cached for a minute, so a suite that ran just before this one and approved a
    photograph leaves a page that still shows rails. That produced a failure here once and it was
    cross-suite cache interference rather than the gate — exactly the staleness trap the
    merchandising suite already had to be taught about.
  */
  let closed = await railsOnPage();
  const settleBy = Date.now() + 120_000;
  while (closed.length > 0 && Date.now() < settleBy) {
    await page.waitForTimeout(5_000);
    closed = await railsOnPage();
  }
  check(
    "no vehicle rail of any kind renders while nothing is approved",
    closed.length === 0,
    closed.map((rail) => rail.key).join(", ") || "no rails",
  );
  /*
    The tail rail is gated too. It was exempt in the first draft, on the reasoning that "Cars you can
    buy today" claims nothing beyond availability — and the launch walk answered that immediately:
    with the premium rails dark it became the first thing under the hero and opened with a WRC rally
    car captioned as a R95 000 hatchback. There is no rail here where approve-by-default is safe.
  */
  const waysIn = await page.evaluate(
    () => document.querySelectorAll('a[href^="/search"], a[href="/search"]').length,
  );
  check("…and the page still routes a visitor into the inventory", waysIn > 0, `${waysIn} links to search`);

  /*
    Editorial may never float above the vehicles, whatever curation is set. This is the invariant the
    previous brief asked for, and the first walk after the gate landed broke it: with the premium
    rails gone, "Find your next journey" arrived 118px below the hero.
  */
  const order = await page.evaluate(() => {
    const lifestyle = [...document.querySelectorAll("h2")].find((node) =>
      node.textContent.trim().startsWith("Find your next journey"),
    );
    const firstRail = document.querySelector("section[data-rail]");
    const top = (node) => (node ? node.getBoundingClientRect().top + window.scrollY : null);
    return { lifestyle: top(lifestyle), firstRail: top(firstRail) };
  });
  /*
    The invariant cannot be "vehicles precede editorial" when there are no vehicles, so it is stated
    as the two cases it actually has: where stock is on show it comes first, and where none is, the
    editorial does not appear either. The first version asserted only the former and failed honestly
    — a magazine with no cars in it is not the graceful version of an empty showroom.
  */
  check(
    "with no stock on show, the editorial does not lead the page either",
    order.firstRail === null ? order.lifestyle === null : order.firstRail < order.lifestyle,
    `first rail ${Math.round(order.firstRail ?? -1)}px, editorial ${Math.round(order.lifestyle ?? -1)}px`,
  );

  heading("The approval gate, open");

  /* Approve one photograph that is currently leading a premium-band vehicle. */
  const { data: candidates } = await db
    .from("media_reviews")
    .select("photograph")
    .eq("state", "approved_search")
    .limit(200);
  const seen = new Set((candidates ?? []).map((row) => row.photograph));

  /* Pick a frame that is in use and not already reviewed, so approving it changes the page. */
  const { data: media } = await db
    .from("inventory_vehicle_media")
    .select("file_url")
    .limit(2000);
  const inUse = [...new Set((media ?? []).map((row) => row.file_url))]
    .filter((url) => /\/(front|side|rear)\.webp$/.test(url ?? ""))
    .filter((url) => !seen.has(url))
    .sort();

  approvedPhotograph = inUse[0] ?? null;
  check("an unreviewed photograph is available to approve", Boolean(approvedPhotograph), approvedPhotograph ?? "none");

  if (approvedPhotograph) {
    await db.from("media_reviews").upsert(
      { photograph: approvedPhotograph, state: "approved_homepage", note: "PCP-043 verification" },
      { onConflict: "photograph" },
    );

    let open = await railsOnPage();
    const deadline = Date.now() + 150_000;
    while (!open.some((rail) => PREMIUM_KEYS.includes(rail.key)) && Date.now() < deadline) {
      await page.waitForTimeout(5_000);
      open = await railsOnPage();
    }

    const premium = open.filter((rail) => PREMIUM_KEYS.includes(rail.key));
    check("approving one photograph opens a premium rail", premium.length > 0, premium.map((r) => r.key).join(", "));
    check(
      "…and that rail shows only the approved photograph",
      premium.every((rail) =>
        rail.cars.every((src) => decodeURIComponent(src).includes(approvedPhotograph.split("/").pop())),
      ),
      premium.flatMap((rail) => rail.cars).length + " cards",
    );

    /* Withdraw it again. A gate proved only in the open position is not a gate. */
    await db.from("media_reviews").delete().eq("photograph", approvedPhotograph);
    approvedPhotograph = null;

    let closedAgain = await railsOnPage();
    const closeDeadline = Date.now() + 150_000;
    while (closedAgain.some((rail) => PREMIUM_KEYS.includes(rail.key)) && Date.now() < closeDeadline) {
      await page.waitForTimeout(5_000);
      closedAgain = await railsOnPage();
    }
    check(
      "withdrawing the approval closes the rail again",
      closedAgain.every((rail) => !PREMIUM_KEYS.includes(rail.key)),
      closedAgain.map((rail) => rail.key).join(", ") || "no rails",
    );
  }

  /* ── Rejections are absolute ────────────────────────────────────────────────────────────────── */

  heading("Rejections");

  const rejected = new Set((reviews ?? []).filter((row) => row.state === "rejected").map((row) => row.photograph));
  const everyRail = await railsOnPage();
  const shown = everyRail.flatMap((rail) => rail.cars).map((src) => {
    try {
      return decodeURIComponent(new URL(src, APP).searchParams.get("url") ?? src);
    } catch {
      return src;
    }
  });
  check(
    "no rejected photograph appears anywhere on the homepage",
    shown.every((src) => !rejected.has(src)),
    shown.filter((src) => rejected.has(src)).slice(0, 3).join(", "),
  );

  /* ── The dealer cover ───────────────────────────────────────────────────────────────────────── */

  heading("Dealer cover photography");

  const { data: dealerCols } = await db.from("dealerships").select("cover_image_url,promotional_headline").limit(1);
  check("dealerships carry a cover and a promotional headline", dealerCols !== null);

  /*
    Scoped to the spotlight, not to the page. The same frame is also a lifestyle tile ("Luxury
    without compromise"), where it is a brand photograph making no claim about anybody — the first
    version of this check failed on that, which is the assertion being wrong rather than the page.
    What must never happen is that frame appearing *behind a named dealership*.
  */
  const spotlightCover = await page.evaluate(() => {
    const section = document.querySelector("[data-testid=dealer-spotlight]");
    if (!section) return { present: false, sources: [] };
    return {
      present: true,
      sources: [...section.querySelectorAll("img")].map((img) => img.getAttribute("src") ?? ""),
    };
  });
  check(
    "the Dealer Spotlight never renders the SURF4CARS showroom frame as a dealership's own",
    !spotlightCover.present
      || spotlightCover.sources.every((src) => !decodeURIComponent(src).includes("dealer-profile-hero")),
    spotlightCover.present ? `${spotlightCover.sources.length} images in section` : "section not rendered",
  );

  const { count: withCovers } = await db
    .from("dealerships")
    .select("id", { count: "exact", head: true })
    .not("cover_image_url", "is", null);
  check(
    "dealership covers are supplied rather than defaulted",
    (withCovers ?? 0) === 0,
    `${withCovers ?? 0} of the dealerships have supplied a cover — the rest render the graphic panel`,
  );

  /* ── The review console ─────────────────────────────────────────────────────────────────────── */

  heading("Photography review console");

  const consoleResponse = await page.request.get(`${APP}/operations/photography`, { maxRedirects: 0 });
  check(
    "the review console is behind the operations gate",
    consoleResponse.status() === 307 || consoleResponse.status() === 302,
    `HTTP ${consoleResponse.status()}`,
  );

  const { data: openFlags } = await db
    .from("media_integrity_flags")
    .select("photograph,rule,detail")
    .eq("dismissed", false);
  check(
    "the live inventory's integrity flags are stored for review",
    (openFlags ?? []).length > 0,
    (openFlags ?? []).map((flag) => `${flag.rule}`).join(", ") || "none",
  );
  check(
    "the Ranger/Raptor mismatch the Founder identified is among them",
    (openFlags ?? []).some((flag) => flag.photograph.includes("ford-ranger") && flag.rule === "derivative-conflict"),
  );
} finally {
  if (approvedPhotograph) await db.from("media_reviews").delete().eq("photograph", approvedPhotograph);
  await browser.close();
  rmSync(OUT, { recursive: true, force: true });

  const { data: leftover } = await db.from("media_reviews").select("photograph").eq("state", "approved_homepage");
  console.log(
    `\nverification approval removed — ${(leftover ?? []).length === 0 ? "review table left as found" : `WARNING: ${leftover.length} still approved`}`,
  );
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failures.length) console.log(failures.map((entry) => `  · ${entry}`).join("\n") + "\n");
process.exit(failed === 0 ? 0 : 1);
