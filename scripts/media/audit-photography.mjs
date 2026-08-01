/**
 * SURF4CARS — Photography audit (Programme Phase 8).
 *
 * The Founder asked one question of every visible vehicle photograph:
 *
 *   Is it beautiful? · the correct vehicle? · the correct trim? · the correct category?
 *   high quality? · well composed? · worth leading with?
 *
 * THE HONEST ANSWER IS THAT A MACHINE CAN ANSWER FOUR OF THE SEVEN
 * ================================================================
 * Resolution, exposure, contrast, sharpness, orientation and lead-eligibility are measurements, and
 * the scorer in `src/services/media-intelligence` already makes them. Whether a photograph is
 * beautiful, whether it depicts the vehicle on the listing, and whether it shows the right trim are
 * not measurements. They are judgements about meaning, and this codebase already paid for pretending
 * otherwise: the scorer rated the Volvo's brick-shopfront frame 78/100, mid-pack, because measuring
 * pixels cannot tell you the car is a grey smudge in front of a signboard.
 *
 * The damage from that gap is on the record. Four frames leading live cards were a 1970s Corolla
 * coupé, a Thai government fleet Hilux, a J100 Land Cruiser on a dune, and a Triton photographed
 * from the back seat inside a shopping mall. Every one of them is sharp, well exposed, correctly
 * oriented and high resolution. Every one scores well. Every one is the wrong car.
 *
 * So this report does not produce a number. It produces two lists:
 *
 *   MACHINE VERDICT   the four checks that are measurements, pass or fail, with the measurement
 *   REVIEW QUEUE      the three that are not, marked `needs-human` and never guessed
 *
 * A photograph is only "cleared" when a person has answered the second list. Marking the unanswerable
 * questions as passed by default is how a convincing wrong answer gets trusted — and this platform's
 * position is that an obvious gap gets fixed while a convincing one does not.
 *
 * Usage:
 *   node scripts/media/audit-photography.mjs
 *   node scripts/media/audit-photography.mjs --vehicle toyota-hilux
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { categoryFromViewName, extractPhotoFeatures } from "./lib/photo-features.mjs";
import { scorePhoto } from "../../src/services/media-intelligence/photo-scorer.ts";
import { UNPRESENTABLE_VEHICLE_PHOTOGRAPHY } from "../../src/config/media/vehicle-photography-policy.ts";
import { resolveVehiclePhotoCategory } from "../../src/services/vehicle-engine/vehicle-photo-category.ts";

const LIBRARY_DIR = join("public", "images", "vehicles", "library");
const OUT_DIR = join("docs", "reports");
const REPORT_MD = join(OUT_DIR, "photography-audit.md");
const REPORT_JSON = join(OUT_DIR, "photography-audit.json");

const args = process.argv.slice(2);
const onlyVehicle = args.includes("--vehicle") ? args[args.indexOf("--vehicle") + 1] : null;

/** The three questions no measurement answers. Never auto-passed. */
const HUMAN_CHECKS = [
  {
    id: "beautiful",
    question: "Is it beautiful?",
    why: "Composition, light and mood are judgements. The scorer rated a car park snapshot 78/100.",
  },
  {
    id: "correct-vehicle",
    question: "Is it the correct vehicle?",
    why: "Nothing in the pixels ties a frame to a listing. A 1974 Corolla and a 2026 Corolla score alike.",
  },
  {
    id: "correct-trim",
    question: "Is it the correct trim?",
    why: "Trim is badges, wheels and interior detail — below the resolution of any metric here.",
  },
];

const listVehicles = () =>
  readdirSync(LIBRARY_DIR)
    .filter((entry) => statSync(join(LIBRARY_DIR, entry)).isDirectory())
    .filter((entry) => !onlyVehicle || entry === onlyVehicle)
    .sort();

const listFrames = (vehicle) =>
  readdirSync(join(LIBRARY_DIR, vehicle))
    .filter((file) => /\.(webp|jpg|jpeg|png)$/i.test(file))
    .sort();

/**
 * The four machine checks.
 *
 * Each returns `pass` or `fail` plus the measurement that decided it, so a Founder disagreeing with a
 * verdict can see what it was based on rather than being asked to trust a score.
 */
