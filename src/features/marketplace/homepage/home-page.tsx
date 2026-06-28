import { HomeAiSection } from "@/features/marketplace/homepage/components/home-ai-section";
import { HomeCollections } from "@/features/marketplace/homepage/components/home-collections";
import { HomeContentSection } from "@/features/marketplace/homepage/components/home-content-section";
import { HomeCta } from "@/features/marketplace/homepage/components/home-cta";
import { HomeDealers } from "@/features/marketplace/homepage/components/home-dealers";
import { HomeHero } from "@/features/marketplace/homepage/components/home-hero";
import { HomeMarketplacePreview } from "@/features/marketplace/homepage/components/home-marketplace-preview";
import { HomeWhySurf } from "@/features/marketplace/homepage/components/home-why-surf";

export function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeCollections />
      <HomeWhySurf />
      <HomeDealers />
      <HomeMarketplacePreview />
      <HomeAiSection />
      <HomeContentSection />
      <HomeCta />
    </>
  );
}
