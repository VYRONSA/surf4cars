/**
 * Builds the demonstration vehicle photography library.
 *
 * The seeded marketplace shipped 2779 media rows pointing at just 6 distinct URLs — and none of
 * them were vehicle photographs; they were UI hero graphics recycled as car photos. That single
 * fact is what made the marketplace look artificial.
 *
 * This fetches real, freely-licensed vehicle photography from Wikimedia Commons and records the
 * attribution every licence here requires.
 *
 * LICENCE HANDLING
 *   - Only images whose licence is in ALLOWED_LICENCES are downloaded. Anything else is skipped,
 *     including "fair use" and non-commercial variants.
 *   - Author, licence and source page are written to attribution.json for every downloaded file.
 *     CC BY and CC BY-SA both require attribution; the app must surface it (see the image credit
 *     rule in docs/experience-bible/03-photography.md).
 *   - Nothing is scraped from dealer sites or competing marketplaces.
 *
 * Usage:
 *   node scripts/seed/fetch-vehicle-photography.mjs [--per-model=6] [--only=BMW_X5] [--dry-run]
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const API = "https://commons.wikimedia.org/w/api.php";
const OUT_DIR = join("public", "images", "vehicles", "library");
const MANIFEST = join(OUT_DIR, "attribution.json");

// Wikimedia asks for a descriptive User-Agent identifying the tool and a contact.
const USER_AGENT =
  "SURF4CARS-DemoSeed/1.0 (https://surf4cars.co.za; demo photography seeding) node-fetch";

/** Free licences only. Anything not on this list is skipped rather than guessed at. */
const ALLOWED_LICENCES = [
  "cc0", "cc by 1.0", "cc by 2.0", "cc by 2.5", "cc by 3.0", "cc by 4.0",
  "cc by-sa 1.0", "cc by-sa 2.0", "cc by-sa 2.5", "cc by-sa 3.0", "cc by-sa 4.0",
  "public domain", "pd", "pdm-owner",
];

/**
 * The shot sequence from the Experience Bible. Commons rarely has a full studio set for one car,
 * so each slot searches for the kind of frame it needs and we take the best available match.
 */
const SHOT_SLOTS = [
  { slot: "front", hint: "" },
  { slot: "rear", hint: "rear" },
  { slot: "side", hint: "side" },
  { slot: "interior", hint: "interior" },
  { slot: "dashboard", hint: "dashboard cockpit" },
  { slot: "wheel", hint: "wheel" },
  { slot: "engine", hint: "engine" },
];

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};
const DRY_RUN = args.includes("--dry-run");
const PER_MODEL = Number(argOf("per-model", 6));
const ONLY = argOf("only", null);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ ...params, format: "json", origin: "*" })}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  return res.json();
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function licenceAllowed(licence) {
  const normalised = String(licence ?? "").toLowerCase().trim();
  return ALLOWED_LICENCES.some((allowed) => normalised === allowed || normalised.startsWith(allowed));
}

/** Searches Commons for candidate photographs of one model. */
async function findCandidates(make, model, hint, limit) {
  const search = `filetype:bitmap ${make} ${model} ${hint}`.trim();
  const data = await api({
    action: "query",
    generator: "search",
    gsrsearch: search,
    gsrlimit: String(limit),
    gsrnamespace: "6",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size|mime",
    iiurlwidth: "1600",
  });

  const pages = data?.query?.pages ?? {};
  return Object.values(pages)
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata ?? {};
      return {
        title: page.title,
        licence: stripHtml(meta.LicenseShortName?.value),
        author: stripHtml(meta.Artist?.value),
        descriptionUrl: info.descriptionurl,
        url: info.thumburl || info.url,
        width: info.width,
        height: info.height,
        mime: info.mime,
      };
    })
    .filter((c) => c && c.mime === "image/jpeg" && c.width >= 1200 && licenceAllowed(c.licence));
}

async function download(url, destination) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(destination, buffer);
  return buffer.length;
}

const slugify = (value) =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const models = JSON.parse(readFileSync(join("scripts", "seed", "vehicle-models.json"), "utf8"));
  const targets = ONLY ? models.filter((m) => slugify(`${m.make} ${m.model}`) === ONLY) : models;

  if (!DRY_RUN) mkdirSync(OUT_DIR, { recursive: true });

  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
  let downloaded = 0;
  let skipped = 0;

  for (const { make, model } of targets) {
    const key = slugify(`${make} ${model}`);
    const dir = join(OUT_DIR, key);

    if (manifest[key]?.length >= PER_MODEL) {
      console.log(`= ${key} — already has ${manifest[key].length}`);
      continue;
    }

    if (!DRY_RUN) mkdirSync(dir, { recursive: true });
    const entries = manifest[key] ?? [];
    const seen = new Set(entries.map((e) => e.title));

    for (const { slot, hint } of SHOT_SLOTS) {
      if (entries.length >= PER_MODEL) break;

      let candidates = [];
      try {
        candidates = await findCandidates(make, model, hint, 8);
      } catch (error) {
        console.log(`! ${key}/${slot} search failed: ${error.message}`);
        continue;
      }

      const pick = candidates.find((c) => !seen.has(c.title));
      if (!pick) {
        skipped += 1;
        continue;
      }
      seen.add(pick.title);

      const file = `${slot}.jpg`;
      if (DRY_RUN) {
        console.log(`+ ${key}/${file}  ${pick.licence}  ${pick.title.slice(0, 50)}`);
      } else {
        try {
          const bytes = await download(pick.url, join(dir, file));
          console.log(`+ ${key}/${file}  ${(bytes / 1024).toFixed(0)}KB  ${pick.licence}`);
        } catch (error) {
          console.log(`! ${key}/${file} download failed: ${error.message}`);
          continue;
        }
        await sleep(120); // be polite to Commons
      }

      entries.push({
        slot,
        file: `/images/vehicles/library/${key}/${file}`,
        title: pick.title,
        author: pick.author,
        licence: pick.licence,
        source: pick.descriptionUrl,
      });
      downloaded += 1;
    }

    manifest[key] = entries;
    if (!DRY_RUN) writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  }

  console.log(`\n${downloaded} image(s) added, ${skipped} slot(s) with no free-licensed match.`);
  console.log(`Attribution manifest: ${MANIFEST}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
