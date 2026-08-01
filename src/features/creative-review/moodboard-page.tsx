import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { ArrowRight, BadgeCheck, Info, Palette } from "@/components/ui/icons/registry";
import { readMoodboard, type MoodboardSlot } from "@/features/creative-review/server/moodboard";
import { cn } from "@/utils";

/**
 * The brand moodboard.
 *
 * One screen, every photograph the product leads with, at the ratio it is actually used at. The
 * review dashboard is for choosing between candidates; this is for noticing that the SUV tile is a
 * bright afternoon while everything around it is dusk — a fault that is invisible when you review one
 * brief at a time, and obvious here.
 *
 * Provenance is stated on every tile rather than implied. A slot showing a stand-in is not a failure,
 * but it is not a decision either, and a board that let the two look alike would be flattering itself.
 */

const PROVENANCE = {
  approved: {
    label: "Approved",
    className: "bg-[var(--color-success-muted)] text-[var(--color-success)]",
  },
  inherited: {
    label: "Inherited",
    className: "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
  },
  empty: {
    label: "Not chosen",
    className: "border border-[var(--color-border-strong)] text-[var(--color-muted-foreground)]",
  },
} as const;

function Swatches({
  palette,
  className,
}: {
  readonly palette: readonly { hex: string; share: number }[];
  readonly className?: string;
}) {
  if (palette.length === 0) return null;

  return (
    <div className={cn("flex h-1.5 w-full overflow-hidden rounded-[var(--radius-pill)]", className)}>
      {palette.map((entry) => (
        <span
          key={entry.hex}
          title={`${entry.hex} — ${entry.share}%`}
          style={{ backgroundColor: entry.hex, width: `${entry.share}%` }}
        />
      ))}
    </div>
  );
}

function SlotTile({ slot }: { readonly slot: MoodboardSlot }) {
  const provenance = PROVENANCE[slot.provenance];

  return (
    <figure
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-xl)] border bg-[var(--color-surface)]",
        slot.provenance === "approved"
          ? "border-[var(--color-border)]"
          : "border-dashed border-[var(--color-border-strong)]",
        slot.emphasis === "lead" && "sm:col-span-2 lg:col-span-4",
        slot.emphasis === "wide" && "sm:col-span-2",
      )}
    >
      <div className="relative bg-[var(--color-surface-sunken)]" style={{ aspectRatio: slot.aspect }}>
        {slot.src ? (
          <Image
            src={slot.src}
            alt=""
            fill
            sizes={slot.emphasis === "standard" ? "(max-width: 640px) 100vw, 33vw" : "100vw"}
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center p-6 text-center">
            <p className="text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted)]">
              Nothing stands in for this.
              <br />
              It is blank until you choose.
            </p>
          </div>
        )}

        <span
          className={cn(
            "absolute left-3 top-3 rounded-[var(--radius-pill)] px-2.5 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] backdrop-blur-[var(--glass-blur-sm)]",
            provenance.className,
          )}
        >
          {provenance.label}
        </span>
      </div>

      <figcaption className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[length:var(--text-body-md)] font-semibold text-[var(--color-foreground)]">
            {slot.label}
          </h3>
          <Link
            href={`/admin/creative/media-review#brief-${slot.mediaId}`}
            className="shrink-0 text-[length:var(--text-caption)] uppercase tracking-[0.14em] text-[var(--color-primary-text)] hover:underline"
          >
            Review
          </Link>
        </div>

        <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          {slot.role}
        </p>

        {slot.provenance === "approved" ? (
          <>
            <Swatches palette={slot.palette} className="mt-3" />
            <p className="mt-2 truncate text-[length:var(--text-caption)] text-[var(--color-muted)]">
              {slot.title}
              {slot.author ? ` · ${slot.author}` : ""}
            </p>
          </>
        ) : (
          <p className="mt-3 text-[length:var(--text-caption)] leading-relaxed text-[var(--color-muted)]">
            {slot.provenance === "inherited"
              ? "Standing in. Nobody chose this frame."
              : "Awaiting a decision."}
          </p>
        )}
      </figcaption>
    </figure>
  );
}

