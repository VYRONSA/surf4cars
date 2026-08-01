"use client";

import { hasValue } from "@/features/vehicle/config/unspecified";
import Image from "next/image";

import { Icon } from "@/components/ui/icons";
import { BadgeCheck } from "@/components/ui/icons/registry";
import { useVehicleGallery } from "@/features/vehicle/components/vehicle-gallery-context";
import { cn } from "@/utils";

/**
 * The vehicle, presented.
 *
 * What was here before the rebuild: a 16:10 photograph inside a bordered, shadowed card occupying
 * about 60% of the page width, a strip of 96px thumbnails under it, and — filling the other 40% at
 * the same height — a glass panel carrying the title, price, six specifications, availability, three
 * enquiry-type tabs, four form fields, two call buttons, a send button and three more actions.
 * Behind all of it, the car's own photograph again, blurred to 28px, as wallpaper.
 *
 * A buyer's first sight of a car they might spend six hundred thousand rand on was a thumbnail
 * beside a contact form. Every automotive brand that sells on desire does the opposite: the car
 * fills the frame, alone, and the transaction waits.
 *
 * The filmstrip has since moved out of this component — see `VehicleDetailGalleryStrip`. The page
 * now reads photograph → name → price → description → gallery, so the hero holds only what belongs
 * in the frame with the car.
 */

export interface VehicleDetailShowcaseProps {
  readonly title: string;
  readonly subtitle: string;
  readonly price: string;
  readonly monthlyRepayment: string | null;
  readonly year: number;
  readonly mileage: string;
  readonly transmission: string;
  readonly fuel: string;
  readonly location: string;
  readonly verified: boolean;
}

