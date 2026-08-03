import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/ui/icons";
import { ArrowRight } from "@/components/ui/icons/registry";
import { saveVehicleReviewAction } from "@/features/photography-review/actions";
import { PhotographPreviews } from "@/features/photography-review/photograph-previews";
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
 * The Founder approval workspace — one vehicle, every photograph, judged as it will appear.
 *
 * WHY THIS REPLACED A GRID OF PHOTOGRAPHS
 * =======================================
 * The first version listed frames and asked "is this good". That is the wrong unit twice over. It
 * gave no context — a photograph is not good or bad in the abstract, it is right or wrong for the
 * car it is selling, and "is this a fair picture of a R2.8m 911 GT3" is a different question from
 * "is this a nice photograph". And it showed each frame once, at one size, when the whole risk is
 * that a frame survives at full size and falls apart as a search card.
 *
 * So the unit is the vehicle: what it is, what it costs, who is selling it, and then every
 * photograph it has with the four renderings the marketplace will actually produce.
 *
 * ONE FRAME, MANY LISTINGS — SAID OUT LOUD
 * ========================================
 * The demonstration library keys one photograph per model, so approving a frame here approves it for
 * every listing that shares it. That is a genuinely surprising consequence of a per-vehicle screen
 * and it is stated on each photograph rather than left to be discovered: a Founder who approves a
 * frame for a R2.8m car should know it will also lead a R400 000 one.
 *
 * WHY ONE SUBMIT AND NOT EIGHT BUTTONS
 * ====================================
 * A review is a sitting, not eight independent clicks. The states are radios and the note is a
 * field, and `Save review` records all of it at once — which also means the note is attached to the
 * decisions it explains rather than to whichever one happened to be pressed last.
 */

export interface VehicleReviewWorkspaceProps {
  readonly vehicleId: string;
}

const STATE_CHOICES: readonly { readonly value: MediaReviewState; readonly tone: string }[] = [
  { value: "approved_homepage", tone: "peer-checked:border-[var(--color-success)] peer-checked:bg-[var(--color-success)]/15 peer-checked:text-[var(--color-success)]" },
  { value: "approved_search", tone: "peer-checked:border-[var(--color-border-strong)] peer-checked:bg-[var(--color-hover)] peer-checked:text-[var(--color-foreground)]" },
  { value: "rejected", tone: "peer-checked:border-[var(--color-danger)] peer-checked:bg-[var(--color-danger)]/15 peer-checked:text-[var(--color-danger)]" },
  { value: "needs_review", tone: "peer-checked:border-[var(--color-warning)] peer-checked:bg-[var(--color-warning)]/15 peer-checked:text-[var(--color-warning)]" },
];

