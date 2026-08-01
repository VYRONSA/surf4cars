import { Icon } from "@/components/ui/icons";
import { Image as ImageIcon } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

/**
 * What a card shows when there is no photograph of the car.
 *
 * The alternative the platform used until now was a hero shot of a dark blue Porsche Cayenne, served
 * as every unphotographed listing's lead image — so a Hilux and a Corolla were both advertised with
 * a picture of a Porsche. See the note on `NO_PHOTOGRAPH` in the vehicle projection.
 *
 * This is the honest replacement, and it is deliberately plain. An obviously empty frame gets
 * noticed, gets reported and gets a photograph; a convincing one gets trusted. The dealer wording
 * says whose turn it is, because the fix is a dealer uploading a picture rather than us finding one.
 */
export interface PhotographPendingProps {
  /** Read by assistive technology in place of the missing image. */
  readonly vehicleTitle?: string;
  readonly className?: string;
}

export function PhotographPending({ vehicleTitle, className }: PhotographPendingProps) {
  return (
    <div
      role="img"
      aria-label={
        vehicleTitle
          ? `${vehicleTitle} — no photograph published yet`
          : "No photograph published yet"
      }
      className={cn(
        "relative flex size-full flex-col items-center justify-center gap-2.5 overflow-hidden px-4 text-center",
        /* A soft diagonal rather than flat grey. A photograph's absence should read as a frame that
           has not been filled yet, not as a failed image request — and a dead flat rectangle beside
           eleven photographs is the single cheapest-looking thing a marketplace can render. */
        "bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-surface-sunken)_55%,var(--color-surface)_100%)]",
        className,
      )}
    >
      <Icon icon={ImageIcon} aria-hidden className="size-5 text-[var(--color-muted)]/70" />
      <p className="text-[length:var(--text-caption)] uppercase tracking-[0.16em] text-[var(--color-muted)]">
        Photographs to follow
      </p>
    </div>
  );
}