function Stat({ value, label }: { readonly value: number; readonly label: string }) {
  return (
    <div>
      <p className="text-[length:var(--text-h2)] font-semibold tabular-nums text-[var(--color-foreground)]">
        {value}
      </p>
      <p className="mt-1 text-[length:var(--text-caption)] uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {label}
      </p>
    </div>
  );
}

export function MoodboardPage() {
  const board = readMoodboard();
  const decided = board.approved > 0;

  return (
    <div className="mx-auto w-full max-w-[var(--container-2xl)] px-6 py-10 sm:px-8 lg:px-10">
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary-text)]">
          <Icon icon={Palette} aria-hidden className="size-4" />
          Creative direction
        </p>
        <h1 className="mt-3 text-[length:var(--text-h1)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
          Brand moodboard
        </h1>
        <p className="mt-4 text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
          Every photograph the product leads with, at the size and shape it is really used at. The
          review board asks whether a frame is the best of five. This asks the harder question — do
          these belong to the same company?
        </p>
        <p className="mt-3 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted)]">
          Look for the odd one out before you look at any of them closely. A single daylight frame
          among evening ones, or one photograph noticeably sharper or cheaper than its neighbours, is
          what makes a collection read as stock — and it is invisible one brief at a time.
        </p>
      </header>

      <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6 border-y border-[var(--color-border)] py-6">
        <Stat value={board.approved} label="Approved" />
        <Stat value={board.inherited} label="Inherited" />
        <Stat value={board.empty} label="Not chosen" />

        <div className="min-w-[16rem] flex-1">
          <p className="text-[length:var(--text-caption)] uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Colour across the approved set
          </p>
          {decided && board.palette.length > 0 ? (
            <>
              <Swatches palette={board.palette} className="mt-3 h-3" />
              <p className="mt-2 text-[length:var(--text-caption)] text-[var(--color-muted)]">
                Weighted by how much of each frame the colour covers, not by how much it stands out.
              </p>
            </>
          ) : (
            <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              Nothing approved yet, so there is no brand colour to read.
            </p>
          )}
        </div>
      </div>

      {!decided && (
        <p className="mt-8 flex items-start gap-3 rounded-[var(--radius-lg)] bg-[var(--color-warning-muted)] p-4 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-foreground)]">
          <Icon icon={Info} aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--color-warning)]" />
          <span>
            Nothing on this board has been chosen yet. Everything shown is standing in, and the tiles
            marked <strong>Not chosen</strong> have nothing honest to stand in for them at all. This is
            the truthful state of the brand today.{" "}
            <Link
              href="/admin/creative/media-review"
              className="underline decoration-[var(--color-border-strong)] underline-offset-2 hover:text-[var(--color-foreground)]"
            >
              Go and choose
            </Link>
            .
          </span>
        </p>
      )}

      {board.groups.map((group) => (
        <section key={group.id} className="mt-14">
          <div className="max-w-3xl">
            <h2 className="text-[length:var(--text-h3)] font-semibold tracking-[-0.015em] text-[var(--color-foreground)]">
              {group.label}
            </h2>
            <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
              {group.note}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {group.slots.map((slot) => (
              <SlotTile key={slot.mediaId} slot={slot} />
            ))}
          </div>
        </section>
      ))}

      <footer className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--color-border)] pt-8">
        <p className="max-w-xl text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
          {board.attributions > 0 ? (
            <>
              <Icon icon={BadgeCheck} aria-hidden className="mr-1.5 inline size-4 align-[-2px]" />
              {board.attributions} approved{" "}
              {board.attributions === 1 ? "photograph carries" : "photographs carry"} a credit
              obligation, rendered from the same manifest as the image so it cannot drift out of sync.
            </>
          ) : (
            "Credits are rendered from the same manifest as the images, so they cannot drift out of sync with what is on screen."
          )}
        </p>

        <Link
          href="/admin/creative/media-review"
          className="motion-button group inline-flex items-center gap-2 border-b border-[var(--color-primary)] pb-1 text-[length:var(--text-body-md)] font-medium text-[var(--color-foreground)] hover:border-[var(--color-primary-glow)]"
        >
          Open the review board
          <Icon
            icon={ArrowRight}
            aria-hidden
            className="size-4 text-[var(--color-primary-text)] transition-transform motion-hover group-hover:translate-x-1"
          />
        </Link>
      </footer>
    </div>
  );
}
