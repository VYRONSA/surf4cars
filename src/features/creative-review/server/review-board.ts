/**
 * Reads the creative review board from disk.
 *
 * The Experience Bible's engineering rule — "the application reads src/config/media, never
 * scripts/media" — is about the *public* application, and it holds: nothing here is reachable from
 * a marketplace page, and none of it is bundled into a production build. The review dashboard is
 * the one surface that must see candidates, because reviewing them is what it is for.
 *
 * Everything is read at request time rather than imported. A board the Founder is halfway through
 * refreshing should show what is on disk now, not what was on disk when the dev server booted.
 *
 * Server-only: `node:fs`. Never import this from a Client Component.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { env } from "@/config/env";
import type {
  ApprovedRecord,
  CreativeReviewBoard,
  LibrarySection,
  ReviewBrief,
  ReviewBriefBoard,
  ReviewCandidate,
  ReviewSectionBoard,
} from "@/features/creative-review/types/review.types";

const SECTIONS_PATH = join("scripts", "media", "library.sections.json");
const BRIEFS_PATH = join("scripts", "media", "briefs.json");
const CANDIDATES_DIR = join("scripts", "media", "candidates");
const MANIFEST_PATH = join("public", "media", "premium", "manifest.json");

const LETTERS = "ABCDEFGH";

/**
 * The dashboard writes into the working tree and regenerates a committed source file, so it is a
 * local curation tool by construction. In a deployed environment those writes would either fail or
 * vanish on the next deploy, and an approval that silently did not happen is worse than no button
 * at all — so the route does not exist in production.
 */
export const isCreativeReviewAvailable = (): boolean => !env.isProduction;

const readJson = <T,>(path: string, fallback: T): T => {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    /* A half-written board mid-shortlist is expected, not exceptional. Treat it as absent. */
    return fallback;
  }
};

export const readLibrarySections = (): readonly LibrarySection[] =>
  readJson<LibrarySection[]>(SECTIONS_PATH, []);

interface RawBrief {
  id: string;
  title: string;
  acquisition?: string;
  emotion?: string;
  direction?: string;
  note?: string | null;
  aspect?: number;
}

const toBrief = (raw: RawBrief): ReviewBrief => ({
  id: raw.id,
  title: raw.title,
  acquisition: raw.acquisition === "in-house" ? "in-house" : "sourced",
  emotion: raw.emotion ?? "",
  direction: raw.direction ?? "",
  note: raw.note ?? null,
  /** In-house marks are square; a photographic brief that forgot its aspect gets 3:2. */
  aspect: raw.aspect ?? (raw.acquisition === "in-house" ? 1 : 1.5),
});

interface RawCandidate {
  index: number;
  title?: string;
  licence?: string;
  licenceUrl?: string | null;
  requiresAttribution?: boolean;
  author?: string;
  authorUrl?: string | null;
  provider?: string;
  providerLabel?: string;
  generator?: string;
  sourceUrl?: string | null;
  width?: number | null;
  height?: number | null;
  searchTerm?: string | null;
  preview?: string;
}

const toCandidate = (briefId: string, raw: RawCandidate): ReviewCandidate => ({
  index: raw.index,
  letter: LETTERS[raw.index - 1] ?? String(raw.index),
  title: raw.title ?? "Untitled",
  licence: raw.licence ?? "Unknown",
  licenceUrl: raw.licenceUrl ?? null,
  requiresAttribution: raw.requiresAttribution ?? false,
  author: raw.author ?? "Unknown",
  authorUrl: raw.authorUrl ?? null,
  provider: raw.providerLabel ?? raw.provider ?? raw.generator ?? null,
  sourceUrl: raw.sourceUrl ?? null,
  width: raw.width ?? null,
  height: raw.height ?? null,
  searchTerm: raw.searchTerm ?? null,
  previewPath: `/admin/creative/media-review/candidates/${briefId}/${raw.index}`,
  isVector: !raw.width || !raw.height,
});

interface RawApproved {
  title?: string;
  src?: string | null;
  width?: number | null;
  height?: number | null;
  licence?: string;
  requiresAttribution?: boolean;
  author?: string;
  sourceUrl?: string | null;
  approvedOn?: string;
  approvalNote?: string | null;
  superseded?: readonly unknown[];
}

const toApproved = (raw: RawApproved): ApprovedRecord => ({
  title: raw.title ?? "Untitled",
  src: raw.src ?? null,
  width: raw.width ?? null,
  height: raw.height ?? null,
  licence: raw.licence ?? "Unknown",
  requiresAttribution: raw.requiresAttribution ?? false,
  author: raw.author ?? "Unknown",
  sourceUrl: raw.sourceUrl ?? null,
  approvedOn: raw.approvedOn ?? "—",
  approvalNote: raw.approvalNote ?? null,
  supersededCount: raw.superseded?.length ?? 0,
});

/** Filesystem path of a candidate preview, or null if the board does not hold that frame. */
export function resolveCandidatePreviewPath(briefId: string, index: number): string | null {
  /* Both segments come from a URL. Anything but a plain brief id and a small integer is refused
     outright rather than sanitised — this reads files from the working tree. */
  if (!/^[a-z0-9-]{1,40}$/.test(briefId) || !Number.isInteger(index) || index < 1 || index > 20) {
    return null;
  }

  const board = readJson<{ candidates?: RawCandidate[] }>(
    join(CANDIDATES_DIR, briefId, "candidates.json"),
    {},
  );
  const candidate = board.candidates?.find((entry) => entry.index === index);
  if (!candidate?.preview) return null;

  /* The filename is taken from the board, but the board is a file too — keep it to a bare name. */
  if (!/^[a-z0-9.-]{1,60}$/i.test(candidate.preview)) return null;

  const path = join(CANDIDATES_DIR, briefId, candidate.preview);
  return existsSync(path) ? path : null;
}

/**
 * The whole board: every section, every brief, its candidates, and what is approved today.
 *
 * A brief in the taxonomy with no shortlist is reported rather than hidden — "this category has
 * never been reviewed" is the most useful thing the dashboard can tell the Founder.
 */
export function readCreativeReviewBoard(): CreativeReviewBoard {
  const briefs = new Map(readJson<RawBrief[]>(BRIEFS_PATH, []).map((raw) => [raw.id, toBrief(raw)]));
  const manifest = readJson<{ assets?: Record<string, RawApproved> }>(MANIFEST_PATH, {});
  const approvals = manifest.assets ?? {};

  const sections: ReviewSectionBoard[] = readLibrarySections().map((section) => {
    const boards: ReviewBriefBoard[] = section.briefs.flatMap((briefId) => {
      const brief = briefs.get(briefId);
      if (!brief) return [];

      const board = readJson<{ candidates?: RawCandidate[] }>(
        join(CANDIDATES_DIR, briefId, "candidates.json"),
        {},
      );
      const candidates = (board.candidates ?? [])
        .map((raw) => toCandidate(briefId, raw))
        .sort((a, b) => a.index - b.index);
      const approvedRaw = approvals[briefId];

      return [
        {
          brief,
          candidates,
          approved: approvedRaw ? toApproved(approvedRaw) : null,
          missingBoard: candidates.length === 0,
        },
      ];
    });

    return { section, briefs: boards };
  });

  const allBriefs = sections.flatMap((section) => section.briefs);

  return {
    sections,
    decided: allBriefs.filter((entry) => entry.approved).length,
    awaiting: allBriefs.filter((entry) => !entry.approved).length,
    candidatesWaiting: allBriefs
      .filter((entry) => !entry.approved)
      .reduce((total, entry) => total + entry.candidates.length, 0),
  };
}
