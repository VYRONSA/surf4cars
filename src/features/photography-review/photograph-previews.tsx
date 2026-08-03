import Image from "next/image";

import { HomeEditorialVehicleCard } from "@/features/marketplace/homepage/components/home-editorial-vehicle-card";
import { VehicleListingCard } from "@/features/search/components/vehicle-listing-card";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";

/**
 * The same photograph, at the four sizes the marketplace actually shows it.
 *
 * WHY THESE ARE THE REAL COMPONENTS
 * =================================
 * The Founder's point is the whole reason this exists: a frame that looks acceptable at full size
 * can be unusable as a search card. Reproducing the cards here with approximate markup would defeat
 * that — the preview would be a drawing of the product rather than the product, and it would drift
 * the first time somebody changed a card's crop.
 *
 * So `HomeEditorialVehicleCard` and `VehicleListingCard` are imported and rendered. When the
 * marketplace's cards change, these previews change with them, because they are the same code.
 *
 * The vehicle page is the exception and is reproduced rather than imported: its hero is a
 * `min-h-[74svh]` full-bleed section with a purchase rail and a sticky bar over it, and dropping
 * that into a review panel would render a page inside a page. What matters at that size is the crop
 * and the object position, so those are what the panel reproduces — stated here because a preview
 * that is nearly the real thing is exactly the kind of thing that quietly stops being true.
 *
 * WIDTHS ARE DELIBERATE
 * =====================
 * Each frame is constrained to roughly the width that element occupies on a 1440px viewport: the
 * homepage lead card takes two of three columns in a `--container-2xl`, the standard cards one, and
 * a search result one of three. A preview at the wrong width answers the wrong question.
 */

export interface PhotographPreviewsProps {
  readonly listing: ShowcaseVehicleListing;
  /** The frame being judged, which may not be the one currently leading the listing. */
  readonly photograph: string;
}

const PreviewFrame = ({
  label,
  hint,
  width,
  span,
  children,
}: {
  readonly label: string;
  readonly hint: string;
  readonly width: string;
  /** Full width of the panel, for the two previews whose real size is wider than half of it. */
  readonly span?: boolean;
  readonly children: React.ReactNode;
}) => (
  <div className={span ? "min-w-0 2xl:col-span-2" : "min-w-0"}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
      <h4 className="text-[length:var(--text-body-sm)] font-semibold text-[var(--color-foreground)]">
        {label}
      </h4>
      <span className="text-[length:var(--text-caption)] text-[var(--color-muted)]">{hint}</span>
    </div>
    {/* The dark page wash behind it, so the card is judged against the surface it will sit on. */}
    <div className="mt-3 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <div className="mx-auto" style={{ maxWidth: width }}>
        {children}
      </div>
    </div>
  </div>
);

export function PhotographPreviews({ listing, photograph }: PhotographPreviewsProps) {
  /* The listing as it would be with this frame leading it. Nothing else about the card changes. */
  const candidate: ShowcaseVehicleListing = { ...listing, imageSrc: photograph };

  return (
    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
      {/*
        The homepage lead card spans the panel, because half of it is not its real size.
        ==============================================================================
        The first version put all four previews in a two-column grid with a `max-width` on each. The
        grid won: the lead card rendered 569px wide against the search card's 430px, when on the
        marketplace it is more than twice the width. A preview at the wrong size answers the wrong
        question, which is the one thing this screen cannot afford — so the two wide renderings take
        the full panel and only the two card-sized ones sit side by side.
      */}
      <PreviewFrame label="Homepage" hint="lead card · 16:9 · 890px" width="890px" span>
        <HomeEditorialVehicleCard listing={candidate} emphasis="lead" />
      </PreviewFrame>

      <PreviewFrame label="Vehicle page" hint="full-bleed hero · crop and position only" width="100%" span>
        {/*
          Reproduced, not imported — see the note above. 21:9 stands in for a `74svh` full-bleed
          section at this width; what is being judged is what the crop keeps and what it loses.
        */}
        <div className="relative isolate aspect-[21/9] w-full overflow-hidden rounded-[var(--radius-lg)]">
          <Image
            src={photograph}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: listing.imagePosition }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,8,8,0.85)_0%,rgba(8,8,8,0.2)_46%,rgba(8,8,8,0)_100%)]"
          />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[length:var(--text-h4)] font-semibold text-[var(--color-foreground)]">
              {listing.title}
            </p>
            <p className="mt-1 text-[length:var(--text-body-md)] font-semibold text-[var(--color-foreground)]">
              {listing.price}
            </p>
          </div>
        </div>
      </PreviewFrame>

      <PreviewFrame label="Search card" hint="results grid · 3:2 · 430px" width="430px">
        <VehicleListingCard listing={candidate} />
      </PreviewFrame>

      <PreviewFrame label="Dealer page" hint="dealer inventory grid · 3:2 · 430px" width="430px">
        <HomeEditorialVehicleCard listing={candidate} />
      </PreviewFrame>
    </div>
  );
}
