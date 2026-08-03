import Image from "next/image";
import Link from "next/link";

import { refreshFlagsAction } from "@/features/photography-review/actions";
import {
  loadIntegrityFlags,
  loadMediaReviews,
  loadVehicleReviews,
  reviewStateOf,
  MEDIA_REVIEW_LABELS,
  type MediaReviewState,
} from "@/services/media-review";
import { getVehicleEngine } from "@/services/vehicle-engine";
import { toShowcaseVehicleListing } from "@/services/vehicle-engine/vehicle-projection.service";
import { cn } from "@/utils";

/**
 * The review queue — vehicles, not photographs.
 *
 * WHY THE UNIT CHANGED
 * ====================
 * This page used to list frames and ask "is this good", which is the wrong question twice. A
 * photograph is not good or bad in the abstract: it is right or wrong for the car it is selling, and
 * "is this a fair picture of a R2.8m GT3" cannot be answered without knowing that is what it is. And
 * one size cannot answer it either, because the risk the Founder named is precisely that a frame
 * survives at full size and falls apart as a search card.
 *
 * So this is now a queue of vehicles and the judgement happens in the workspace, where the car's
 * price, mileage and dealership sit above every frame it has, each rendered at the four sizes the
 * marketplace will actually produce.
 *
 * WHAT THE QUEUE SORTS BY
 * =======================
 * Unreviewed first, then flagged, then the rest. Within that, the most expensive vehicles lead:
 * approving one photograph of a two-million-rand car does more for the shop window than approving
 * six of a hatchback, and a queue of two hundred needs to put the valuable decisions first.
 */

const STATE_DOT: Readonly<Record<MediaReviewState, string>> = {
  approved_homepage: "bg-[var(--color-success)]",
  approved_search: "bg-[var(--color-muted)]",
  rejected: "bg-[var(--color-danger)]",
  needs_review: "bg-[var(--color-warning)]",
};

export async function PhotographyReviewPage() {
  const [reviews, flags, vehicleReviews] = await Promise.all([
    loadMediaReviews(),
    loadIntegrityFlags(),
    loadVehicleReviews(),
  ]);

  const engine = getVehicleEngine();
  const records = await engine.listPublishable().catch(() => []);

  const flagged = new Set(flags.map((flag) => flag.photograph));

  const rows = records
    .map((record) => {
      const listing = toShowcaseVehicleListing(record);
      const photographs = record.media.photos
        .map((photo) => (photo.url ?? "").trim())
        .filter(Boolean)
        .filter((url, index, all) => all.indexOf(url) === index);

      const states = photographs.map((url) => reviewStateOf(reviews, url));

      return {
        id: record.id,
        listing,
        photographs,
        states,
        priceCents: record.pricing.sellingPriceCents,
        reviewed: vehicleReviews.get(record.id) ?? null,
        approved: states.filter((state) => state === "approved_homepage").length,
        unreviewed: states.filter((state) => state === "needs_review").length,
        flags: photographs.filter((url) => flagged.has(url)).length,
      };
    })
    .sort((a, b) => {
      const rank = (row: typeof a) => (row.reviewed ? 2 : row.flags > 0 ? 0 : 1);
      return rank(a) - rank(b) || b.priceCents - a.priceCents;
    });

  const approvedPhotographs = [...reviews.all.values()].filter(
    (review) => review.state === "approved_homepage",
  ).length;
  const awaiting = rows.filter((row) => !row.reviewed).length;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
          Photography review
        </h1>
        <p className="mt-2 max-w-3xl text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
          The homepage shows only photographs approved here. Open a vehicle to see every frame it has,
          rendered at the four sizes the marketplace will actually produce — a photograph that reads
          well at full size can be unusable as a search card.
        </p>

        <dl className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
          {(
            [
              ["Vehicles awaiting review", awaiting],
              ["Photographs on the homepage", approvedPhotographs],
              ["Open integrity flags", flags.length],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-[length:var(--text-caption)] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                {label}
              </dt>
              <dd className="mt-1 text-[length:var(--text-h3)] font-semibold tabular-nums text-[var(--color-foreground)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {approvedPhotographs === 0 && (
          <p className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-4 py-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]">
            Nothing is approved, so the homepage shows no vehicles. That is the intended state until
            you dress the showroom — approve one frame and the rails appear within a minute.
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

      <ul className="grid grid-cols-1 gap-4">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/operations/photography/${row.id}`}
              className="motion-card flex flex-wrap items-center gap-5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            >
              {/* A vehicle whose every exterior was rejected has no lead frame, and that is a state
                  worth reading rather than an empty grey box. */}
              <div className="relative flex aspect-[3/2] w-40 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-center">
                {row.listing.imageSrc ? (
                  <Image
                    src={row.listing.imageSrc}
                    alt=""
                    fill
                    sizes="160px"
                    style={{ objectPosition: row.listing.imagePosition }}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-[length:var(--text-caption)] leading-snug text-[var(--color-muted)]">
                    No usable photograph
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[length:var(--text-body-lg)] font-semibold text-[var(--color-foreground)]">
                  {row.listing.title}
                </p>
                <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {row.listing.price} · {row.listing.dealer}
                </p>

                {/* One dot per photograph, coloured by its state — the whole vehicle at a glance. */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex gap-1.5" aria-hidden>
                    {row.states.map((state, index) => (
                      <span
                        key={index}
                        className={cn("block size-2.5 rounded-full", STATE_DOT[state])}
                      />
                    ))}
                  </span>
                  <span className="text-[length:var(--text-caption)] text-[var(--color-muted)]">
                    {row.photographs.length} {row.photographs.length === 1 ? "photograph" : "photographs"}
                    {row.approved > 0 ? `, ${row.approved} on the homepage` : ""}
                    {row.unreviewed > 0 ? `, ${row.unreviewed} unreviewed` : ""}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                {row.flags > 0 && (
                  <span className="rounded-[var(--radius-pill)] bg-[var(--color-warning)]/15 px-3 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] text-[var(--color-warning)]">
                    {row.flags} flagged
                  </span>
                )}
                <span className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {row.reviewed ? "Reviewed" : MEDIA_REVIEW_LABELS.needs_review}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
