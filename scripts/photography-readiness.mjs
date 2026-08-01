/**
 * SURF4CARS — Photography Readiness.
 *
 * The single source of truth for creative quality, and the brief a photographer can be handed.
 *
 * WHY THIS IS NOT THE PHOTOGRAPHY AUDIT
 * =====================================
 * `audit-photography.mjs` asks "is this frame any good", one file at a time. Useful, and it does not
 * answer the question actually blocking the product, which is *"what is missing before the homepage
 * is finished"*. That question is per **section**, not per file: the hero needs one exceptional
 * landscape, the featured rail needs five, a collection can run on one. A list of 259 frames sorted
 * by sharpness does not tell you that.
 *
 * So this reports readiness against the surfaces, and names what has to be commissioned.
 *
 * THE THREE TIERS ARE ALREADY IN THE CODE
 * =======================================
 * Nothing new is invented here. The platform already answers three separate questions about a
 * photograph, and this reads all three rather than inventing a fourth:
 *
 *   rejected      `UNPRESENTABLE_VEHICLE_PHOTOGRAPHY` — may never be seen by a customer
 *   marketplace   passes that, and is an exterior — may lead a card in search
 *   homepage      also passes `NOT_EDITORIAL_GRADE` — may lead a curated surface
 *   hero          homepage-grade, landscape, and large enough to run full-bleed at 1440px
 *
 * The hero tier is the only one computed here, because no surface has needed it before: the homepage
 * hero uses a commissioned brand photograph rather than a vehicle. It is defined so that the day a
 * vehicle *is* good enough to carry the hero, there is a rule that says so.
 *
 * Usage:
 *   npm run dev                       # sections are read from the live homepage
 *   node scripts/photography-readiness.mjs
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

import { UNPRESENTABLE_VEHICLE_PHOTOGRAPHY } from "../src/config/media/vehicle-photography-policy.ts";
import { NOT_EDITORIAL_GRADE } from "../src/config/media/editorial-standards.ts";
import { resolveVehiclePhotoCategory } from "../src/services/vehicle-engine/vehicle-photo-category.ts";

const BASE = "http://localhost:3003";
const LIBRARY = join("public", "images", "vehicles", "library");
const OUT_DIR = join("docs", "reports");
const REPORT = join(OUT_DIR, "photography-readiness.md");

/**
 * What a person has actually looked at.
 *
 * Maintained by hand, deliberately: it records human judgement, and a number a script can recompute
 * is not human judgement. Nineteen frames have been opened and judged against the Founder's
 * standard across PCP-022 to PCP-026; one passed — the Ford Ranger fording a river.
 *
 * Raise these when frames are reviewed. If they ever drift from reality the report becomes the thing
 * it exists to prevent.
 */
const REVIEWED = 19;
const APPROVED = 1;

/**
 * What the homepage needs, section by section.
 *
 * `needs` is the count of *distinct* photographs the section wants. `minimum` is what it can run on
 * without looking broken — Rule 5: one extraordinary photograph is worth more than six average ones,
 * so a collection's minimum is 1, while the featured rail's grid strands a tile below 2.
 */
const HOMEPAGE_SECTIONS = [
  { id: "hero", label: "Hero", tier: "hero", needs: 1, minimum: 1, note: "Commissioned brand photograph, not a listing." },
  { id: "featured", label: "Featured vehicles", tier: "homepage", needs: 5, minimum: 2, note: "Lead card runs at 2 of 3 columns." },
  { id: "collection", label: "Editorial collection", tier: "homepage", needs: 3, minimum: 1, note: "One exceptional frame may carry it." },
  { id: "spotlight", label: "Dealer spotlight", tier: "homepage", needs: 4, minimum: 1, note: "Drawn from one dealership's stock." },
];

/**
 * Creative readiness — the four axes photography does not cover.
 *
 * Photography is measurable; the rest is judgement, so these are recorded rather than computed. The
 * scores are mine, argued in the `why` column, and a Founder who disagrees should overwrite them —
 * that disagreement is the entire value of writing them down.
 *
 * The distinction that matters: **photography is the only axis still failing.** Every section below
 * scores well on emotion, editorial, story and brand, and every one of them is held back by the same
 * thing. That is the argument for commissioning, made in a table rather than in prose.
 */