export async function VehicleReviewWorkspace({ vehicleId }: VehicleReviewWorkspaceProps) {
  const engine = getVehicleEngine();
  const records = await engine.listPublishable().catch(() => []);
  const record = records.find((entry) => entry.id === vehicleId || entry.slug === vehicleId);
  if (!record) notFound();

  const [reviews, flags, vehicleReviews] = await Promise.all([
    loadMediaReviews(),
    loadIntegrityFlags(),
    loadVehicleReviews(),
  ]);

  const listing = toShowcaseVehicleListing(record);
  const existing = vehicleReviews.get(record.id);

  /*
    Every photograph the vehicle has, not only the one currently leading. A frame that was skipped
    because an earlier one was chosen is exactly the frame a review should surface — the two
    competition cars found on the launch walk were both a vehicle's *third* photograph.
  */
  const photographs = record.media.photos
    .map((photo) => (photo.url ?? "").trim())
    .filter(Boolean)
    .filter((url, index, all) => all.indexOf(url) === index);

  /* How many other listings each frame leads, so the blast radius of an approval is visible. */
  const usageByPhotograph = new Map<string, number>();
  for (const other of records) {
    for (const photo of other.media.photos) {
      const url = (photo.url ?? "").trim();
      if (!url) continue;
      usageByPhotograph.set(url, (usageByPhotograph.get(url) ?? 0) + 1);
    }
  }

  const flagsFor = (photograph: string) => flags.filter((flag) => flag.photograph === photograph);

  const detail = [
    { label: "Dealer", value: record.dealer.dealershipName },
    { label: "Price", value: record.pricing.sellingPriceDisplay },
    { label: "Mileage", value: record.core.mileageDisplay },
    { label: "Year", value: String(record.core.year) },
  ];

  return (
    <div className="space-y-10">
      <header>
        <Link
          href="/operations/photography"
          className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted-foreground)] underline underline-offset-4 hover:text-[var(--color-foreground)]"
        >
          All vehicles awaiting review
        </Link>

        <h1 className="mt-4 text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
          {listing.title}
        </h1>

        <dl className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
          {detail.map((item) => (
            <div key={item.label}>
              <dt className="text-[length:var(--text-caption)] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                {item.label}
              </dt>
              <dd className="mt-1 text-[length:var(--text-body-lg)] font-semibold text-[var(--color-foreground)]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <Link
          href={`/vehicle/${listing.slug}`}
          className="motion-button group mt-6 inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-1 text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)] hover:border-[var(--color-foreground)]"
        >
          Open the live listing
          <Icon icon={ArrowRight} aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>

        {existing && (
          <p className="mt-4 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Last reviewed {new Date(existing.reviewedAt).toLocaleDateString("en-ZA")}.
          </p>
        )}
      </header>

      <form action={saveVehicleReviewAction} className="space-y-12">
        <input type="hidden" name="vehicleId" value={record.id} />

        {photographs.map((photograph, index) => {
          const state = reviewStateOf(reviews, photograph);
          const sharedWith = (usageByPhotograph.get(photograph) ?? 1) - 1;
          const photographFlags = flagsFor(photograph);

          return (
            <section
              key={photograph}
              className="space-y-6 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-[length:var(--text-h4)] font-semibold text-[var(--color-foreground)]">
                    Photograph {index + 1} of {photographs.length}
                  </h3>
                  <p className="mt-1 font-mono text-[length:var(--text-caption)] text-[var(--color-muted)]">
                    {photograph.replace("/images/vehicles/library/", "")}
                  </p>
                  {sharedWith > 0 && (
                    /* The blast radius, stated. Approving here approves it everywhere. */
                    <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-warning)]">
                      Shared with {sharedWith} other {sharedWith === 1 ? "listing" : "listings"} — a decision
                      here applies to all of them.
                    </p>
                  )}
                </div>

                <fieldset className="flex flex-wrap gap-2">
                  <legend className="sr-only">
                    Decision for photograph {index + 1}
                  </legend>
                  {STATE_CHOICES.map((choice) => (
                    <label key={choice.value} className="relative">
                      <input
                        type="radio"
                        name={`state:${photograph}`}
                        value={choice.value}
                        defaultChecked={state === choice.value}
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          "motion-button inline-flex min-h-11 cursor-pointer items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-hover)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-focus-ring)]",
                          choice.tone,
                        )}
                      >
                        {MEDIA_REVIEW_LABELS[choice.value]}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>

              {photographFlags.length > 0 && (
                <ul className="space-y-2">
                  {photographFlags.map((flag) => (
                    <li
                      key={flag.id}
                      className="rounded-[var(--radius-lg)] border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-3 py-2 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]"
                    >
                      {flag.detail}
                    </li>
                  ))}
                </ul>
              )}

              {/* The point of the whole screen. */}
              <PhotographPreviews listing={listing} photograph={photograph} />
            </section>
          );
        })}

        <section className="space-y-4 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <label
            htmlFor="founder-note"
            className="block text-[length:var(--text-h4)] font-semibold text-[var(--color-foreground)]"
          >
            Founder notes
          </label>
          <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            About the vehicle rather than any one frame — what to ask the dealership for, or why none of
            these will do.
          </p>
          <textarea
            id="founder-note"
            name="note"
            rows={4}
            defaultValue={existing?.note ?? ""}
            className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]"
            placeholder="Every frame is the pre-facelift car. Ask Cape Prestige for their own set."
          />

          <button
            type="submit"
            className="motion-button inline-flex min-h-12 items-center rounded-[var(--radius-lg)] bg-[var(--color-foreground)] px-7 text-[length:var(--text-button)] font-semibold text-[var(--color-background)] transition-opacity hover:opacity-90"
          >
            Save review
          </button>
        </section>
      </form>
    </div>
  );
}
