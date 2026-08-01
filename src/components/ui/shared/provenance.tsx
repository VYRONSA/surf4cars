import { Icon } from "@/components/ui/icons";
import { BadgeCheck, Building2, Calculator, Layers } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

/**
 * Where a number came from.
 *
 * SURF4CARS shows a customer four very different kinds of claim, and until now they looked identical on
 * screen. "Verified dealer" is something we checked. "8 vehicles in stock" is something we counted.
 * "R 13 542 / month" is something we calculated from assumptions the buyer can change. "Full service
 * history" would be something a dealer told us. A buyer weighing a purchase is entitled to know which is
 * which — a figure we counted deserves more confidence than one somebody typed into a form.
 *
 * Marking the difference is cheap, and it is the platform's actual differentiator: most automotive sites
 * present every claim in the same confident voice, which trains people to discount all of it. Saying "we
 * counted this" and "the dealer told us this" in the same breath makes both more believable.
 *
 * Deliberately small and quiet. This is a footnote, not a badge — it should reward the person who looks
 * for it without competing with the number it describes.
 */

export type ProvenanceKind =
  /** Counted or read directly from platform records. The strongest claim we make. */
  | "platform"
  /** Derived from inputs, and only as good as them. Finance estimates, market position. */
  | "calculated"
  /** Supplied by the dealership. True as far as we know; we did not witness it. */
  | "dealer"
  /** Checked by SURF4CARS during onboarding. */
  | "verified";

const PROVENANCE: Record<ProvenanceKind, { readonly label: string; readonly icon: typeof Layers }> = {
  platform: { label: "Counted by SURF4CARS", icon: Layers },
  calculated: { label: "Calculated — indicative", icon: Calculator },
  dealer: { label: "Provided by the dealer", icon: Building2 },
  verified: { label: "Verified by SURF4CARS", icon: BadgeCheck },
};

export interface ProvenanceNoteProps {
  readonly kind: ProvenanceKind;
  /** Replaces the default wording where a slot needs to be more specific. */
  readonly label?: string;
  readonly className?: string;
}

export function ProvenanceNote({ kind, label, className }: ProvenanceNoteProps) {
  const { label: defaultLabel, icon } = PROVENANCE[kind];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[length:var(--text-caption)] leading-none text-[var(--color-muted)]",
        className,
      )}
    >
      <Icon icon={icon} aria-hidden className="size-3.5" />
      {label ?? defaultLabel}
    </span>
  );
}
