/**
 * SURF FOR CARS — presentation layer.
 *
 * The single source of truth for how the platform shows what it sells. Every surface — homepage,
 * marketplace, vehicle detail, dealer profile, and anything built after them — consumes these. A page
 * that reimplements curation, deduplication or grid arithmetic locally is a regression, however small it
 * looks: it is how the marketplace came to show a road traffic collision while the homepage was clean.
 */
export {
  curateForDisplay,
  dedupeByPhotograph,
  isEligibleForDisplay,
  selectFeatured,
  selectRail,
  selectSimilarVehicles,
  tileableCount,
  type FeaturedSelection,
  type PresentableListing,
} from "./vehicle-presentation.service";

export {
  selectBrands,
  type BrandPresentation,
  type SelectBrandsOptions,
} from "./brand-presentation.service";

export {
  buildPriceContext,
  classifyAspiration,
  classifySegment,
  railCopy,
  rankByAspiration,
  HOMEPAGE_SEGMENTS,
  type AspirationVerdict,
  type MarketPriceContext,
  type MarketSegment,
  type MerchandisableVehicle,
  type MerchandisedVehicle,
  type MerchandisingTier,
  type RailCopy,
  type SegmentDefinition,
} from "./vehicle-merchandising.service";

export {
  MARQUE_OPTICAL,
  resolveMarqueIdentity,
  type MarqueAssetKind,
  type MarqueIdentity,
  type MarqueTypography,
} from "./marque-identity.service";
