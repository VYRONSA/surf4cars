/**
 * Content acquisition — step 1 of the creative review workflow.
 *
 * Collects 3–5 licence-clean candidates per brief and writes them to disk for review. It does
 * NOT pick one, rank them, or score them. The previous approach — take the first Commons result —
 * is what put a shopfront in the "SUVs" tile, and no amount of heuristic tuning fixes a decision
 * that was never an engineering decision to begin with.
 *
 * Usage:
 *   node scripts/media/shortlist-candidates.mjs <brief-id>
 *   node scripts/media/shortlist-candidates.mjs --all
 *
 * Output, per brief, under scripts/media/candidates/<brief-id>/:
 *   candidates.json    licence, author, source, resolution for each candidate
 *   candidate-N.jpg    review-resolution preview
 *   contact-sheet.jpg  all candidates in one numbered frame
 *
 * Then: node scripts/media/build-review-board.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

import { CANDIDATES_DIR, download, gatherCandidates, loadBriefs, resolveBrief } from "./lib/acquire.mjs";
import { describeProviderAccess } from "./lib/providers.mjs";

/** Fallback for a brief that does not state its own `target`. */
const TARGET = 10;
const PREVIEW_WIDTH = 1000;
const TILE = { width: 420, height: 260 };

async function shortlistBrief(brief) {
  console.log(`\n${brief.title} (${brief.id}) — ${brief.emotion}`);

  if (brief.acquisition === "in-house") {
    console.log(`  skipped: generated in-house. ${brief.note ?? ""}`);
    console.log("  run: node scripts/media/generate-inhouse-candidates.mjs " + brief.id);
    return;
  }

  const dir = join(CANDIDATES_DIR, brief.id);
  mkdirSync(dir, { recursive: true });

  const target = brief.target ?? TARGET;
  const candidates = await gatherCandidates(brief, { target });
  if (candidates.length === 0) {
    console.log("  no usable candidates — widen the searches in briefs.json");
    return;
  }
  if (candidates.length < target) {
    console.log(`  ! only ${candidates.length} of ${target} found — this board will be thin`);
  }

  const tiles = [];
  const kept = [];

  /**
   * A truncated download or an unreadable JPEG is one bad candidate, not a failed board — decode
   * errors stay local so the rest of the shortlist still reaches review.
   */
  for (const candidate of candidates) {
    const index = kept.length + 1;
    const file = `candidate-${index}.jpg`;

    try {
      const buffer = await download(candidate.previewUrl);
      await sharp(buffer)
        .resize({ width: PREVIEW_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: 84 })
        .toFile(join(dir, file));
      tiles.push(await sharp(buffer).resize(TILE.width, TILE.height, { fit: "cover" }).toBuffer());
    } catch (error) {
      console.log(`  ! ${candidate.title.slice(0, 48)}: ${error.message}`);
      continue;
    }

    kept.push({ ...candidate, index, preview: file });
    console.log(
      `  [${index}] ${candidate.licence.padEnd(12)} ${candidate.width}×${candidate.height}  ${candidate.title.slice(0, 58)}`,
    );
  }

  if (tiles.length === 0) return;

  const columns = Math.min(3, tiles.length);
  const rows = Math.ceil(tiles.length / columns);
  await sharp({
    create: {
      width: TILE.width * columns,
      height: TILE.height * rows,
      channels: 3,
      background: "#080808",
    },
  })
    .composite(
      tiles.map((input, i) => ({
        input,
        left: (i % columns) * TILE.width,
        top: Math.floor(i / columns) * TILE.height,
      })),
    )
    .jpeg({ quality: 84 })
    .toFile(join(dir, "contact-sheet.jpg"));

  writeFileSync(
    join(dir, "candidates.json"),
    `${JSON.stringify({ brief: { id: brief.id, title: brief.title, emotion: brief.emotion, direction: brief.direction, note: brief.note ?? null }, candidates: kept }, null, 2)}\n`,
  );
}

/**
 * Report source access before doing anything.
 *
 * Both photograph libraries are key-gated, and there is no keyless fallback worth having — the
 * archive this sprint moved away from is the only thing that would answer, and answering with worse
 * photography is the failure being fixed. So the run stops here with the two links needed rather
 * than half-filling boards and letting the Founder discover why at review time.
 */
function preflight() {
  const access = describeProviderAccess();

  for (const provider of access) {
    console.log(`  ${provider.configured ? "✓" : "✗"} ${provider.label.padEnd(9)} ${provider.variable}`);
  }

  if (access.some((provider) => provider.configured)) {
    const missing = access.filter((provider) => !provider.configured);
    if (missing.length) {
      console.log(
        `\n  Running with ${access.length - missing.length} of ${access.length} libraries. Boards will be narrower than they could be.`,
      );
    }
    return;
  }

  console.error("\nNo photograph library is configured, so there is nothing to acquire from.");
  console.error("Add either key to .env.local — both are free and take about two minutes:\n");
  for (const provider of access) {
    console.error(`  ${provider.variable}=...    ${provider.signup}`);
  }
  console.error("\nThen re-run. Nothing was written.");
  process.exitCode = 1;
}

async function main() {
  const [arg] = process.argv.slice(2);
  if (!arg) {
    console.error("Usage: node scripts/media/shortlist-candidates.mjs <brief-id> | --all");
    process.exitCode = 1;
    return;
  }

  console.log("Source access:");
  preflight();
  if (process.exitCode === 1) return;

  const briefs = arg === "--all" ? loadBriefs() : [resolveBrief(arg)];
  for (const brief of briefs) {
    await shortlistBrief(brief);
  }

  console.log("\nNothing has been selected. Build the review board and choose:");
  console.log("  node scripts/media/build-review-board.mjs");
}

/** `exitCode`, not `exit()` — sharp's worker threads are live here. See approve-selection.mjs. */
main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
