/**
 * The editorial layer's vocabulary.
 *
 * Kept free of Supabase types so the console, the marketplace read path and any future script all
 * describe curation the same way.
 */

export type EditorialSlotKind =
  | "homepage-hero"
  | "homepage-featured"
  | "collection"
  | "dealer-spotlight";

export type EditorialSubjectKind = "vehicle" | "dealership" | "media";

export interface EditorialSlot {
  readonly key: string;
  readonly title: string;
  /** The section heading shown on the marketplace. Null for a hero, which has no heading. */
  readonly headline: string | null;
  readonly description: string | null;
  readonly kind: EditorialSlotKind;
  readonly position: number;
  readonly published: boolean;
}

export interface EditorialPlacement {
  readonly id: string;
  readonly slotKey: string;
  readonly subjectKind: EditorialSubjectKind;
  readonly subjectId: string;
  /** Rule 7. 40–80 words, written by a person. */
  readonly story: string | null;
  readonly position: number;
  readonly published: boolean;
}

export interface EditorialSlotWithPlacements {
  readonly slot: EditorialSlot;
  readonly placements: readonly EditorialPlacement[];
}

/**
 * What the marketplace got, and whether a person chose it.
 *
 * `source` is not decoration. A homepage rendering its algorithmic fallback and a homepage rendering
 * the Founder's choices look identical from the outside, and the difference is the entire point of
 * this programme — so every read says which one happened, the console displays it, and nobody has to
 * guess whether their curation is live.
 */
export type EditorialSource = "curated" | "fallback" | "unavailable";

export interface EditorialRead<T> {
  readonly value: T;
  readonly source: EditorialSource;
  /** Present when the source is not `curated`, so the reason is never inferred from an empty list. */
  readonly reason?: string;
}
