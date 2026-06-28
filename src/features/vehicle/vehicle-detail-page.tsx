import { PublicPageBreadcrumbs } from "@/components/public/breadcrumbs/public-breadcrumbs";
import { HeroImageBackground } from "@/components/ui/media";
import { PREMIUM_IMAGE_SIZES, PREMIUM_IMAGES } from "@/config/images";
import { VehicleDetailActions } from "@/features/vehicle/components/vehicle-detail-actions";
import { VehicleDetailAiPanel } from "@/features/vehicle/components/vehicle-detail-ai-panel";
import { VehicleDetailDealer } from "@/features/vehicle/components/vehicle-detail-dealer";
import { VehicleDetailDescription } from "@/features/vehicle/components/vehicle-detail-description";
import { VehicleDetailFeatures } from "@/features/vehicle/components/vehicle-detail-features";
import { VehicleDetailFinanceCalculator } from "@/features/vehicle/components/vehicle-detail-finance-calculator";
import { VehicleDetailGallery } from "@/features/vehicle/components/vehicle-detail-gallery";
import { VehicleDetailInfoCard } from "@/features/vehicle/components/vehicle-detail-info-card";
import { VehicleDetailSimilar } from "@/features/vehicle/components/vehicle-detail-similar";
import { VehicleDetailSpecs } from "@/features/vehicle/components/vehicle-detail-specs";
import { VehicleDetailStickyBar } from "@/features/vehicle/components/vehicle-detail-sticky-bar";
import { VehicleDetailTrust } from "@/features/vehicle/components/vehicle-detail-trust";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";

export interface VehicleDetailPageProps {
  readonly vehicle: VehicleDetail;
}

export function VehicleDetailPage({ vehicle }: VehicleDetailPageProps) {
  return (
    <>
      <section className="relative min-h-[520px] overflow-hidden lg:min-h-[580px]">
        <HeroImageBackground
          src={PREMIUM_IMAGES.vehicles.details}
          alt=""
          priority
          sizes={PREMIUM_IMAGE_SIZES.fullWidth}
          overlayVariant="cinematic"
          objectPosition="landscape"
        />

        <div className="relative mx-auto max-w-[var(--container-2xl)] px-4 pb-10 pt-6 lg:px-6 lg:pb-14 lg:pt-8">
          <PublicPageBreadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Search", href: "/search" },
              { label: vehicle.title },
            ]}
          />

          <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start xl:grid-cols-[1fr_420px] xl:gap-10">
            <VehicleDetailGallery images={vehicle.gallery} title={vehicle.title} />

            <div className="lg:sticky lg:top-24 lg:space-y-5">
              <VehicleDetailInfoCard vehicle={vehicle} />
              <div className="hidden lg:block">
                <VehicleDetailActions />
              </div>
            </div>
          </div>

          <div className="mt-6 lg:hidden">
            <VehicleDetailActions />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[var(--container-2xl)] space-y-14 px-4 pb-28 pt-10 lg:space-y-16 lg:px-6 lg:pb-32 lg:pt-12">
        <VehicleDetailDescription sections={vehicle.description} />
        <VehicleDetailFeatures features={vehicle.features} />
        <VehicleDetailSpecs specGroups={vehicle.specGroups} />
        <VehicleDetailDealer dealer={vehicle.dealer} />
        <VehicleDetailFinanceCalculator priceNumeric={vehicle.priceNumeric} />
        <VehicleDetailTrust indicators={vehicle.trustIndicators} />
        <VehicleDetailSimilar similarSlugs={vehicle.similarSlugs} currentSlug={vehicle.slug} />
      </div>

      <VehicleDetailAiPanel insights={vehicle.aiInsights} />
      <VehicleDetailStickyBar price={vehicle.price} monthlyRepayment={vehicle.monthlyRepayment} />
    </>
  );
}
