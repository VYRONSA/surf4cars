import Link from "next/link";

import { homeLinkStyles } from "@/features/marketplace/homepage/components/home-shared";
import { cn } from "@/utils";

/**
 * The closing section — the supply side, last, where it belongs.
 *
 * It used to carry a blue radial glow, a red "The future is here" overline, a heading asking "Ready
 * to move forward?", a line reading "Dealers grow with modern tools. Buyers discover with
 * confidence.", and two buttons each wearing an icon. Six elements, none of which said what the
 * section is for, on the last thing a buyer sees.
 *
 * The blue was the clearest tell. This brand has one accent and it is red; a blue glow behind the
 * final call to action is decoration wearing the costume of emphasis. Both glows are gone, the
 * overline is gone, the copy names the offer, and there is one primary action — because this section
 * has exactly one job, which is to interest a dealership.
 */
export function HomeCta() {
  return (
    <section className="py-20 lg:py-28" aria-labelledby="home-cta-heading">
      <div className="mx-auto max-w-[var(--container-2xl)] px-6 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <h2
            id="home-cta-heading"
            className="text-balance text-[length:var(--text-h1)] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--color-foreground)]"
          >
            Sell your stock here.
          </h2>

          <p className="mt-5 max-w-lg text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
            Photograph it once, and every buyer sees the same complete listing.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/auth/sign-up/dealer" className={cn(homeLinkStyles.primary, "w-full sm:w-auto")}>
              List with SURF4CARS
            </Link>
            <Link
              href="/search"
              className="motion-nav inline-flex h-12 items-center justify-center px-2 text-[length:var(--text-body-md)] text-[var(--color-muted-foreground)] underline-offset-4 hover:text-[var(--color-foreground)] hover:underline"
            >
              Or browse the marketplace
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
