/**
 * Compresses the demonstration photography library for web delivery.
 *
 * Commons originals arrive at ~400KB each as JPEG. At 47 models that is over 100MB of assets for a
 * demo library — enough to hurt both the repository and page weight, and "photography is the
 * product" only holds if the photographs actually arrive quickly.
 *
 * Re-encodes to WebP at a sensible display width. The manifest is rewritten to point at the .webp
 * files so attribution stays attached to the image that is actually served.
 *
 * Usage: node scripts/seed/optimise-vehicle-photography.mjs [--width=1400] [--quality=78]
 */
import { readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const LIB = join("public", "images", "vehicles", "library");
const MANIFEST = join(LIB, "attribution.json");

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split("=")[1]) : fallback;
};
const WIDTH = argOf("width", 1400);
const QUALITY = argOf("quality", 78);

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  let before = 0;
  let after = 0;
  let converted = 0;

  for (const [key, images] of Object.entries(manifest)) {
    for (const image of images) {
      const jpg = join(LIB, key, `${image.slot}.jpg`);
      const webp = join(LIB, key, `${image.slot}.webp`);

      let size;
      try {
        size = statSync(jpg).size;
      } catch {
        continue; // already converted on a previous run
      }

      await sharp(jpg)
        .resize({ width: WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(webp);

      before += size;
      after += statSync(webp).size;
      converted += 1;
      unlinkSync(jpg);

      image.file = `/images/vehicles/library/${key}/${image.slot}.webp`;
    }
  }

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
  console.log(`Converted ${converted} image(s): ${mb(before)}MB → ${mb(after)}MB`);
  console.log(`Library total: ${mb(totalSize(LIB))}MB`);
}

function totalSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    total += entry.isDirectory() ? totalSize(path) : statSync(path).size;
  }
  return total;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
