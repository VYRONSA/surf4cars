import { getAttribution, listAttributions, type MediaAttribution } from "@/config/media";
import { cn } from "@/utils";

/**
 * Attribution for curated media.
 *
 * CC BY and CC BY-SA photography is only free to use while the credit is given, so the credit is
 * rendered from the same manifest the image is, not maintained separately alongside it. An asset
 * whose licence asks for nothing renders nothing — a credit line under a CC0 photograph is noise,
 * and noise is what teaches people to stop reading credits.
 */

export interface MediaAttributionProps {
  /** Premium media id, matching the brief — "hero", "suv", "dealer-cover". */
  readonly mediaId: string;
  /** `overlay` sits on the photograph; `caption` sits beneath it in the flow. */
  readonly variant?: "overlay" | "caption";
  readonly className?: string;
}

const linked = (label: string, href: string | null) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer license"
      className="underline decoration-white/30 underline-offset-2 transition-colors hover:decoration-current"
    >
      {label}
    </a>
  ) : (
    label
  );

const credit = (attribution: MediaAttribution) => (
  <>
    {linked(attribution.author, attribution.authorUrl)}
    {" · "}
    {linked(attribution.licence, attribution.licenceUrl)}
  </>
);

export function MediaAttribution({ mediaId, variant = "overlay", className }: MediaAttributionProps) {
  const attribution = getAttribution(mediaId);
  if (!attribution) return null;

  return (
    <p
      className={cn(
        "text-[0.6875rem] leading-snug tracking-wide",
        variant === "overlay"
          ? "absolute bottom-2 right-3 z-10 max-w-[60%] text-right text-white/55 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
          : "mt-2 text-muted-foreground",
        className,
      )}
    >
      {credit(attribution)}
    </p>
  );
}

export interface MediaCreditsProps {
  readonly className?: string;
}

/**
 * The full credits list, for a colophon or about page. This is where the obligation is discharged
 * for images whose own surface has no room for a caption.
 */
export function MediaCredits({ className }: MediaCreditsProps) {
  const attributions = listAttributions();
  if (attributions.length === 0) return null;

  return (
    <ul className={cn("space-y-2 text-sm text-muted-foreground", className)}>
      {attributions.map((attribution) => (
        <li key={attribution.id}>
          <span className="text-foreground">{attribution.title}</span>
          {" — "}
          {credit(attribution)}
          {attribution.sourceUrl ? <> · {linked("source", attribution.sourceUrl)}</> : null}
        </li>
      ))}
    </ul>
  );
}
