import { Icon } from "@/components/ui/icons";
import { ExternalLink, Info } from "@/components/ui/icons/registry";
import type { ReviewCandidate } from "@/features/creative-review/types/review.types";
import { cn } from "@/utils";

/**
 * One candidate, presented for judgement.
 *
 * Two rules shape this card.
 *
 * The preview is cropped by CSS `object-fit: cover` inside a box set to the brief's own aspect
 * ratio — the identical mechanism the real layout will use. Judging a 3:1 banner plate as a 4:3
 * photograph is how you approve an image the layout then ruins, and a preview produced by a
 * smarter crop than the site's is a promise the site does not keep.
 *
 * Licence, resolution, source and credit sit under every frame, always, including the ones that owe
 * nothing. A licence line that appears only when there is a problem is a licence line nobody reads.
 */

export interface ReviewCandidateCardProps {
  readonly candidate: ReviewCandidate;
  readonly aspect: number;
  /** Rendered beneath the metadata — the approve control, which is stateful and client-owned. */
  readonly action: React.ReactNode;
  /** True when this frame is the one currently in production for its brief. */
  readonly isApproved?: boolean;
}

function MetaRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-[var(--color-border-subtle)] py-2">
      <dt className="shrink-0 text-[length:var(--text-caption)] uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="min-w-0 text-right text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
        {children}
      </dd>
    </div>
  );
}

export function ReviewCandidateCard({
  candidate,
  aspect,
  action,
  isApproved = false,
}: ReviewCandidateCardProps) {
  const resolution = candidate.isVector
    ? "Vector — scales without limit"
    : `${candidate.width} × ${candidate.height}`;

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-[var(--radius-xl)] border bg-[var(--color-surface)] motion-card",
        isApproved
          ? "border-[var(--color-primary)] shadow-[0_0_0_1px_var(--color-primary)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
      )}
    >
      <div className="relative isolate bg-[var(--color-surface-sunken)]" style={{ aspectRatio: aspect }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Streamed from the working tree by
            a dev-only route. next/image would try to optimise and cache a file that is deliberately
            outside public/ and changes whenever the Founder refreshes a shortlist. */}
        <img
          src={candidate.previewPath}
          alt={`Candidate ${candidate.letter} — ${candidate.title}`}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />

        <span
          className={cn(
            "absolute left-3 top-3 inline-flex size-8 items-center justify-center rounded-[var(--radius-md)] text-[length:var(--text-body-sm)] font-semibold",
            isApproved
              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              : "bg-[var(--color-glass-strong)] text-[var(--color-foreground)] backdrop-blur-[var(--glass-blur-sm)]",
          )}
        >
          {candidate.letter}
        </span>

        {isApproved && (
          <span className="absolute right-3 top-3 rounded-[var(--radius-pill)] bg-[var(--color-primary)] px-3 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary-foreground)]">
            In production
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h4 className="text-[length:var(--text-body-md)] font-semibold leading-snug text-[var(--color-foreground)]">
          {candidate.title}
        </h4>

        <dl className="mt-3 flex-1">
          <MetaRow label="Licence">
            {candidate.licenceUrl ? (
              <a
                href={candidate.licenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--color-border-strong)] underline-offset-2 hover:text-[var(--color-foreground)]"
              >
                {candidate.licence}
              </a>
            ) : (
              candidate.licence
            )}
          </MetaRow>

          <MetaRow label="Resolution">{resolution}</MetaRow>

          <MetaRow label="Credit">{candidate.author}</MetaRow>

          <MetaRow label="Source">
            {candidate.sourceUrl ? (
              <a
                href={candidate.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline decoration-[var(--color-border-strong)] underline-offset-2 hover:text-[var(--color-foreground)]"
              >
                {candidate.provider ?? "View original"}
                <Icon icon={ExternalLink} aria-hidden className="size-3.5" />
              </a>
            ) : (
              (candidate.provider ?? "Generated in-house")
            )}
          </MetaRow>
        </dl>

        {candidate.requiresAttribution ? (
          <p className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-warning-muted)] p-2.5 text-[length:var(--text-caption)] leading-relaxed text-[var(--color-foreground)]">
            <Icon icon={Info} aria-hidden className="mt-px size-3.5 shrink-0 text-[var(--color-warning)]" />
            <span>
              Attribution required. Approving this credits <strong>{candidate.author}</strong> wherever
              it appears, automatically.
            </span>
          </p>
        ) : (
          <p className="mt-3 text-[length:var(--text-caption)] text-[var(--color-muted)]">
            No attribution obligation.
          </p>
        )}

        <div className="mt-4">{action}</div>
      </div>
    </article>
  );
}
