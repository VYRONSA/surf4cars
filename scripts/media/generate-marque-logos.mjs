/**
 * Writes manufacturer marks into the premium media library.
 *
 * Source: `simple-icons`, published under CC0-1.0 — the path data itself carries no copyright claim, and
 * each icon ships the manufacturer's own official brand colour.
 *
 * WHAT THIS DOES AND DOES NOT SETTLE
 * ==================================
 * CC0 covers the *artwork file*. It does not transfer a trademark, because nobody can: the marks remain
 * the property of the manufacturers. What makes using them defensible here is the context — SURF4CARS
 * lists these manufacturers' vehicles for sale, and identifying a brand whose goods you genuinely sell is
 * nominative use. That is the same basis on which every classifieds site in the country shows a badge.
 *
 * Two rules follow, and they are why this script exists rather than a folder of downloads:
 *
 *   unmodified   the mark is written exactly as published, at its official colour. Recolouring is the
 *                thing brand guidelines forbid most consistently, so the colour comes from the source
 *                rather than from us.
 *   replaceable  each file lands at the same path a licensed asset would. If a manufacturer supplies its
 *                own artwork, overwrite the file and nothing else changes.
 *
 * Marques absent from the set keep their typographic treatment. Nothing is approximated or redrawn.
 *
 * Usage:
 *   node scripts/media/generate-marque-logos.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import * as simpleIcons from "simple-icons";

const OUT_DIR = join("public", "media", "premium", "manufacturers");

/** The marques the platform stocks, mapped to how they are named in the `make` column. */
const MARQUES = [
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Porsche",
  "Volvo",
  "Jaguar",
  "Lexus",
  "Toyota",
  "Volkswagen",
  "Ford",
  "Hyundai",
  "Kia",
  "Nissan",
  "Isuzu",
  "Mazda",
  "Suzuki",
  "Peugeot",
  "Renault",
  "Mitsubishi",
  "Honda",
  "Mahindra",
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const icons = Object.values(simpleIcons).filter((icon) => icon && typeof icon.title === "string");

const findIcon = (name) =>
  icons.find((icon) => icon.title.toLowerCase() === name.toLowerCase()) ?? null;

mkdirSync(OUT_DIR, { recursive: true });

const written = [];
const missing = [];

for (const marque of MARQUES) {
  const icon = findIcon(marque);
  if (!icon) {
    missing.push(marque);
    continue;
  }

  const slug = slugify(marque);

  /*
   * `viewBox` is always 0 0 24 24 for this set, and the path is a single shape. Writing the fill as the
   * manufacturer's own hex means the file is correct on any background the strip ever uses, rather than
   * depending on a CSS filter that a future change could remove.
   */
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${icon.title}">`,
    `<title>${icon.title}</title>`,
    `<path fill="#${icon.hex}" d="${icon.path}"/>`,
    `</svg>`,
  ].join("");

  writeFileSync(join(OUT_DIR, `${slug}.svg`), `${svg}\n`);
  written.push({ slug, title: icon.title, hex: `#${icon.hex}` });
}

for (const entry of written) {
  console.log(`  ${entry.slug.padEnd(16)} ${entry.hex}  ${entry.title}`);
}

console.log(`\n${written.length} marks written to ${OUT_DIR}.`);

if (missing.length > 0) {
  console.log(`\nNot in the CC0 set — these keep their typographic treatment:`);
  console.log(`  ${missing.join(", ")}`);
  console.log(`  Supply official artwork at ${OUT_DIR}/<slug>.svg to replace it.`);
}

console.log(`\nRegister these slugs in LICENSED_LOGOS:`);
console.log(`  ${written.map((entry) => `"${entry.slug}"`).join(", ")}`);
