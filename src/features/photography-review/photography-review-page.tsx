import Image from "next/image";

import {
  dismissFlagAction,
  refreshFlagsAction,
  setReviewStateAction,
} from "@/features/photography-review/actions";
import {
  loadIntegrityFlags,
  loadMediaReviews,
  reviewStateOf,
  MEDIA_REVIEW_LABELS,
  type MediaIntegrityFlag,
  type MediaReviewState,
} from "@/services/media-review";
import { getVehicleEngine } from "@/services/vehicle-engine";
import { toShowcaseVehicleListing } from "@/services/vehicle-engine/vehicle-projection.service";
import { cn } from "@/utils";

/**
 * The Founder's photography review.
 *
 * WHY THIS PAGE EXISTS
 * ====================
 * Until now a photograph reached the homepage by not being on a denylist. That approves by default,
 * which means the shop window changed whenever inventory did — and across two sprints, twenty of the
 * twenty-four frames promoted that way turned out to be motor show stands, forecourts, foreign
 * streets or, twice, vehicles nobody could buy. The Founder's instruction is to stop relying on "not
 * rejected". This is where the affirmative decision is made.
 *
 * WHY IT SHOWS THE PHOTOGRAPH LARGE
 * =================================
 * The same reason the editorial console does: a review tool with 48px thumbnails cannot be used to
 * make the judgement it exists for. Every fault in the list above is invisible at thumbnail size and
 * obvious at card size — a display board where a number plate should be, a dealership's branding on
 * the car behind, a light bar on the roof.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * ================================
 * It does not generate photographs, retouch them, or score them. The brief is explicit and the
 * codebase has the receipt: the media scorer rated a brick-shopfront frame 78 out of 100, because
 * measuring pixels cannot tell you the car is a grey smudge in front of a signboard.
 */

const STATE_STYLES: Readonly<Record<MediaReviewState, string>> = {
  approved_homepage: "border-[var(--color-success)]/50 bg-[var(--color-success)]/10 text-[var(--color-success)]",
  approved_search: "border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-foreground)]",
  rejected: "border-[var(--color-danger)]/50 bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  needs_review: "border-[var(--color-warning)]/50 bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
};

const FLAG_LABELS: Readonly<Record<MediaIntegrityFlag["rule"], string>> = {
  "model-mismatch": "Different model",
  "body-style-conflict": "Two body styles",
  "derivative-conflict": "Performance model shares this frame",
};

