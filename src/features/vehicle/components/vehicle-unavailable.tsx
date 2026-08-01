import { Icon } from "@/components/ui/icons";
import { Info } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

/**
 * How this platform says "we don't know".
 *
 * Premium software does not hide missing information — it communicates it. An em dash in a table, or a
 * section that quietly disappears, tells a buyer nothing and costs more trust than the absence itself:
 * they cannot tell whether the equipment is missing, the data is missing, or the page is broken.
 *
 * Three things this always does:
 *
 *   names the gap        "Equipment has not been captured for this vehicle" — not "—", not silence.
 *   explains it          Whose information it is and why it is not here yet.
 *   offers the next step Usually: ask the dealer. A buyer with a question and a route to an answer is in
 *                        a far better position than one looking at a blank.
 *
 * It is deliberately styled as part of the page rather than as an error. A dashed border and muted type
 * read as "not yet", where a warning colour would read as "something went wrong".
 */

export interface VehicleUnavailableProps {
  /** What is missing, in the buyer's words. */
  readonly title: string;
  /** Why it is missing, honestly. One or two sentences. */
  readonly detail: string;
  /** What the buyer can do about it. Omitted when there is genuinely nothing. */
  readonly action?: React.ReactNode;
  readonly className?: string;
  /** `inline` sits inside a section that already has a heading; `block` stands alone. */
  readonly variant?: "block" | "inline";
}

export function VehicleUnavailable({
  title,
  detail,
  action,
  className,
  variant = "block",
}: VehicleUnavailableProps) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-strong)]",
        "bg-[var(--color-surface)]/40",
        variant === "block" ? "p-6" : "p-5",
        className,
      )}
    >
      <Icon icon={Info} aria-hidden className="mt-0.5 size-5 shrink-0 text-[var(--color-muted)]" />

      <div className="min-w-0">
        <p className="text-[length:var(--text-body-md)] font-medium text-[var(--color-foreground)]">
          {title}
        </p>
        <p className="mt-1.5 max-w-prose text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
          {detail}
        </p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

/**
 * A single unknown value inside a table or a row of stats.
 *
 * The same principle at field scale: "Not recorded" is a fact about our data, where "—" is a shrug.
 */
export function VehicleUnknownValue({ className }: { readonly className?: string }) {
  return (
    <span className={cn("text-[var(--color-muted)] italic", className)}>Not recorded</span>
  );
}
