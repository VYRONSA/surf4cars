import type { ReactNode } from "react";

import { cn } from "@/utils";

/**
 * The frame every legal page sits in.
 *
 * A privacy policy is not a place to be clever, but it is a place to be readable. These pages exist
 * because the platform collects personal information, and a policy nobody can get through is a
 * disclosure in name only — so the measure is 68 characters, the headings are plain, and there is no
 * decoration competing with the text.
 *
 * FOUNDER REVIEW MARKERS ARE VISIBLE, DELIBERATELY
 * ================================================
 * Sections that need a real company registration number, a physical address or a lawyer's eye render
 * an amber note *on the page*, not a code comment. A placeholder that only a developer can see is
 * exactly how "4200000273" ends up published as a VAT number — this codebase has a whole section of
 * AGENTS.md about that. If it is unresolved, the reader should be able to tell.
 *
 * Remove `<LegalReview>` as each item is settled. When none remain, the page is publishable.
 */

export interface LegalPageProps {
  readonly title: string;
  readonly updated: string;
  readonly intro: string;
  readonly children: ReactNode;
}

export function LegalPage({ title, updated, intro, children }: LegalPageProps) {
  return (
    <div className="mx-auto w-full max-w-[var(--container-2xl)] px-5 pb-28 pt-16 lg:px-8 lg:pb-32 lg:pt-24">
      <header className="max-w-[46rem]">
        <h1 className="text-balance text-[length:var(--text-h1)] font-semibold leading-[1.08] tracking-[-0.025em] text-[var(--color-foreground)]">
          {title}
        </h1>
        <p className="mt-4 text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
          {intro}
        </p>
        <p className="mt-6 text-[length:var(--text-body-sm)] text-[var(--color-muted)]">
          Last updated {updated}
        </p>
      </header>

      {/* 46rem is roughly 68 characters at this size — the measure prose is actually read at. */}
      <div className="mt-14 max-w-[46rem] space-y-12">{children}</div>
    </div>
  );
}

export function LegalSection({ heading, children }: { readonly heading: string; readonly children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[length:var(--text-h4)] font-semibold tracking-[var(--tracking-heading)] text-[var(--color-foreground)]">
        {heading}
      </h2>
      <div className="space-y-4 text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { readonly items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-[var(--color-muted)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** An unresolved item, visible to whoever reads the page rather than buried in a comment. */
export function LegalReview({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <p
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-muted)] px-4 py-3",
        "text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-warning)]",
        className,
      )}
    >
      <strong className="font-semibold">Founder review required — </strong>
      {children}
    </p>
  );
}
