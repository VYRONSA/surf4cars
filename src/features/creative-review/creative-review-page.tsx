import { Icon } from "@/components/ui/icons";
import { Image as ImageIcon, Lock, Palette } from "@/components/ui/icons/registry";
import { ReviewBriefPanel } from "@/features/creative-review/components/review-brief-panel";
import { readCreativeReviewBoard } from "@/features/creative-review/server/review-board";
import type { LibrarySourcing, ReviewSectionBoard } from "@/features/creative-review/types/review.types";

/**
 * The Founder's creative review board.
 *
 * This page exists because image selection was an engineering problem for too long, and engineering
 * chose a shopfront to represent SUVs. No heuristic was going to fix that: whether a frame makes
 * someone want to drive somewhere is not a property a script can measure. So the software collects,
 * checks licences, and presents — and stops there.
 *
 * Nothing on this page is ranked. Candidates appear in the order they were found, because an implied
 * "best" is still the software choosing.
 */

const SOURCING_BADGE: Record<LibrarySourcing, { readonly label: string; readonly detail: string }> = {
  curated: {
    label: "Curated",
    detail: "You choose. Approval is the only way in.",
  },
  composed: {
    label: "Composed",
    detail: "You approve the photographic plate. SURF typography is laid over it at render time.",
  },
  uploaded: {
    label: "Uploaded",
    detail: "Supplied by whoever owns it. Nothing to review, and nothing that may be substituted.",
  },
};

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

/**
 * A section nothing can be approved into.
 *
 * Rendering these rather than hiding them is the point: the most common way a brand gets a stock
 * photograph where a real one belongs is that nobody wrote down why the slot was empty.
 */
function UploadedSectionNote({ board }: { readonly board: ReviewSectionBoard }) {
  return (
    <div className="mt-6 flex gap-4 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)] p-6">
      <Icon icon={Lock} aria-hidden className="mt-0.5 size-5 shrink-0 text-[var(--color-muted)]" />
      <div>
        <p className="text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
          {SOURCING_BADGE.uploaded.detail}
        </p>
        <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted)]">
          {board.section.purpose}
        </p>
      </div>
    </div>
  );
}

export function CreativeReviewPage() {
  const board = readCreativeReviewBoard();

  return (
    <div className="mx-auto w-full max-w-[var(--container-2xl)] px-6 py-10 sm:px-8 lg:px-10">
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary-text)]">
          <Icon icon={Palette} aria-hidden className="size-4" />
          Creative direction
        </p>
        <h1 className="mt-3 text-[length:var(--text-h1)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]">
          Media review
        </h1>
        <p className="mt-4 text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
          Brands are curated. Every photograph below has cleared licence, resolution and subject
          checks — the three things a script can genuinely judge. The remaining question is the only
          one that matters, and it is yours.
        </p>

        <blockquote className="mt-6 border-l-2 border-[var(--color-primary)] pl-4">
          <p className="text-[length:var(--text-body-md)] font-medium leading-relaxed text-[var(--color-foreground)]">
            Would Porsche use this? Would BMW publish it? Would Apple approve it?
          </p>
          <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            If the answer is no, do not approve it. Given a technically correct photograph and an
            emotionally compelling one, take the emotionally compelling one.
          </p>
        </blockquote>
      </header>

      <div className="mt-10 flex flex-wrap gap-x-12 gap-y-6 border-y border-[var(--color-border)] py-6">
        <Stat value={board.decided} label="Decided" />
        <Stat value={board.awaiting} label="Awaiting you" />
        <Stat value={board.candidatesWaiting} label="Candidates to judge" />
      </div>

      {board.sections.map((sectionBoard) => {
        const { section, briefs } = sectionBoard;
        const badge = SOURCING_BADGE[section.sourcing];

        return (
          <section key={section.id} id={`section-${section.id}`} className="mt-16 scroll-mt-24">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h2 className="text-[length:var(--text-h3)] font-semibold tracking-[-0.015em] text-[var(--color-foreground)]">
                {section.label}
              </h2>
              <span className="rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] px-2.5 py-0.5 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
                {badge.label}
              </span>
              <code className="text-[length:var(--text-body-sm)] text-[var(--color-muted)]">
                /media/premium/{section.id}/
              </code>
            </div>
            <p className="mt-2 max-w-3xl text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
              {section.purpose}
            </p>

            {briefs.length === 0 ? (
              <UploadedSectionNote board={sectionBoard} />
            ) : (
              <div className="mt-2">
                {briefs.map((briefBoard) => (
                  <ReviewBriefPanel key={briefBoard.brief.id} board={briefBoard} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <footer className="mt-20 flex gap-4 border-t border-[var(--color-border)] pt-8">
        <Icon icon={ImageIcon} aria-hidden className="mt-0.5 size-5 shrink-0 text-[var(--color-muted)]" />
        <div className="max-w-3xl text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
          <p>
            An approval downloads the master, files it in{" "}
            <code className="text-[var(--color-foreground)]">public/media/premium/</code>, and records
            the licence, credit and date in the manifest the site renders from. The image on the
            homepage changes with no code change, and the credit can never drift out of sync with the
            photograph it belongs to.
          </p>
          <p className="mt-2">
            Reviewing is local work: this page writes to the working tree, so it does not exist in
            production. Commit the library and the manifest to ship a decision.
          </p>
        </div>
      </footer>
    </div>
  );
}
