import Image from "next/image";

import {
  addPlacementAction,
  movePlacementAction,
  removePlacementAction,
  setStoryAction,
  togglePlacementAction,
  toggleSlotAction,
} from "@/features/editorial/actions";
import { loadEditorial } from "@/services/editorial/editorial.service";
import type { EditorialPlacement, EditorialSlotWithPlacements } from "@/services/editorial/editorial.types";
import { getVehicleEngine } from "@/services/vehicle-engine";
import { toShowcaseVehicleListing } from "@/services/vehicle-engine/vehicle-projection.service";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import { cn } from "@/utils";

/**
 * The Founder Editorial Console.
 *
 * WHAT IT IS FOR
 * ==============
 * "No code changes should ever again be required to refresh the homepage." Every section of the
 * marketplace's shop window is a slot here; filling one, ordering it, writing its stories and
 * publishing it are the four things this page does.
 *
 * WHY IT LOOKS LIKE A DESK AND NOT A DASHBOARD
 * ============================================
 * It shows photographs at a size worth judging. An editorial tool whose thumbnails are 48px wide
 * cannot be used to make editorial decisions — the Founder would approve a vehicle here, open the
 * homepage, and discover the frame is a petrol station forecourt. The console renders the same card
 * the marketplace will, because the decision being made is "does this look right on the homepage",
 * and the only honest way to answer it is to look at the thing.
 *
 * WHY EVERYTHING IS DRAFT BY DEFAULT
 * ==================================
 * Adding a vehicle changes nothing a customer sees until it is published, and the same for a slot.
 * Curation is editing, and editing needs a state that is not live.
 */

export interface EditorialConsolePageProps {
  readonly className?: string;
}

export async function EditorialConsolePage({ className }: EditorialConsolePageProps) {
  const editorial = await loadEditorial({ publishedOnly: false });
  const engine = getVehicleEngine();
  const records = await engine.listPublishable().catch(() => []);
  const listings = records.map(toShowcaseVehicleListing);
  const byId = new Map(listings.map((listing) => [listing.id, listing]));

  return (
    <div className={cn("space-y-10", className)}>
      <header>
        <h1 className="text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
          Editorial console
        </h1>
        <p className="mt-2 max-w-2xl text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
          Every section of the homepage, and what is in it. Nothing here reaches a customer until it
          is published.
        </p>

        {/*
          The state of curation, stated rather than implied.
          =================================================
          A homepage showing the Founder's picks and one showing the algorithm's fallback look
          identical from the outside. If this page did not say which was live, the only way to find
          out would be to recognise the cars.
        */}
        <p
          className={cn(
            "mt-5 rounded-[var(--radius-lg)] border px-4 py-3 text-[length:var(--text-body-sm)]",
            editorial.source === "curated"
              ? "border-[var(--color-success)]/30 bg-[var(--color-success-muted)] text-[var(--color-success)]"
              : "border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
          )}
        >
          {editorial.source === "curated"
            ? "The marketplace is showing curated editorial."
            : `The marketplace is showing its automatic selection. ${editorial.reason ?? ""}`}
        </p>
      </header>

      {editorial.value.length === 0 ? (
        <p className="text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)]">
          No editorial slots could be read, so there is nothing to curate here yet.
        </p>
      ) : (
        editorial.value.map((entry) => (
          <SlotSection key={entry.slot.key} entry={entry} byId={byId} listings={listings} />
        ))
      )}
    </div>
  );
}

function SlotSection({
  entry,
  byId,
  listings,
}: {
  readonly entry: EditorialSlotWithPlacements;
  readonly byId: ReadonlyMap<string, ShowcaseVehicleListing>;
  readonly listings: readonly ShowcaseVehicleListing[];
}) {
  const { slot, placements } = entry;
  const publishedCount = placements.filter((placement) => placement.published).length;

  return (
    <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[length:var(--text-h5)] font-semibold text-[var(--color-foreground)]">
            {slot.title}
          </h2>
          {slot.description && (
            <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              {slot.description}
            </p>
          )}
          <p className="mt-2 text-[length:var(--text-caption)] text-[var(--color-muted)]">
            {publishedCount} published of {placements.length} · section{" "}
            {slot.published ? "live" : "hidden"}
          </p>
        </div>

        <form action={toggleSlotAction}>
          <input type="hidden" name="key" value={slot.key} />
          <input type="hidden" name="published" value={slot.published ? "false" : "true"} />
          <button
            type="submit"
            className="motion-button inline-flex h-10 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 text-[length:var(--text-body-sm)] font-medium hover:border-[var(--color-border-strong)]"
          >
            {slot.published ? "Hide section" : "Publish section"}
          </button>
        </form>
      </div>

      {placements.length > 0 && (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {placements.map((placement) => (
            <PlacementCard
              key={placement.id}
              placement={placement}
              listing={byId.get(placement.subjectId)}
            />
          ))}
        </ul>
      )}

      <AddPlacement slotKey={slot.key} listings={listings} chosen={placements} />
    </section>
  );
}