export async function PhotographyReviewPage() {
  const [reviews, flags] = await Promise.all([loadMediaReviews(), loadIntegrityFlags()]);

  const engine = getVehicleEngine();
  const records = await engine.listPublishable().catch(() => []);
  const listings = records.map(toShowcaseVehicleListing).filter((listing) => Boolean(listing.imageSrc));

  /*
    One row per photograph, not per vehicle. The library keys a frame per model, so a hundred and
    sixteen SUVs share a couple of dozen photographs — reviewing per listing would ask the same
    question two hundred times and make the queue look impossible.
  */
  const byPhotograph = new Map<string, { readonly titles: string[]; readonly position: string }>();
  for (const listing of listings) {
    const entry = byPhotograph.get(listing.imageSrc);
    if (entry) entry.titles.push(listing.title);
    else byPhotograph.set(listing.imageSrc, { titles: [listing.title], position: listing.imagePosition });
  }

  const flagsByPhotograph = new Map<string, MediaIntegrityFlag[]>();
  for (const flag of flags) {
    flagsByPhotograph.set(flag.photograph, [...(flagsByPhotograph.get(flag.photograph) ?? []), flag]);
  }

  const rows = [...byPhotograph.entries()]
    .map(([photograph, entry]) => ({
      photograph,
      titles: entry.titles,
      position: entry.position,
      state: reviewStateOf(reviews, photograph),
      note: reviews.all.get(photograph)?.note ?? null,
      flags: flagsByPhotograph.get(photograph) ?? [],
    }))
    /* Unreviewed first — the queue is the point of the page — then flagged, then the rest. */
    .sort((a, b) => {
      const rank = (row: typeof a) =>
        row.state === "needs_review" ? 0 : row.flags.length > 0 ? 1 : row.state === "approved_homepage" ? 2 : 3;
      return rank(a) - rank(b) || b.titles.length - a.titles.length || a.photograph.localeCompare(b.photograph);
    });

  const counts = rows.reduce<Record<string, number>>((totals, row) => {
    totals[row.state] = (totals[row.state] ?? 0) + 1;
    return totals;
  }, {});

  const onHomepage = counts.approved_homepage ?? 0;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
          Photography review
        </h1>
        <p className="mt-2 max-w-3xl text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
          Every photograph currently leading a listing. The premium homepage rails show only what is
          approved here — nothing reaches the front page by default, and new stock cannot change the
          shop window on its own.
        </p>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
          {(
            [
              ["approved_homepage", onHomepage],
              ["needs_review", counts.needs_review ?? 0],
              ["approved_search", counts.approved_search ?? 0],
              ["rejected", counts.rejected ?? 0],
            ] as const
          ).map(([state, value]) => (
            <div key={state}>
              <dt className="text-[length:var(--text-caption)] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                {MEDIA_REVIEW_LABELS[state]}
              </dt>
              <dd className="mt-1 text-[length:var(--text-h3)] font-semibold tabular-nums text-[var(--color-foreground)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {onHomepage === 0 && (
          <p className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-4 py-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]">
            Nothing is approved for the homepage, so the premium rails are empty. That is the intended
            state until you dress the showroom — approve a photograph below and it appears within a
            minute.
          </p>
        )}

        <form action={refreshFlagsAction} className="mt-6">
          <button
            type="submit"
            className="motion-button inline-flex min-h-11 items-center rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] px-5 text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)] hover:bg-[var(--color-hover)]"
          >
            Re-run integrity checks
          </button>
        </form>
      </header>

      <ul className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {rows.map((row) => (
          <li
            key={row.photograph}
            className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            {/* Large enough to judge. Every fault this page exists to catch is invisible smaller. */}
            <div className="relative aspect-[16/10] w-full bg-[var(--color-background)]">
              <Image
                src={row.photograph}
                alt=""
                fill
                sizes="(max-width: 1280px) 100vw, 50vw"
                style={{ objectPosition: row.position }}
                className="object-cover"
              />
              <span
                className={cn(
                  "absolute left-4 top-4 rounded-[var(--radius-pill)] border px-3 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] backdrop-blur-[var(--glass-blur-sm)]",
                  STATE_STYLES[row.state],
                )}
              >
                {MEDIA_REVIEW_LABELS[row.state]}
              </span>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <p className="font-mono text-[length:var(--text-caption)] text-[var(--color-muted)]">
                  {row.photograph.replace("/images/vehicles/library/", "")}
                </p>
                <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]">
                  Leads {row.titles.length} {row.titles.length === 1 ? "listing" : "listings"}
                  {row.titles.length > 0 ? `, including ${row.titles[0]}` : ""}.
                </p>
              </div>

              {/* Machine-found disagreements. A flag is information, never a decision. */}
              {row.flags.length > 0 && (
                <ul className="space-y-2">
                  {row.flags.map((flag) => (
                    <li
                      key={flag.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-3 py-2"
                    >
                      <span className="text-[length:var(--text-body-sm)] text-[var(--color-foreground)]">
                        <strong className="font-semibold">{FLAG_LABELS[flag.rule]}.</strong> {flag.detail}
                      </span>
                      <form action={dismissFlagAction}>
                        <input type="hidden" name="id" value={flag.id} />
                        <button
                          type="submit"
                          className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted-foreground)] underline underline-offset-4 hover:text-[var(--color-foreground)]"
                        >
                          Dismiss
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              {row.note && (
                <p className="text-[length:var(--text-body-sm)] italic leading-relaxed text-[var(--color-muted-foreground)]">
                  “{row.note}”
                </p>
              )}

              <form action={setReviewStateAction} className="space-y-3">
                <input type="hidden" name="photograph" value={row.photograph} />
                <input
                  type="text"
                  name="note"
                  defaultValue={row.note ?? ""}
                  placeholder="Why — in your words"
                  className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[length:var(--text-body-sm)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]"
                />
                <div className="flex flex-wrap gap-2">
                  {(
                    ["approved_homepage", "approved_search", "rejected", "needs_review"] as const
                  ).map((state) => (
                    <button
                      key={state}
                      type="submit"
                      name="state"
                      value={state}
                      disabled={row.state === state}
                      className={cn(
                        "motion-button inline-flex min-h-11 items-center rounded-[var(--radius-lg)] border px-4 text-[length:var(--text-body-sm)] font-medium transition-colors",
                        row.state === state
                          ? "cursor-default border-[var(--color-border)] text-[var(--color-muted)]"
                          : "border-[var(--color-border-strong)] text-[var(--color-foreground)] hover:bg-[var(--color-hover)]",
                      )}
                    >
                      {MEDIA_REVIEW_LABELS[state]}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
