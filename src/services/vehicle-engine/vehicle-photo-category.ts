import type { VehiclePhotoCategory } from "@/domain/vehicle/types/vehicle-media.types";

/**
 * What a photograph is of.
 *
 * WHY THIS EXISTS
 * ===============
 * Both read paths — `vehicle-platform.repository.ts` and `vehicle-record.mapper.ts` — set
 * `category: "exterior"` on every photograph as a literal. Not as a default, as a constant: an
 * instrument cluster, a wheel, a boot and a dashboard all arrived at the projection labelled as
 * exteriors.
 *
 * It was visible on the product. The vehicle page captions each frame from this field, so a gallery
 * of eight photographs read "Exterior" eight times, over an interior, over a dashboard, over an
 * engine bay. And it was load-bearing: the lead-image chooser prefers an exterior specifically so a
 * card does not lead with a dashboard, and with every frame claiming to be one, that rule could never
 * fire. The Corolla's card led with an instrument cluster lit with warning lamps while the code that
 * exists to prevent exactly that was working correctly on the data it was given.
 *
 * The comment above the chooser read "the category is recorded at upload, so this is a fact rather
 * than an inference". It was neither.
 *
 * WHAT IT DERIVES FROM
 * ====================
 * The file name, which is the only real signal these records carry — the library is laid out as
 * `library/<model>/front.webp`, `interior.webp`, `wheel.webp` and so on, and the upload wizard names
 * by category too. A name is a fact about the asset rather than a guess about its pixels, which is
 * the line this platform draws everywhere else.
 *
 * WHERE IT CANNOT TELL, IT RETURNS `undefined`
 * ============================================
 * Not `"exterior"`. That default is what produced the problem, and an unrecognised name means nobody
 * has said what the photograph shows — which is a different thing from somebody having said it is a
 * picture of the car. Consumers must treat the two differently: the gallery omits the caption, and
 * the lead-image chooser declines to lead with it.
 */

/** Ordered longest-first so `rear-seats` is tested before `rear`, and `wheel` before `heel`. */
const FILENAME_CATEGORIES: readonly (readonly [string, VehiclePhotoCategory])[] = [
  ["rear-seat", "rear-seats"],
  ["backseat", "rear-seats"],
  ["dashboard", "dashboard"],
  ["dash", "dashboard"],
  ["interior", "interior"],
  ["cabin", "interior"],
  ["engine", "engine"],
  ["motor", "engine"],
  ["wheel", "wheels"],
  ["rim", "wheels"],
  ["tyre", "wheels"],
  ["boot", "boot"],
  ["trunk", "boot"],
  ["cargo", "boot"],

  /* Full-vehicle views. Only these may lead a card. */
  ["front", "exterior"],
  ["rear", "exterior"],
  ["side", "exterior"],
  ["exterior", "exterior"],
  ["profile", "exterior"],
  ["three-quarter", "exterior"],
];

/**
 * Best-effort category for a photograph, from its file name or URL.
 *
 * `undefined` means unknown, and unknown is never treated as exterior.
 */
export function resolveVehiclePhotoCategory(
  fileName?: string | null,
  url?: string | null,
): VehiclePhotoCategory | undefined {
  /* The URL is the fallback because a library asset's path carries the same word its file name does,
     and seeded records do not always populate `fileName`. */
  const haystack = `${fileName ?? ""} ${url ?? ""}`.toLowerCase();
  if (!haystack.trim()) return undefined;

  for (const [needle, category] of FILENAME_CATEGORIES) {
    if (haystack.includes(needle)) return category;
  }

  return undefined;
}
