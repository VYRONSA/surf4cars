/**
 * Creates the premium media library's directory tree — step 0 of the creative review workflow.
 *
 * Approved photographs are build artefacts and are not committed, so a fresh clone has no library
 * at all. Running this makes the tree exist, with a README in each directory stating what belongs
 * there and how it is allowed to arrive. Both come from LIBRARY_SECTIONS, so the note on disk can
 * never contradict where the approval script actually files things.
 *
 * Safe to re-run: it writes READMEs and creates directories, and touches nothing else. Approved
 * assets are never read, moved or deleted here.
 *
 * Usage:
 *   node scripts/media/scaffold-library.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { LIBRARY_SECTIONS, PREMIUM_DIR } from "./lib/library.mjs";

const SOURCING_NOTE = {
  curated: [
    "**How assets arrive here:** Founder approval, and only Founder approval.",
    "",
    "    node scripts/media/shortlist-candidates.mjs <brief-id>   # collect 3–5 candidates",
    "    open http://localhost:3003/admin/creative/media-review   # review and approve",
    "",
    "Nothing in this directory was chosen by software. Do not add, edit or overwrite a file here by",
    "hand — an image that appears without an approval is an image nobody decided on, and the licence",
    "and attribution the site renders come from the manifest, not from the file.",
  ],
  composed: [
    "**How assets arrive here:** Founder approval of the photographic *plate* only.",
    "",
    "The finished banner is the plate plus SURF typography, composed in the layout at render time.",
    "Type is never burned into the pixels — baked-in text cannot scale, translate, or meet contrast",
    "requirements, and it is the single reason the retired v3 hero had to be replaced.",
  ],
  uploaded: [
    "**How assets arrive here:** uploaded by the party that owns them. Never sourced, never curated.",
    "",
    "Everything in this directory is someone else's property — a trademark, or a factual record of a",
    "specific car that is for sale. Substituting a stock image for one of these would be a",
    "misrepresentation, and in the case of a mark, an infringement. If the real asset is missing, the",
    "correct behaviour is a branded fallback, not a lookalike.",
  ],
};

const readme = (section) =>
  [
    `# ${section.label}`,
    "",
    section.purpose,
    "",
    ...SOURCING_NOTE[section.sourcing],
    "",
    "---",
    "",
    section.briefs.length
      ? `Review briefs filed here: ${section.briefs.map((id) => `\`${id}\``).join(", ")}.`
      : "No review brief fills this directory.",
    "",
    "Taxonomy is defined in `scripts/media/lib/library.mjs`. Provenance for every approved asset is",
    "recorded in `public/media/premium/manifest.json` and read by the application through",
    "`src/config/media`. See `docs/experience-bible/10-creative-direction.md`.",
    "",
  ].join("\n");

mkdirSync(PREMIUM_DIR, { recursive: true });

for (const section of LIBRARY_SECTIONS) {
  const directory = join(PREMIUM_DIR, section.id);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "README.md"), readme(section));
  console.log(`  ${directory.padEnd(34)} ${section.sourcing}`);
}

console.log(`\nPremium media library scaffolded — ${LIBRARY_SECTIONS.length} sections.`);