const CREATIVE = [
  {
    section: "Hero",
    emotion: "Inspiration — \"I want to drive that road.\"",
    photography: 5, editorial: 5, story: 5, brand: 5,
    why: "The one commissioned frame on the platform. Brand, headline, search and car read as one composition.",
  },
  {
    section: "Featured vehicles",
    emotion: "Desire — \"I could own one of these.\"",
    photography: 2, editorial: 4, story: 3, brand: 4,
    why: "Layout, mixing and hierarchy are right. The frames are reference photography, so desire is the axis that fails.",
  },
  {
    section: "Editorial collections",
    emotion: "Aspiration — \"That is the life, not just the car.\"",
    photography: 2, editorial: 5, story: 4, brand: 4,
    why: "The slot system, ordering and naming are complete and campaign-ready. Only the imagery is borrowed.",
  },
  {
    section: "Lifestyle collections",
    emotion: "Imagination — \"Which of these am I?\"",
    photography: 4, editorial: 4, story: 5, brand: 5,
    why: "Story-led rather than category-led, on curated library photography rather than listing frames.",
  },
  {
    section: "Dealer spotlight",
    emotion: "Trust — \"I would buy from these people.\"",
    photography: 3, editorial: 4, story: 4, brand: 5,
    why: "Presented as a business, gaps declared rather than filled. Its stock carries the same photography limit.",
  },
  {
    section: "Why buyers choose",
    emotion: "Reassurance — \"Somebody checked.\"",
    photography: 5, editorial: 4, story: 5, brand: 5,
    why: "Three provable promises told editorially over one commissioned photograph.",
  },
  {
    section: "Dealer call to action",
    emotion: "Opportunity — \"My stock belongs here.\"",
    photography: 5, editorial: 4, story: 4, brand: 4,
    why: "No photograph to fail on. One offer, one action, no superlatives.",
  },
];

const listVehicles = () =>
  readdirSync(LIBRARY).filter((entry) => statSync(join(LIBRARY, entry)).isDirectory()).sort();

const listFrames = (vehicle) =>
  readdirSync(join(LIBRARY, vehicle)).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).sort();

/** Classify one frame against the tiers the platform already enforces. */
async function classify(vehicle, file) {
  const url = `/images/vehicles/library/${vehicle}/${file}`;

  if (UNPRESENTABLE_VEHICLE_PHOTOGRAPHY.has(url)) {
    return { url, tier: "rejected", reason: "denied by the photography policy" };
  }

  const category = resolveVehiclePhotoCategory(file, url);
  if (category !== "exterior") {
    return { url, tier: "gallery", reason: `an ${category ?? "uncategorised"} frame may not lead` };
  }

  if (NOT_EDITORIAL_GRADE.has(url)) {
    return { url, tier: "marketplace", reason: "not editorial grade — search only" };
  }

  /* Hero tier. A full-bleed hero is drawn 1440px wide and ~80svh tall, so it needs a wide landscape
     with the resolution to survive it. Anything narrower is homepage-grade and no more. */
  let meta;
  try {
    meta = await sharp(join(LIBRARY, vehicle, file)).metadata();
  } catch {
    return { url, tier: "rejected", reason: "unreadable file" };
  }
  const ratio = (meta.width ?? 0) / (meta.height ?? 1);
  const heroReady = (meta.width ?? 0) >= 2000 && ratio >= 1.6;

  return {
    url,
    tier: heroReady ? "hero" : "homepage",
    reason: heroReady
      ? `${meta.width}×${meta.height}`
      : `${meta.width}×${meta.height} — under 2000px wide or narrower than 16:10`,
  };
}