function machineChecks({ features, score, url, derivedCategory, fileCategory }) {
  const megapixels = (features.width * features.height) / 1_000_000;

  const factor = (id) => score.factors.find((f) => f.id === id);
  const sharpness = factor("sharpness");
  const exposure = factor("exposure");
  const contrast = factor("contrast");
  const orientation = factor("orientation");
  const background = factor("backgroundCalm");

  const qualityFails = [
    megapixels < 0.6 ? `only ${megapixels.toFixed(2)}MP` : null,
    sharpness && sharpness.score < 0.45 ? `soft (sharpness ${sharpness.score.toFixed(2)})` : null,
    exposure && exposure.score < 0.45 ? `exposure ${exposure.score.toFixed(2)}` : null,
    contrast && contrast.score < 0.4 ? `flat (contrast ${contrast.score.toFixed(2)})` : null,
    features.clippedShare > 0.18 ? `${(features.clippedShare * 100).toFixed(0)}% clipped` : null,
  ].filter(Boolean);

  const compositionFails = [
    orientation && orientation.score < 0.6 ? "portrait or square crop" : null,
    background && background.score < 0.4
      ? `cluttered background (edge energy ${features.edgeEnergy.toFixed(3)})`
      : null,
  ].filter(Boolean);

  /* Category is checked against the file name, which is the only stated fact about the frame. A
     mismatch means the library and the projection disagree about what this photograph shows. */
  const categoryAgrees = derivedCategory === undefined || derivedCategory === fileCategory
    || (fileCategory === "unknown" && derivedCategory === undefined);

  const banned = UNPRESENTABLE_VEHICLE_PHOTOGRAPHY.has(url);
  const leadEligible = derivedCategory === "exterior";

  return [
    {
      id: "correct-category",
      question: "Is it the correct category?",
      verdict: categoryAgrees ? "pass" : "fail",
      evidence: `file name says "${fileCategory}", projection derives "${derivedCategory ?? "unknown"}"`,
    },
    {
      id: "high-quality",
      question: "Is it high quality?",
      verdict: qualityFails.length === 0 ? "pass" : "fail",
      evidence:
        qualityFails.length === 0
          ? `${megapixels.toFixed(1)}MP, sharpness ${sharpness?.score.toFixed(2) ?? "-"}`
          : qualityFails.join("; "),
    },
    {
      id: "good-composition",
      question: "Is it well composed?",
      verdict: compositionFails.length === 0 ? "pass" : "fail",
      evidence:
        compositionFails.length === 0
          ? `${features.width}×${features.height}, background calm ${background?.score.toFixed(2) ?? "-"}`
          : compositionFails.join("; "),
      /* Named for what it measures. Framing and clutter are computable; "is this a good photograph"
         is not, and the human queue below carries that half of the question. */
      caveat: "measures framing and clutter only — aesthetic judgement is in the review queue",
    },
    {
      /*
        Only asked of frames that are candidates to lead.

        Asked of everything, it failed every interior, wheel, engine bay and dashboard in the library
        — 100-odd "defects" describing photographs doing exactly the job they were taken for. A rule
        that fires wrongly costs more trust than the defect it was written to catch, and a Founder
        scrolling past a hundred false findings will scroll past the real one with them.
      */
      id: "worth-leading",
      question: "Is it worth leading with?",
      verdict: !leadEligible
        ? "not-applicable"
        : banned
          ? "fail"
          : "pass",
      evidence: !leadEligible
        ? `an ${derivedCategory ?? "uncategorised"} frame is not a lead candidate`
        : banned
          ? "denied by the photography policy"
          : `exterior, score ${score.score.toFixed(2)}`,
    },
  ];
}

