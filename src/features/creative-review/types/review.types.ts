/**
 * SURF FOR CARS — Creative Review types.
 *
 * These describe the Founder's review surface, not the runtime brand. Once a candidate is approved
 * it stops being any of these and becomes a `PremiumMediaAsset` in `src/config/media` — the only
 * shape the public application knows about.
 */

/** How an asset is allowed to reach a library section. See scripts/media/library.sections.json. */
export type LibrarySourcing = "curated" | "uploaded" | "composed";

export interface LibrarySection {
  readonly id: string;
  readonly label: string;
  readonly sourcing: LibrarySourcing;
  readonly purpose: string;
  readonly briefs: readonly string[];
}

/** The creative instruction a candidate is judged against. */
export interface ReviewBrief {
  readonly id: string;
  readonly title: string;
  /** `in-house` briefs approve a design treatment rather than a photograph. */
  readonly acquisition: "sourced" | "in-house";
  readonly emotion: string;
  readonly direction: string;
  readonly note: string | null;
  /** Aspect ratio the slot is actually used at. Candidates preview cropped to it. */
  readonly aspect: number;
}

/** One frame on a board, with everything needed to judge it and everything needed to ship it. */
export interface ReviewCandidate {
  readonly index: number;
  /** A, B, C… — how a candidate is referred to in conversation. */
  readonly letter: string;
  readonly title: string;
  readonly licence: string;
  readonly licenceUrl: string | null;
  readonly requiresAttribution: boolean;
  readonly author: string;
  readonly authorUrl: string | null;
  readonly provider: string | null;
  readonly sourceUrl: string | null;
  readonly width: number | null;
  readonly height: number | null;
  /** The search that surfaced it — useful for judging whether a brief's terms are working. */
  readonly searchTerm: string | null;
  /** Path this dashboard streams the preview from. Candidates live outside `public/`. */
  readonly previewPath: string;
  /** True for in-house treatments, which have no pixel dimensions to report. */
  readonly isVector: boolean;
}

/** Provenance of the asset currently in production for a brief. */
export interface ApprovedRecord {
  readonly title: string;
  readonly src: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly licence: string;
  readonly requiresAttribution: boolean;
  readonly author: string;
  readonly sourceUrl: string | null;
  readonly approvedOn: string;
  readonly approvalNote: string | null;
  /** How many times this slot has been re-decided. */
  readonly supersededCount: number;
}

export interface ReviewBriefBoard {
  readonly brief: ReviewBrief;
  readonly candidates: readonly ReviewCandidate[];
  readonly approved: ApprovedRecord | null;
  /** Set when a brief is listed in the taxonomy but has never been shortlisted. */
  readonly missingBoard: boolean;
}

export interface ReviewSectionBoard {
  readonly section: LibrarySection;
  readonly briefs: readonly ReviewBriefBoard[];
}

export interface CreativeReviewBoard {
  readonly sections: readonly ReviewSectionBoard[];
  readonly decided: number;
  readonly awaiting: number;
  readonly candidatesWaiting: number;
}

/** Result of an approval attempt, surfaced next to the brief it was made against. */
export interface ApprovalResult {
  readonly status: "idle" | "approved" | "error";
  readonly briefId: string | null;
  readonly message: string;
}