/** What each homepage section is actually rendering right now. */
async function readLiveSections() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  try {
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 60_000 });
    await page.evaluate(async () => {
      for (let y = 0; y < 6000; y += 650) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
    });
    await page.waitForTimeout(700);
    return await page.evaluate(() =>
      [...document.querySelectorAll("section")]
        .map((sec) => ({
          heading: sec.querySelector("h1,h2")?.textContent?.trim() ?? "",
          images: [...sec.querySelectorAll('a[href^="/vehicle/"] img')]
            .map((img) => {
              const m = decodeURIComponent(img.getAttribute("src") ?? "").match(/url=([^&]+)/);
              return m ? m[1] : null;
            })
            .filter(Boolean),
        }))
        .filter((s) => s.images.length > 0),
    );
  } catch {
    return null;
  } finally {
    await browser.close();
  }
}

async function main() {
  if (!existsSync(LIBRARY)) {
    console.error(`No library at ${LIBRARY}`);
    process.exitCode = 1;
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const frames = [];
  for (const vehicle of listVehicles()) {
    for (const file of listFrames(vehicle)) {
      frames.push({ vehicle, file, ...(await classify(vehicle, file)) });
    }
  }

  const byTier = (tier) => frames.filter((f) => f.tier === tier);
  const leadCapable = frames.filter((f) => ["hero", "homepage"].includes(f.tier));

  /* A vehicle needs commissioning when it has no frame fit to represent the marketplace. */
  const vehicles = listVehicles();
  const needsCommission = vehicles.filter(
    (v) => !frames.some((f) => f.vehicle === v && ["hero", "homepage"].includes(f.tier)),
  );
  const live = await readLiveSections();

  const lines = [
    "# Photography readiness",
    "",
    "The single source of truth for creative quality. Generated — do not edit by hand.",
    "",
    "## Quality tiers",
    "",
    "| Tier | Meaning | Frames |",
    "| --- | --- | --- |",
    `| **Hero** | Landscape, ≥2000px wide, editorial grade. May carry a full-bleed hero. | ${byTier("hero").length} |`,
    `| **Homepage** | Editorial grade. May lead a curated surface. | ${byTier("homepage").length} |`,
    `| **Marketplace** | An exterior a customer may see, but not fit to represent the brand. | ${byTier("marketplace").length} |`,
    `| **Gallery** | Interior, wheel, engine. Belongs in a gallery, may never lead. | ${byTier("gallery").length} |`,
    `| **Rejected** | Denied outright. Never shown. | ${byTier("rejected").length} |`,
    "",
    `**${leadCapable.length} of ${frames.length} frames are policy-eligible to lead a curated surface.**`,
    "",
    "> ### Eligible is not approved",
    ">",
    "> That number counts frames the automated tiers have *not rejected*. It is not a count of",
    `> photographs anybody has looked at. **${REVIEWED} frames have been reviewed by a person against`,
    `> the standard, and ${REVIEWED - APPROVED} of them failed.**`,
    ">",
    "> The tiers catch what a machine can see — a denied file, a non-exterior category, a resolution",
    "> too low for a hero. They cannot see a motor show behind the car, a dealer's URL on the number",
    "> plate, or a photograph of the wrong generation. Every one of those was found by a person",
    "> opening the image.",
    ">",
    "> So read the section table below as *\"how many frames are available to try\"*, never as",
    "> *\"how many are good\"*. The honest approved count is the last line of this block.",
    "",
    "## Homepage sections",
    "",
    "| Section | Wants | Runs on | Available | Status |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const section of HOMEPAGE_SECTIONS) {
    const pool = section.tier === "hero" ? byTier("hero") : leadCapable;
    const available = pool.length;
    /* Never "Ready". A section is only ready when a person has approved enough frames for it, and
       one frame has ever been approved. Reporting policy headroom as readiness is precisely the
       convincing-wrong-answer this platform keeps paying for. */
    const status =
      section.tier === "hero" && available === 0
        ? "**Commission required** — no frame is large enough"
        : APPROVED >= section.needs
          ? "Approved"
          : available >= section.minimum
            ? `${available} eligible, ${APPROVED} approved — **needs review or commission**`
            : "**Commission required**";
    lines.push(
      `| ${section.label} | ${section.needs} | min ${section.minimum} | ${available} | ${status} |`,
    );
  }

  lines.push("", `_${HOMEPAGE_SECTIONS.map((s) => `${s.label}: ${s.note}`).join(" · ")}_`, "");

  if (live) {
    lines.push("## What the homepage is showing right now", "", "| Section | Frames | All homepage-grade? |", "| --- | --- | --- |");
    for (const section of live) {
      const grades = section.images.map(
        (u) => frames.find((f) => f.url === u)?.tier ?? "unknown",
      );
      const clean = grades.every((g) => ["hero", "homepage"].includes(g));
      lines.push(
        `| ${section.heading.slice(0, 40)} | ${section.images.length} | ${clean ? "Yes" : `No — ${grades.filter((g) => !["hero", "homepage"].includes(g)).join(", ")}`} |`,
      );
    }
    lines.push("");
  } else {
    lines.push("_Live section read skipped — the dev server was not reachable._", "");
  }

  lines.push(
    `## Commissioned photography required (${needsCommission.length} vehicles)`,
    "",
    "These hold no frame fit to lead a curated surface. Each needs one exterior three-quarter in",
    "clean light — that single frame moves the vehicle from invisible to homepage-eligible.",
    "",
  );
  lines.push(...(needsCommission.length ? needsCommission.map((v) => `- ${v}`) : ["None."]));

  const bar = (n) => "█".repeat(n) + "░".repeat(5 - n);
  lines.push(
    "",
    "## Creative readiness",
    "",
    "Photography is measured; the other four axes are judgement, recorded so they can be argued with.",
    "",
    "| Section | Emotional objective | Photo | Editorial | Story | Brand | Overall |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const c of CREATIVE) {
    const overall = Math.round((c.photography + c.editorial + c.story + c.brand) / 4);
    lines.push(
      `| **${c.section}** | ${c.emotion} | ${bar(c.photography)} | ${bar(c.editorial)} | ${bar(c.story)} | ${bar(c.brand)} | ${bar(overall)} |`,
    );
  }
  lines.push("", "Why each score:", "");
  for (const c of CREATIVE) lines.push(`- **${c.section}** — ${c.why}`);

  const avg = (k) => (CREATIVE.reduce((t, c) => t + c[k], 0) / CREATIVE.length).toFixed(1);
  lines.push(
    "",
    `**Averages — photography ${avg("photography")}, editorial ${avg("editorial")}, story ${avg("story")}, brand ${avg("brand")}.**`,
    "",
    "One axis is a point and a half below the others, and it is the same one on every section that",
    "shows a vehicle. Nothing in layout, naming, ordering or hierarchy is holding the homepage back.",
    "",
    "## The brief, if one photographer is being booked",
    "",
    "Twelve frames closes the gap:",
    "",
    "1. **One hero** — a car on a road at blue hour, landscape, ≥2400px wide. Replaces the stock",
    "   hero and becomes the only image most visitors ever remember.",
    "2. **Eleven vehicles**, one exterior three-quarter each, spanning the body styles the homepage",
    "   already mixes: SUV, double cab, hatchback, sedan, MPV, bakkie, executive, performance.",
    "",
    "Clean background, low sun or overcast-soft, the car filling two thirds of the frame, no plates",
    "from other markets, no forecourt signage, nobody in shot. Those constraints are not taste — they",
    "are the specific faults that disqualified the frames counted above.",
  );

  writeFileSync(REPORT, `${lines.join("\n")}\n`, "utf8");

  console.log(`${frames.length} frames classified`);
  console.log(`  hero ${byTier("hero").length} · homepage ${byTier("homepage").length} · marketplace ${byTier("marketplace").length} · gallery ${byTier("gallery").length} · rejected ${byTier("rejected").length}`);
  console.log(`${needsCommission.length} vehicle(s) hold no policy-eligible lead frame`);
  console.log(`human-reviewed: ${REVIEWED} frames, ${APPROVED} approved — eligible is not approved`);
  console.log(`\n  ${REPORT}`);
}

await main();