async function main() {
  if (!existsSync(LIBRARY_DIR)) {
    console.error(`No library at ${LIBRARY_DIR}`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const rows = [];
  const unreadable = [];

  for (const vehicle of listVehicles()) {
    for (const file of listFrames(vehicle)) {
      const path = join(LIBRARY_DIR, vehicle, file);
      const url = `/images/vehicles/library/${vehicle}/${file}`;
      const view = file.replace(/\.[^.]+$/, "");

      const fileCategory = categoryFromViewName(view);
      const derivedCategory = resolveVehiclePhotoCategory(file, url);
      /* `extractPhotoFeatures` is async and positional. Calling it with an object and without
         `await` produced a report built from unresolved promises — every check "passed", and the
         rejection surfaced only after the files had been written. Exactly the failure mode this
         report exists to catch, in the report itself. */
      let features;
      try {
        features = await extractPhotoFeatures(path, url, fileCategory);
      } catch (error) {
        unreadable.push({ url, reason: error.message });
        continue;
      }
      const score = scorePhoto(features);

      const checks = machineChecks({ features, score, url, derivedCategory, fileCategory });
      const failed = checks.filter((c) => c.verdict === "fail");

      rows.push({
        vehicle,
        view,
        url,
        machineChecks: checks,
        humanChecks: HUMAN_CHECKS.map((c) => ({ ...c, verdict: "needs-human" })),
        machineFailures: failed.length,
        /* A frame is never "clear": three questions are always outstanding until a person answers
           them. The strongest status a machine can award is "no measured defect". */
        status: failed.length === 0 ? "no-measured-defect" : "measured-defect",
      });
    }
  }

  const withDefects = rows.filter((r) => r.status === "measured-defect");

  /*
    The finding that actually matters, per vehicle rather than per frame.

    A single soft wheel shot changes nothing a customer sees. A vehicle with no publishable exterior
    disappears from every grid on the platform while still being counted in the stock figures — which
    is what happened to the Hilux and the Corolla. `photography-no-exterior` in the quality engine
    raises the same condition against live records; this raises it against the library.
  */
  const byVehicle = new Map();
  for (const row of rows) {
    const entry = byVehicle.get(row.vehicle) ?? { frames: 0, leadCandidates: 0 };
    entry.frames += 1;
    if (row.machineChecks.some((c) => c.id === "worth-leading" && c.verdict === "pass")) {
      entry.leadCandidates += 1;
    }
    byVehicle.set(row.vehicle, entry);
  }
  const noLead = [...byVehicle.entries()].filter(([, v]) => v.leadCandidates === 0);

  const lines = [
    "# Photography audit",
    "",
    `Generated from ${rows.length} photographs across ${new Set(rows.map((r) => r.vehicle)).size} vehicles.`,
    "",
    "## How to read this",
    "",
    "Seven questions were asked of every photograph. **Four are measurements and are answered here.**",
    "**Three are judgements and are not** — they are listed per frame as `needs-human` and are never",
    "guessed, because a confident wrong answer about whether a photograph shows the right car is worse",
    "than no answer. Every frame therefore carries outstanding questions until a person clears them;",
    "`no-measured-defect` is the strongest verdict this report can award, and it is not the same as",
    "`good`.",
    "",
    "The four frames that most recently led live cards — a 1970s Corolla coupé, a Thai government fleet",
    "Hilux, a Land Cruiser on a dune, a Triton shot from the back seat in a shopping mall — all pass",
    "every machine check on this page. That is the point of the second list.",
    "",
    `## Vehicles with no publishable lead photograph (${noLead.length})`,
    "",
    "These disappear from every grid on the platform — the card renders \"Photographs to follow\" —",
    "while the stock count still includes them. One usable exterior frame restores each of them",
    "everywhere at once.",
    "",
  ];

  if (noLead.length === 0) {
    lines.push("None.", "");
  } else {
    lines.push("| Vehicle | Frames held | Lead candidates |", "| --- | --- | --- |");
    for (const [vehicle, counts] of noLead) {
      lines.push(`| ${vehicle} | ${counts.frames} | 0 |`);
    }
    lines.push("");
  }

  lines.push(`## Measured defects (${withDefects.length})`, "");

  if (withDefects.length === 0) {
    lines.push("None.", "");
  } else {
    lines.push("| Vehicle | Frame | Failed check | Evidence |", "| --- | --- | --- | --- |");
    for (const row of withDefects) {
      for (const check of row.machineChecks.filter((c) => c.verdict === "fail")) {
        lines.push(`| ${row.vehicle} | ${row.view} | ${check.question} | ${check.evidence} |`);
      }
    }
    lines.push("");
  }

  lines.push(
    `## Review queue (${rows.length} frames × ${HUMAN_CHECKS.length} questions)`,
    "",
    "Nobody has answered these. They cannot be closed by running this script again.",
    "",
  );
  for (const check of HUMAN_CHECKS) {
    lines.push(`- **${check.question}** — ${check.why}`);
  }
  lines.push("");

  writeFileSync(REPORT_MD, lines.join("\n"), "utf8");
  writeFileSync(
    REPORT_JSON,
    JSON.stringify({ generatedFrom: rows.length, rows }, null, 2),
    "utf8",
  );

  if (unreadable.length > 0) {
    lines.push(`## Unreadable files (${unreadable.length})`, "");
    for (const item of unreadable) lines.push(`- \`${item.url}\` — ${item.reason}`);
    lines.push("");
  }

  console.log(`${rows.length} photographs audited`);
  console.log(`${withDefects.length} with a measured defect`);
  console.log(`${noLead.length} vehicle(s) with no publishable lead photograph`);
  console.log(`${rows.length * HUMAN_CHECKS.length} questions outstanding for human review`);
  if (unreadable.length > 0) console.log(`${unreadable.length} file(s) could not be read`);
  console.log(`\n  ${REPORT_MD}\n  ${REPORT_JSON}`);
}

await main();