export function VehicleDetailShowcase({
  title,
  subtitle,
  price,
  monthlyRepayment,
  year,
  mileage,
  transmission,
  fuel,
  location,
  verified,
}: VehicleDetailShowcaseProps) {
  const { images, open } = useVehicleGallery();
  const lead = images[0];
  const total = images.length;

  /*
    No photographs at all.

    Rendering nothing would leave a hole the page reads as broken; borrowing a generic image would
    imply a photograph exists. Saying so plainly is the only option that is both complete and true.
  */
  if (!lead) {
    return (
      <section className="border-b border-[var(--color-border-subtle)]">
        <div className="mx-auto max-w-[var(--container-2xl)] px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            {subtitle}
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-[length:var(--text-display-sm)] font-semibold leading-[1.05] tracking-[-0.02em]">
            {title}
          </h1>
          <p className="mt-6 text-[length:var(--text-h2)] font-semibold tabular-nums tracking-[-0.02em]">
            {price}
          </p>
          <p className="mt-10 max-w-xl text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
            This vehicle has not been photographed yet. We would rather show you nothing than show
            you a picture of a different car.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative isolate flex min-h-[74svh] flex-col justify-end overflow-hidden lg:min-h-[82svh]"
      aria-labelledby="vehicle-heading"
    >
      <Image
        src={lead.src}
        alt={lead.alt}
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
        style={{ objectPosition: lead.objectPosition ?? "center" }}
      />

      {/*
        Two scrims, shaped rather than flooded.
        =======================================
        The page this replaces darkened its whole backdrop to 0.42 brightness plus a cinematic
        overlay, because the panel on top of it had to be legible everywhere. Nothing sits on top of
        the photograph now except one corner of type, so the darkness goes where the type is: a
        vertical fade carrying the frame into the page below, and a horizontal wash under the copy
        column that releases before it reaches the middle of the car.
      */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--color-background)_0%,rgba(var(--color-scrim-rgb),0.72)_14%,rgba(var(--color-scrim-rgb),0.18)_36%,transparent_58%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(var(--color-scrim-rgb),0.86)_0%,rgba(var(--color-scrim-rgb),0.62)_28%,rgba(var(--color-scrim-rgb),0.22)_50%,transparent_72%)] [mask-image:linear-gradient(to_top,black_0%,black_46%,rgba(0,0,0,0.5)_70%,transparent_92%)]"
      />

      {/*
        The illustrative-image disclosure.
        =================================
        Kept in the frame, because the judgement it qualifies — colour, trim, condition — is made
        while looking at the photograph, and a disclosure read afterwards has disclosed nothing.

        Sized as a photo credit. It began as a three-line amber-bordered block over the car's bonnet,
        and a full-width band across the top was worse: directly under the site header it read as a
        service alert, and a page cannot open on a warning strip and also sell a car.
      */}
      {lead.provenance !== "dealer" && (
        <p
          className={cn(
            "z-10 rounded-[var(--radius-md)] bg-black/55 px-3 py-2 text-[length:var(--text-caption)] leading-snug text-white/80 backdrop-blur-md",
            /* In flow on a phone, where an absolute corner note lands on top of the gallery button —
               390px does not have a spare corner. Pinned bottom-right from `sm`. */
            "relative mx-5 mb-4 self-start sm:absolute sm:bottom-5 sm:right-5 sm:mx-0 sm:mb-0 sm:max-w-[16rem] sm:text-right lg:right-8",
          )}
        >
          <span className="font-semibold text-[var(--color-warning)]">Illustrative image</span>
          <span className="block">Represents the make and model — may not depict this vehicle.</span>
        </p>
      )}

      <div className="relative mx-auto w-full max-w-[var(--container-2xl)] px-6 pb-12 pt-40 sm:px-8 lg:px-10 lg:pb-16">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.22em] text-white/70">
            {subtitle}
          </p>
          {verified && (
            <span className="inline-flex items-center gap-1.5 text-[length:var(--text-caption)] font-medium uppercase tracking-[0.14em] text-white/85">
              <Icon icon={BadgeCheck} aria-hidden className="size-4 text-[var(--color-success)]" />
              Verified
            </span>
          )}
        </div>

        <h1
          id="vehicle-heading"
          className="mt-4 max-w-3xl text-balance text-[length:var(--text-display-sm)] font-semibold leading-[1.03] tracking-[-0.025em] text-white lg:text-[length:var(--text-display-md)]"
        >
          {title}
        </h1>

        <div className="mt-7 flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <p className="text-[length:var(--text-h1)] font-semibold tabular-nums tracking-[-0.03em] text-white">
            {price}
          </p>
          {/*
            Rendered only when there is a figure, which today there never is.
            ================================================================
            PCP-032 made `monthlyRepayment` nullable and removed the invented `price / 72 * 1.18`
            behind it. This line kept its "/ month" suffix, so the largest number on the page read

                R 445 000 / month

            for every vehicle on the marketplace. A dangling unit is the worst possible residue of a
            removed value: it does not look absent, it looks like a monthly instalment forty times the
            real one, directly beneath the asking price.
          */}
          {monthlyRepayment && (
            <p className="text-[length:var(--text-body-md)] text-white/65">
              {monthlyRepayment} / month
            </p>
          )}
        </div>

        {/* Four facts, as one line. The full specification is a scroll away; this is what a buyer
            checks before they decide whether to keep reading. */}
        <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:var(--text-body-md)] text-white/80">
          {[String(year), mileage, transmission, fuel, location].filter(hasValue).map((fact, index) => (
            <span key={fact} className="inline-flex items-center gap-3">
              {index > 0 && (
                <span aria-hidden className="text-white/30">
                  /
                </span>
              )}
              <span className={index < 2 ? "tabular-nums" : undefined}>{fact}</span>
            </span>
          ))}
        </p>

        {total > 1 && (
          <button
            type="button"
            onClick={() => open(0)}
            className={cn(
              "motion-button mt-9 inline-flex h-12 items-center gap-2.5 rounded-[var(--radius-pill)]",
              "border border-white/25 bg-white/10 px-6 text-[length:var(--text-body-sm)] font-medium text-white backdrop-blur-md",
              "hover:border-white/50 hover:bg-white/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
            )}
          >
            View all {total} photographs
          </button>
        )}
      </div>
    </section>
  );
}
