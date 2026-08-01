/**
 * Content acquisition for briefs that cannot be sourced from a stock library.
 *
 * A dealership's logo is its own trademark — it is uploaded by the dealer and must never be
 * substituted with a stock image. What the platform actually needs curating is the FALLBACK mark
 * rendered when a dealership has not uploaded one. Those candidates are drawn from the SURF brand
 * system, so no third-party licence applies and attribution is not owed to anyone.
 *
 * Usage:
 *   node scripts/media/generate-inhouse-candidates.mjs dealer-logo
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

import { CANDIDATES_DIR, resolveBrief } from "./lib/acquire.mjs";

const GOLD = "#c8a96e";
const INK = "#0b0b0c";
const PAPER = "#f4f4f5";

/** Two sample dealerships, so each treatment is judged on more than one set of initials. */
const SAMPLES = [
  { name: "Atlantic Motor Group", initials: "AM" },
  { name: "Kloof Street Auto", initials: "KA" },
];

const font = "Helvetica Neue, Helvetica, Arial, sans-serif";

/**
 * Each treatment renders a full review card: the mark at 160px next to the same mark at 40px, on
 * both a dark and a light card. A fallback logo that only works in one of those places is not a
 * fallback logo.
 */
const TREATMENTS = [
  {
    id: "solid",
    label: "A — Solid tile",
    rationale: "Filled gold tile, ink initials. Highest contrast, reads at any size, sits closest to a real logo.",
    mark: (initials, size) => `
      <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${GOLD}"/>
      <text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="${font}"
            font-size="${size * 0.42}" font-weight="700" letter-spacing="${size * 0.01}" fill="${INK}">${initials}</text>`,
  },
  {
    id: "outline",
    label: "B — Outlined monogram",
    rationale: "Hairline gold rule on the card's own background. Quietest option; recedes behind the dealership name.",
    mark: (initials, size) => `
      <rect x="${size * 0.04}" y="${size * 0.04}" width="${size * 0.92}" height="${size * 0.92}"
            rx="${size * 0.2}" fill="none" stroke="${GOLD}" stroke-width="${Math.max(1, size * 0.028)}"/>
      <text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="${font}"
            font-size="${size * 0.38}" font-weight="600" letter-spacing="${size * 0.02}" fill="${GOLD}">${initials}</text>`,
  },
  {
    id: "rule",
    label: "C — Initial over rule",
    rationale: "Single initial with a gold underline. Most editorial, least logo-like — closest to the SURF wordmark's own restraint.",
    mark: (initials, size) => `
      <text x="50%" y="52%" text-anchor="middle" font-family="${font}"
            font-size="${size * 0.52}" font-weight="300" letter-spacing="${size * 0.03}" fill="currentColor">${initials[0]}</text>
      <rect x="${size * 0.32}" y="${size * 0.66}" width="${size * 0.36}" height="${Math.max(1.5, size * 0.035)}" fill="${GOLD}"/>`,
  },
];

function card(treatment) {
  const width = 1000;
  const height = 460;
  const panels = [
    { x: 0, bg: INK, fg: PAPER },
    { x: width / 2, bg: PAPER, fg: INK },
  ];

  const body = panels
    .map(({ x, bg, fg }) => {
      const rows = SAMPLES.map((sample, row) => {
        const top = 120 + row * 150;
        return `
          <g transform="translate(${x + 60}, ${top})" color="${fg}">
            <svg width="96" height="96" viewBox="0 0 96 96">${treatment.mark(sample.initials, 96)}</svg>
            <g transform="translate(124, 26)">
              <svg width="40" height="40" viewBox="0 0 40 40">${treatment.mark(sample.initials, 40)}</svg>
            </g>
            <text x="184" y="56" font-family="${font}" font-size="19" fill="${fg}" opacity="0.82">${sample.name}</text>
          </g>`;
      }).join("");

      return `
        <g>
          <rect x="${x}" y="0" width="${width / 2}" height="${height}" fill="${bg}"/>
          <text x="${x + 60}" y="62" font-family="${font}" font-size="13" letter-spacing="2.4"
                fill="${fg}" opacity="0.5">${bg === INK ? "DARK CARD" : "LIGHT CARD"}</text>
          ${rows}
        </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`;
}

async function main() {
  const brief = resolveBrief(process.argv[2] ?? "dealer-logo");
  if (brief.acquisition !== "in-house") {
    throw new Error(`Brief "${brief.id}" is sourced externally — use shortlist-candidates.mjs.`);
  }

  const dir = join(CANDIDATES_DIR, brief.id);
  mkdirSync(dir, { recursive: true });

  console.log(`\n${brief.title} (${brief.id}) — ${brief.emotion}`);

  const candidates = [];
  for (const [i, treatment] of TREATMENTS.entries()) {
    const index = i + 1;
    const svg = card(treatment);
    const preview = `candidate-${index}.jpg`;
    await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(join(dir, preview));
    writeFileSync(join(dir, `candidate-${index}.svg`), svg);

    candidates.push({
      index,
      preview,
      title: treatment.label,
      rationale: treatment.rationale,
      licence: "SURF brand system",
      licenceUrl: null,
      requiresAttribution: false,
      author: "Surf4Cars",
      sourceUrl: null,
      width: 1000,
      height: 460,
      generator: `scripts/media/generate-inhouse-candidates.mjs#${treatment.id}`,
    });

    console.log(`  [${index}] ${treatment.label} — ${treatment.rationale}`);
  }

  writeFileSync(
    join(dir, "candidates.json"),
    `${JSON.stringify({ brief: { id: brief.id, title: brief.title, emotion: brief.emotion, direction: brief.direction, note: brief.note ?? null }, candidates }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
