"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { AlertCircle, BadgeCheck, Check } from "@/components/ui/icons/registry";
import { ReviewCandidateCard } from "@/features/creative-review/components/review-candidate-card";
import { approveCandidateAction } from "@/features/creative-review/server/approve-candidate";
import type {
  ApprovalResult,
  ReviewBriefBoard,
} from "@/features/creative-review/types/review.types";

/**
 * One brief's board, and the decision made on it.
 *
 * The panel is a Client Component only because an approval has a pending state worth showing —
 * promotion fetches and re-encodes a 2560px master, which is seconds, not milliseconds, and a
 * button that looks idle during that invites a second click on a different candidate. The approval
 * itself is a plain `<form>` posting to a Server Action, so it still works with no JavaScript: the
 * page simply reloads with the decision recorded.
 *
 * There is no "selected" state and no draft. A candidate is either approved or it is not, and the
 * only way to become approved is a deliberate submit — nothing here can put an image into the brand
 * as a side effect of browsing.
 */

const IDLE: ApprovalResult = { status: "idle", briefId: null, message: "" };

function SubmitButton({
  children,
  variant = "primary",
}: {
  readonly children: React.ReactNode;
  readonly variant?: "primary" | "danger";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" variant={variant} loading={pending} className="w-full">
      {pending ? "Filing…" : children}
    </Button>
  );
}

export interface ReviewBriefPanelProps {
  readonly board: ReviewBriefBoard;
}

export function ReviewBriefPanel({ board }: ReviewBriefPanelProps) {
  const [result, formAction] = useActionState(approveCandidateAction, IDLE);
  const { brief, candidates, approved, missingBoard } = board;

  /**
   * Which frame on this board is the one in production.
   *
   * Matched on source URL — the photograph's identity — never on its position, because a board is
   * rebuilt every time the brief is re-shortlisted and candidate 2 today is not candidate 2
   * tomorrow. In-house treatments have no source, so they fall back to their title.
   */
  const isInProduction = (candidate: { sourceUrl: string | null; title: string }): boolean => {
    if (!approved) return false;
    return candidate.sourceUrl && approved.sourceUrl
      ? candidate.sourceUrl === approved.sourceUrl
      : !candidate.sourceUrl && !approved.sourceUrl && candidate.title === approved.title;
  };

  return (
    <section
      id={`brief-${brief.id}`}
      className="scroll-mt-24 border-t border-[var(--color-border)] py-10 first:border-t-0"
    >
      <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <h3 className="text-[length:var(--text-h4)] font-semibold text-[var(--color-foreground)]">
              {brief.title}
            </h3>
            {approved ? (
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-success-muted)] px-2.5 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] text-[var(--color-success)]">
                <Icon icon={BadgeCheck} aria-hidden className="size-3.5" />
                Approved
              </span>
            ) : (
              <span className="inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] px-2.5 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
                Awaiting you
              </span>
            )}
          </div>

          <p className="mt-3 text-[length:var(--text-body-md)] font-medium leading-relaxed text-[var(--color-foreground)]">
            {brief.emotion}
          </p>
          <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
            {brief.direction}
          </p>
          {brief.note && (
            <p className="mt-3 border-l-2 border-[var(--color-border-strong)] pl-3 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted)]">
              {brief.note}
            </p>
          )}
        </div>

        {approved && (
          <dl className="min-w-[15rem] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[length:var(--text-body-sm)]">
            <dt className="text-[length:var(--text-caption)] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              In production
            </dt>
            <dd className="mt-1 font-medium text-[var(--color-foreground)]">{approved.title}</dd>
            <dd className="mt-2 text-[var(--color-muted-foreground)]">
              {approved.licence}
              {approved.width && approved.height ? ` · ${approved.width} × ${approved.height}` : ""}
            </dd>
            <dd className="mt-1 text-[var(--color-muted)]">Approved {approved.approvedOn}</dd>
            {approved.supersededCount > 0 && (
              <dd className="mt-1 text-[var(--color-muted)]">
                Re-decided {approved.supersededCount}
                {approved.supersededCount === 1 ? " time" : " times"}
              </dd>
            )}
            {approved.approvalNote && (
              <dd className="mt-2 italic text-[var(--color-muted-foreground)]">
                “{approved.approvalNote}”
              </dd>
            )}
          </dl>
        )}
      </header>

      {result.status !== "idle" && result.briefId === brief.id && (
        <p
          aria-live="polite"
          className={
            result.status === "approved"
              ? "mt-6 flex items-start gap-2 rounded-[var(--radius-lg)] bg-[var(--color-success-muted)] p-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]"
              : "mt-6 flex items-start gap-2 rounded-[var(--radius-lg)] bg-[var(--color-danger-muted)] p-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]"
          }
        >
          <Icon
            icon={result.status === "approved" ? Check : AlertCircle}
            aria-hidden
            className="mt-0.5 size-4 shrink-0"
          />
          <span>{result.message}</span>
        </p>
      )}

      {missingBoard ? (
        <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] p-6">
          <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            No candidates have been collected for this brief yet. Acquisition is a separate step, on
            purpose — nothing appears on this page that a person did not ask for:
          </p>
          <code className="mt-3 block overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]">
            node scripts/media/shortlist-candidates.mjs {brief.id}
          </code>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {candidates.map((candidate) => {
            const isApproved = isInProduction(candidate);

            return (
              <ReviewCandidateCard
                key={candidate.index}
                candidate={candidate}
                aspect={brief.aspect}
                isApproved={isApproved}
                action={
                  isApproved ? (
                    <p className="flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-primary)] py-2 text-[length:var(--text-body-sm)] font-medium text-[var(--color-primary-text)]">
                      <Icon icon={BadgeCheck} aria-hidden className="size-4" />
                      This is the brand
                    </p>
                  ) : approved ? (
                    /* Replacing part of a brand is a decision someone has to make on purpose, so it
                       lives behind a disclosure with a checkbox the browser will not let past. */
                    <details className="group rounded-[var(--radius-lg)] border border-[var(--color-border)]">
                      <summary className="cursor-pointer list-none px-3 py-2 text-center text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] group-open:border-b group-open:border-[var(--color-border)]">
                        Replace with {candidate.letter}…
                      </summary>
                      <form action={formAction} className="space-y-3 p-3">
                        <input type="hidden" name="briefId" value={brief.id} />
                        <input type="hidden" name="candidate" value={candidate.index} />

                        <label className="flex items-start gap-2 text-[length:var(--text-caption)] leading-relaxed text-[var(--color-muted-foreground)]">
                          <input
                            type="checkbox"
                            name="replace"
                            value="retire-approved"
                            required
                            className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]"
                          />
                          <span>
                            Retire <strong className="text-[var(--color-foreground)]">{approved.title}</strong>.
                            It stays in the manifest’s history.
                          </span>
                        </label>

                        <input
                          type="text"
                          name="note"
                          maxLength={300}
                          placeholder="Why (recorded on the record)"
                          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-interactive)] bg-[var(--color-surface-sunken)] px-2.5 py-1.5 text-[length:var(--text-body-sm)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]"
                        />

                        <SubmitButton variant="danger">Replace with {candidate.letter}</SubmitButton>
                      </form>
                    </details>
                  ) : (
                    <form action={formAction}>
                      <input type="hidden" name="briefId" value={brief.id} />
                      <input type="hidden" name="candidate" value={candidate.index} />
                      <SubmitButton>Approve {candidate.letter}</SubmitButton>
                    </form>
                  )
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
