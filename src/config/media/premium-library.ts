/**
 * SURF FOR CARS — Premium Media Library
 *
 * The curated, Founder-approved visual identity. Every asset reachable from here was chosen from a
 * candidate board and approved on the record; nothing arrives by search, heuristic, or download at
 * runtime. `scripts/media/` is a content acquisition tool used before a decision is made — the
 * application never calls it.
 *
 * To change what the brand looks like, approve a different candidate. Do not edit the manifest.
 */

import { PREMIUM_MEDIA_MANIFEST } from "./premium-manifest.generated";

/** One of a photograph's dominant colours, and how much of the frame it occupies. */
export interface PaletteEntry {
  readonly hex: string;
  readonly share: number;
}

/** A photograph approved into the library, with the provenance its licence obliges us to keep. */
export interface PremiumMediaAsset {
  readonly id: string;
  /** Library directory this asset was filed in. See scripts/media/library.sections.json. */
  readonly section?: string;
  readonly kind: "photograph" | "treatment";
  readonly title: string;
  /**
   * Dominant colours, measured from the master at approval time. Read by the brand moodboard to
   * answer whether the approved set hangs together as one identity. Absent on treatments, and on
   * anything approved before palettes were recorded.
   */
  readonly palette?: readonly PaletteEntry[];
  /** Public path under /media/premium/. Null for treatments, which are rendered, not served. */
  readonly src: string | null;
  readonly width: number | null;
  readonly height: number | null;
  /** Identifier of the approved design treatment, for briefs decided in-house. */
  readonly treatment?: string | null;
  readonly licence: string;
  readonly licenceUrl: string | null;
  readonly requiresAttribution: boolean;
  readonly author: string;
  readonly authorUrl?: string | null;
  readonly provider?: string | null;
  readonly sourceUrl: string | null;
  readonly brief: { readonly title: string; readonly emotion: string };
  readonly approvedOn: string;
  readonly approvalNote: string | null;
}

const LIBRARY = PREMIUM_MEDIA_MANIFEST as unknown as Readonly<Record<string, PremiumMediaAsset>>;

/** Every approved asset, in approval order within each id. */
export const listPremiumMedia = (): readonly PremiumMediaAsset[] => Object.values(LIBRARY);

export const getPremiumMedia = (id: string): PremiumMediaAsset | null => LIBRARY[id] ?? null;

/**
 * The path an image should render from.
 *
 * Until a category has been through review, this returns the legacy asset so the site keeps
 * working — approving a candidate is what swaps it, with no code change. A category with neither
 * an approval nor a fallback returns null rather than a broken path, so the caller can decide
 * whether to render nothing or a placeholder.
 */
export function resolvePremiumImage(id: string, fallback?: string): string | null {
  return getPremiumMedia(id)?.src ?? fallback ?? null;
}

/** True once a category's image has been curated rather than inherited. */
export const isCurated = (id: string): boolean => getPremiumMedia(id)?.kind === "photograph";

export interface MediaAttribution {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly authorUrl: string | null;
  readonly licence: string;
  readonly licenceUrl: string | null;
  readonly sourceUrl: string | null;
}

const toAttribution = (asset: PremiumMediaAsset): MediaAttribution => ({
  id: asset.id,
  title: asset.title,
  author: asset.author,
  authorUrl: asset.authorUrl ?? null,
  licence: asset.licence,
  licenceUrl: asset.licenceUrl,
  sourceUrl: asset.sourceUrl,
});

/** Attribution for one asset, or null where the licence does not oblige one. */
export function getAttribution(id: string): MediaAttribution | null {
  const asset = getPremiumMedia(id);
  return asset?.requiresAttribution ? toAttribution(asset) : null;
}

/**
 * Every attribution the library owes, for the credits page.
 *
 * CC BY and CC BY-SA are only free to use while the credit is actually given. Listing them in one
 * place means the obligation is discharged even for an image whose own surface has no room for a
 * caption.
 */
export const listAttributions = (): readonly MediaAttribution[] =>
  listPremiumMedia()
    .filter((asset) => asset.requiresAttribution)
    .map(toAttribution)
    .sort((a, b) => a.id.localeCompare(b.id));

/** Responsive `sizes` hints for the layouts curated media lands in. */
export const PREMIUM_MEDIA_SIZES = {
  fullWidth: "100vw",
  sectionHalf: "(max-width: 768px) 100vw, 50vw",
  sectionWide: "(max-width: 1024px) 100vw, 1280px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
} as const;
