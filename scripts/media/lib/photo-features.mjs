/**
 * Extracts `PhotoFeatures` from an image file.
 *
 * The only place in the media-intelligence path that decodes pixels. Everything downstream — the
 * weights, the thresholds, the verdict — lives in src/services/media-intelligence/photo-scorer.ts and
 * is shared with the application, so this module deliberately has no opinions. It measures and returns.
 *
 * Analysis runs on a 256px-wide greyscale copy, not the master. Edge statistics at full resolution
 * measure sensor noise and JPEG artefacts as enthusiastically as they measure subject matter, and a
 * 6000px frame would cost a second each. Downscaling first is both faster and more honest about what a
 * person actually perceives.
 */
import sharp from "sharp";

const ANALYSIS_WIDTH = 256;

/**
 * Maps a library filename to the category a real media record would carry.
 *
 * Offline only. In the application the category comes from the upload, where it is a recorded fact; this
 * exists so the report can be run against the demonstration library, whose filenames encode the same
 * information. Anything unrecognised becomes `unknown`, which is treated as possibly-exterior rather than
 * excluded — guessing a photograph out of contention would be worse than admitting we cannot tell.
 */
const CATEGORY_BY_VIEW = {
  front: "exterior",
  side: "exterior",
  rear: "exterior",
  exterior: "exterior",
  interior: "interior",
  dashboard: "dashboard",
  wheel: "wheels",
  wheels: "wheels",
  engine: "engine",
  boot: "boot",
  "rear-seats": "rear-seats",
};

export const categoryFromViewName = (view) => CATEGORY_BY_VIEW[String(view).toLowerCase()] ?? "unknown";

/**
 * A 3×3 Laplacian. Responds to local intensity change in any direction, which is what "edge energy"
 * means here — deliberately not a directional Sobel, because a car's defining lines run every way.
 */
const LAPLACIAN = { width: 3, height: 3, kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0] };


/**
 * Mean and 95th percentile of a raw single-channel buffer.
 *
 * Both are needed and they answer different questions: the mean is busyness, the peak is acuity. A
 * counting histogram rather than a sort — 256 buckets is exact for 8-bit data and avoids sorting ~44 000
 * values per image for every image in the library.
 */
function meanAndPeak(data) {
  const histogram = new Uint32Array(256);
  let sum = 0;

  for (let i = 0; i < data.length; i += 1) {
    histogram[data[i]] += 1;
    sum += data[i];
  }

  const target = data.length * 0.95;
  let cumulative = 0;
  let peak = 0;
  for (let value = 0; value < 256; value += 1) {
    cumulative += histogram[value];
    if (cumulative >= target) {
      peak = value;
      break;
    }
  }

  return { mean: data.length ? sum / data.length / 255 : 0, peak: peak / 255 };
}

/**
 * Measure one image.
 *
 * @param {string} file      Path to the image.
 * @param {string} id        Identifier carried through to the score — a filename or media record id.
 * @param {string} category  Recorded photo category. Defaults to `unknown`.
 * @returns {Promise<import("../../../src/services/media-intelligence/photo-features.types").PhotoFeatures>}
 */
export async function extractPhotoFeatures(file, id, category = "unknown") {
  const source = sharp(file);
  const meta = await source.metadata();

  /* Greyscale, because every measurement here is about luminance and structure rather than colour. */
  const analysis = sharp(file).resize({ width: ANALYSIS_WIDTH, withoutEnlargement: true }).greyscale();

  const { data, info } = await analysis.clone().raw().toBuffer({ resolveWithObject: true });
  const stats = await analysis.clone().stats();

  const luminance = stats.channels[0];
  const meanLuminance = luminance.mean / 255;
  const rmsContrast = luminance.stdev / 255;

  /**
   * Clipped share: pixels with no recoverable detail at either end.
   *
   * This is what separates a night photograph, which the brand actively wants, from an underexposed
   * one. Both are dark on average; only the second has nothing in its shadows.
   */
  let clipped = 0;
  for (let i = 0; i < data.length; i += 1) {
    if (data[i] <= 8 || data[i] >= 249) clipped += 1;
  }
  const clippedShare = data.length ? clipped / data.length : 0;

  const edges = await sharp(file)
    .resize({ width: ANALYSIS_WIDTH, withoutEnlargement: true })
    .greyscale()
    .convolve(LAPLACIAN)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const energy = meanAndPeak(edges.data);

  return {
    id,
    category,
    /* Dimensions come from the master, not the analysis copy — resolution is scored on the real file. */
    width: meta.width ?? info.width,
    height: meta.height ?? info.height,
    meanLuminance,
    rmsContrast,
    edgeEnergy: energy.mean,
    edgePeak: energy.peak,
    clippedShare,
  };
}