function PlacementCard({
  placement,
  listing,
}: {
  readonly placement: EditorialPlacement;
  readonly listing?: ShowcaseVehicleListing;
}) {
  const words = placement.story?.trim().split(/\s+/).filter(Boolean).length ?? 0;

  return (
    <li className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]">
      <div className="relative aspect-[4/3] bg-[var(--color-surface-sunken)]">
        {listing?.imageSrc ? (
          <Image
            src={listing.imageSrc}
            alt={listing.title}
            fill
            sizes="320px"
            className="object-cover"
            style={{ objectPosition: listing.imagePosition }}
          />
        ) : (
          /* A placement whose vehicle has gone, or has no photograph. Shown rather than hidden —
             see `editorial_placements_orphaned` in the migration. */
          <div className="flex size-full items-center justify-center px-4 text-center text-[length:var(--text-caption)] text-[var(--color-muted)]">
            {listing ? "No photograph" : "This vehicle is no longer on the marketplace"}
          </div>
        )}
        {!placement.published && (
          <span className="absolute left-3 top-3 rounded-[var(--radius-pill)] bg-black/70 px-2.5 py-1 text-[length:var(--text-caption)] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-md">
            Draft
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <p className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)]">
          {listing?.title ?? placement.subjectId}
        </p>
        {listing && (
          <p className="text-[length:var(--text-caption)] tabular-nums text-[var(--color-muted)]">
            {listing.price} · {listing.bodyType ?? "—"}
          </p>
        )}

        {/* Rule 7. The counter states the range and nothing enforces it: an editorial guideline that
            rejects a 39-word sentence is a validator pretending to be an editor. */}
        <form action={setStoryAction} className="space-y-2">
          <input type="hidden" name="id" value={placement.id} />
          <textarea
            name="story"
            rows={3}
            defaultValue={placement.story ?? ""}
            placeholder="Why would somebody want this car?"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-2 text-[length:var(--text-body-sm)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-focus)] focus-visible:outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "text-[length:var(--text-caption)]",
                words > 0 && (words < 40 || words > 80)
                  ? "text-[var(--color-warning)]"
                  : "text-[var(--color-muted)]",
              )}
            >
              {words} words · 40–80
            </span>
            <button
              type="submit"
              className="motion-button rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-[length:var(--text-caption)] font-medium hover:border-[var(--color-border-strong)]"
            >
              Save story
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border-subtle)] pt-3">
          <SmallForm action={movePlacementAction} id={placement.id} extra={{ direction: "up" }}>
            ↑
          </SmallForm>
          <SmallForm action={movePlacementAction} id={placement.id} extra={{ direction: "down" }}>
            ↓
          </SmallForm>
          <SmallForm
            action={togglePlacementAction}
            id={placement.id}
            extra={{ published: placement.published ? "false" : "true" }}
          >
            {placement.published ? "Unpublish" : "Publish"}
          </SmallForm>
          <SmallForm action={removePlacementAction} id={placement.id} destructive>
            Remove
          </SmallForm>
        </div>
      </div>
    </li>
  );
}

function SmallForm({
  action,
  id,
  extra,
  destructive,
  children,
}: {
  readonly action: (formData: FormData) => Promise<void>;
  readonly id: string;
  readonly extra?: Record<string, string>;
  readonly destructive?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {Object.entries(extra ?? {}).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button
        type="submit"
        className={cn(
          "motion-button rounded-[var(--radius-md)] border px-2.5 py-1 text-[length:var(--text-caption)] font-medium",
          destructive
            ? "border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:border-[var(--color-danger)]"
            : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
        )}
      >
        {children}
      </button>
    </form>
  );
}

/**
 * Adding a vehicle to a slot.
 *
 * A select rather than a search box, because the marketplace is small enough to enumerate and a
 * search box would be a second, worse search implementation. Vehicles already in this slot are not
 * offered — the unique constraint would reject them, and a control that offers an action it knows
 * will fail is the kind of thing this programme has spent four rounds removing.
 */
function AddPlacement({
  slotKey,
  listings,
  chosen,
}: {
  readonly slotKey: string;
  readonly listings: readonly ShowcaseVehicleListing[];
  readonly chosen: readonly EditorialPlacement[];
}) {
  const taken = new Set(chosen.map((placement) => placement.subjectId));
  const available = listings.filter((listing) => !taken.has(listing.id));

  if (available.length === 0) {
    return (
      <p className="mt-6 text-[length:var(--text-body-sm)] text-[var(--color-muted)]">
        Every publishable vehicle is already in this section.
      </p>
    );
  }

  return (
    <form action={addPlacementAction} className="mt-6 flex flex-wrap items-center gap-3">
      <input type="hidden" name="slotKey" value={slotKey} />
      <input type="hidden" name="subjectKind" value="vehicle" />
      <select
        name="subjectId"
        aria-label={`Add a vehicle to ${slotKey}`}
        className="h-11 min-w-[18rem] flex-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]"
      >
        {available.map((listing) => (
          <option key={listing.id} value={listing.id}>
            {listing.title} — {listing.price}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="motion-button inline-flex h-11 items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] px-5 text-[length:var(--text-body-sm)] font-medium hover:border-[var(--color-border-strong)]"
      >
        Add to section
      </button>
    </form>
  );
}
