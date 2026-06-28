import { PREMIUM_IMAGES } from "@/config/images";
import { MARKETING_CHANNELS } from "@/domain/vehicle/types/vehicle-marketing.types";
import { VEHICLE_STATUS } from "@/domain/vehicle/constants/vehicle-status.constants";
import type { UnifiedVehicleRecord } from "@/domain/vehicle";
import type { VehicleStatus } from "@/domain/vehicle/constants/vehicle-status.constants";

const HERO = PREMIUM_IMAGES.vehicles.details;
const NOW = "2026-06-27T08:00:00.000Z";

const BASE_SPEC_GROUPS = [
  {
    id: "performance",
    title: "Performance",
    specs: [
      { label: "Power", value: "250 kW" },
      { label: "Torque", value: "450 Nm" },
      { label: "0–100 km/h", value: "5.4 sec" },
      { label: "Top speed", value: "250 km/h" },
      { label: "Drive type", value: "AWD" },
    ],
  },
  {
    id: "dimensions",
    title: "Dimensions",
    specs: [
      { label: "Length", value: "4,935 mm" },
      { label: "Width", value: "2,004 mm" },
      { label: "Height", value: "1,745 mm" },
      { label: "Wheelbase", value: "2,975 mm" },
      { label: "Boot capacity", value: "650 L" },
    ],
  },
  {
    id: "engine",
    title: "Engine",
    specs: [
      { label: "Engine type", value: "Turbocharged inline-6" },
      { label: "Displacement", value: "2,998 cc" },
      { label: "Cylinders", value: "6" },
      { label: "Fuel system", value: "Direct injection" },
      { label: "Emissions", value: "Euro 6" },
    ],
  },
  {
    id: "safety",
    title: "Safety",
    specs: [
      { label: "Airbags", value: "8" },
      { label: "ABS / EBD", value: "Standard" },
      { label: "Stability control", value: "Standard" },
      { label: "Lane assist", value: "Standard" },
      { label: "Blind spot monitor", value: "Standard" },
    ],
  },
  {
    id: "comfort",
    title: "Comfort",
    specs: [
      { label: "Climate zones", value: "4-zone" },
      { label: "Seats", value: "Leather, heated & ventilated" },
      { label: "Suspension", value: "Adaptive air" },
      { label: "Panoramic roof", value: "Yes" },
      { label: "Ambient lighting", value: "64 colours" },
    ],
  },
  {
    id: "technology",
    title: "Technology",
    specs: [
      { label: "Infotainment", value: '12.3" curved display' },
      { label: "Apple CarPlay", value: "Wireless" },
      { label: "Android Auto", value: "Wireless" },
      { label: "Head-up display", value: "Yes" },
      { label: "Sound system", value: "Premium 16-speaker" },
    ],
  },
  {
    id: "warranty",
    title: "Warranty",
    specs: [
      { label: "Manufacturer warranty", value: "5 years / 100,000 km" },
      { label: "Maintenance plan", value: "5 years / 90,000 km" },
      { label: "Roadside assist", value: "Included" },
      { label: "Corrosion warranty", value: "12 years" },
    ],
  },
  {
    id: "service-plan",
    title: "Service Plan",
    specs: [
      { label: "Plan type", value: "Comprehensive" },
      { label: "Duration", value: "5 years" },
      { label: "Distance", value: "90,000 km" },
      { label: "Transferable", value: "Yes" },
    ],
  },
] as const;

const COMMON_FEATURES = [
  { id: "leather", label: "Leather", icon: "Armchair" },
  { id: "sunroof", label: "Sunroof", icon: "Sun" },
  { id: "navigation", label: "Navigation", icon: "MapPin" },
  { id: "carplay", label: "Apple CarPlay", icon: "Smartphone" },
  { id: "android", label: "Android Auto", icon: "Smartphone" },
  { id: "cruise", label: "Adaptive Cruise", icon: "Gauge" },
  { id: "reverse-cam", label: "Reverse Camera", icon: "Eye" },
  { id: "360-cam", label: "360 Camera", icon: "Layers" },
  { id: "lane", label: "Lane Assist", icon: "Target" },
  { id: "blind-spot", label: "Blind Spot", icon: "Shield" },
  { id: "keyless", label: "Keyless", icon: "Key" },
  { id: "tow-bar", label: "Tow Bar", icon: "Truck" },
] as const;

const COMMON_AI_INSIGHTS = [
  { id: "market", label: "Market value", value: "R 1,220,000 – R 1,280,000", tone: "neutral" as const },
  { id: "price-rating", label: "Price rating", value: "Fair — within 2% of market", tone: "positive" as const },
  { id: "running-cost", label: "Running cost estimate", value: "R 4,200 / month", tone: "neutral" as const },
  { id: "insurance", label: "Insurance estimate", value: "R 2,850 / month", tone: "neutral" as const },
  { id: "fuel-economy", label: "Fuel economy", value: "9.2 L/100km combined", tone: "neutral" as const },
  { id: "ownership", label: "Ownership score", value: "92 / 100", score: 92, tone: "positive" as const },
  { id: "family", label: "Family suitability", value: "Excellent — 5 seats, large boot", tone: "positive" as const },
  { id: "long-distance", label: "Long-distance score", value: "88 / 100", score: 88, tone: "positive" as const },
  { id: "city", label: "City driving score", value: "76 / 100", score: 76, tone: "neutral" as const },
  { id: "resale", label: "Resale prediction", value: "Strong — 68% retention at 3 years", tone: "accent" as const },
];

const COMMON_TRUST = [
  { id: "verified-dealer", label: "Verified Dealer", description: "Identity and credentials confirmed by SURF." },
  { id: "roadworthy", label: "Roadworthy", description: "Valid roadworthy certificate on file." },
  { id: "service-history", label: "Service History", description: "Full dealer service history available." },
  { id: "finance", label: "Finance Available", description: "Multiple finance partners available." },
  { id: "delivery", label: "Nationwide Delivery", description: "Delivery to major cities across SA." },
  { id: "inspection", label: "Inspection Passed", description: "150-point pre-delivery inspection completed." },
];

interface SeedInput {
  readonly id: string;
  readonly slug: string;
  readonly tenantId: string;
  readonly make: string;
  readonly model: string;
  readonly variant: string;
  readonly title: string;
  readonly subtitle: string;
  readonly year: number;
  readonly mileageKm: number;
  readonly mileageDisplay: string;
  readonly transmission: string;
  readonly fuel: string;
  readonly bodyType: string;
  readonly engine: string;
  readonly colour: string;
  readonly vin: string;
  readonly stockNumber: string;
  readonly sellingPriceCents: number;
  readonly sellingPriceDisplay: string;
  readonly financeEstimateDisplay: string;
  readonly monthlyRepaymentDisplay: string;
  readonly location: string;
  readonly province: string;
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly dealershipSlug: string;
  readonly branchId: string;
  readonly branchName: string;
  readonly logoInitials: string;
  readonly phone: string;
  readonly whatsapp: string;
  readonly rating: number;
  readonly reviewCount: number;
  readonly responseTime: string;
  readonly yearsInBusiness: number;
  readonly vehiclesInStock: number;
  readonly galleryPrefix: string;
  readonly galleryPositions: readonly string[];
  readonly description: readonly { readonly heading?: string; readonly paragraphs: readonly string[] }[];
  readonly featureCount?: number;
  readonly status: VehicleStatus;
  readonly featured?: boolean;
  readonly reducedPrice?: boolean;
  readonly featuredUntil?: string;
  readonly listingScore: number;
  readonly photoScore: number;
  readonly descriptionScore: number;
  readonly priceScore: number;
  readonly demandScore: number;
  readonly aiRating: "Strong" | "Fair" | "Weak" | "Critical";
  readonly health: "excellent" | "good" | "needs-attention" | "critical";
  readonly aiMatchScore: number;
  readonly views: number;
  readonly enquiries: number;
  readonly saves: number;
  readonly daysInStock: number;
  readonly similarVehicleIds: readonly string[];
  readonly aiInsights?: typeof COMMON_AI_INSIGHTS;
  readonly publishToMarketplace?: boolean;
  readonly dateAdded: string;
  readonly purchasePriceCents?: number;
  readonly costCents?: number;
}

function buildGallery(prefix: string, positions: readonly string[]) {
  const categories = ["exterior", "interior", "wheels", "engine", "boot", "dashboard", "rear-seats"] as const;
  const labels = ["Exterior", "Interior", "Wheels", "Engine", "Boot", "Dashboard", "Rear seats"];
  return categories.map((category, index) => ({
    id: `${prefix}-${category}`,
    kind: "photo" as const,
    url: HERO,
    alt: `${labels[index]} view`,
    category,
    objectPosition: positions[index] ?? "center",
    sortOrder: index,
    isPrimary: index === 0,
  }));
}

function defaultMarketingChannels(publishToMarketplace: boolean) {
  return Object.values(MARKETING_CHANNELS).map((channel) => ({
    channel,
    enabled:
      publishToMarketplace &&
      (channel === MARKETING_CHANNELS.MARKETPLACE || channel === MARKETING_CHANNELS.DEALER_WEBSITE),
    lastPublishedAt: publishToMarketplace ? NOW : undefined,
  }));
}

function buildRecord(input: SeedInput): UnifiedVehicleRecord {
  const profitCents =
    input.purchasePriceCents !== undefined
      ? input.sellingPriceCents - input.purchasePriceCents
      : undefined;
  const features = COMMON_FEATURES.slice(0, input.featureCount ?? COMMON_FEATURES.length).map((f) => ({ ...f }));

  return {
    id: input.id,
    slug: input.slug,
    tenantId: input.tenantId,
    core: {
      vin: input.vin,
      make: input.make,
      model: input.model,
      variant: input.variant,
      year: input.year,
      mileageKm: input.mileageKm,
      mileageDisplay: input.mileageDisplay,
      transmission: input.transmission,
      fuel: input.fuel,
      bodyType: input.bodyType,
      engine: input.engine,
      colour: input.colour,
      doors: 5,
      seats: 5,
      driveType: "awd",
      condition: "used",
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      specifications: BASE_SPEC_GROUPS.map((g) => ({ ...g, specs: [...g.specs] })),
      features,
      warranty: "5 years / 100,000 km",
      servicePlan: "5 years / 90,000 km",
      roadworthy: true,
      financeAvailable: true,
      nationwideDelivery: true,
      inspectionStatus: "passed",
    },
    dealer: {
      dealershipId: input.dealershipId,
      dealershipName: input.dealershipName,
      dealershipSlug: input.dealershipSlug,
      branchId: input.branchId,
      branchName: input.branchName,
      stockNumber: input.stockNumber,
      purchasePriceCents: input.purchasePriceCents,
      sellingPriceCents: input.sellingPriceCents,
      costCents: input.costCents ?? input.purchasePriceCents,
      profitCents,
      status: input.status,
      dateAdded: input.dateAdded,
      location: input.location,
      province: input.province,
      dealerNotes: "Internal note — follow up on photo quality and pricing strategy.",
      verified: true,
      rating: input.rating,
      reviewCount: input.reviewCount,
      responseTime: input.responseTime,
      yearsInBusiness: input.yearsInBusiness,
      vehiclesInStock: input.vehiclesInStock,
      phone: input.phone,
      whatsapp: input.whatsapp,
      logoInitials: input.logoInitials,
    },
    pricing: {
      sellingPriceCents: input.sellingPriceCents,
      sellingPriceDisplay: input.sellingPriceDisplay,
      reducedPrice: input.reducedPrice ?? false,
      financeEstimateDisplay: input.financeEstimateDisplay,
      monthlyRepaymentDisplay: input.monthlyRepaymentDisplay,
      interestRatePercent: 11.5,
      termMonths: 72,
      currency: "ZAR",
      priceHistory: [{ date: "Listed", priceCents: input.sellingPriceCents, priceDisplay: input.sellingPriceDisplay }],
    },
    marketing: {
      channels: defaultMarketingChannels(input.publishToMarketplace ?? true),
      seoTitle: `${input.title} for Sale`,
      seoDescription: `${input.title} — ${input.sellingPriceDisplay}. ${input.mileageDisplay}, ${input.fuel}.`,
      featured: input.featured ?? false,
      boosted: input.featured ?? false,
    },
    ai: {
      scores: {
        listingScore: input.listingScore,
        photoScore: input.photoScore,
        descriptionScore: input.descriptionScore,
        priceScore: input.priceScore,
        demandScore: input.demandScore,
        marketPosition: input.aiRating === "Strong" ? "Above market demand" : "Average market position",
        predictedSaleDays: Math.max(14, 90 - input.demandScore),
        recommendedPriceCents: input.sellingPriceCents,
        recommendedPriceDisplay: input.sellingPriceDisplay,
        recommendedImprovements:
          input.health === "excellent"
            ? ["Maintain featured placement", "Respond to enquiries within 1 hour"]
            : input.health === "critical"
              ? ["Replace photos immediately", "Reduce price by 5–8%", "Complete missing specifications"]
              : ["Add 4+ professional photos", "Refresh description with key features", "Review market pricing"],
        aiRating: input.aiRating,
        health: input.health,
        aiMatchScore: input.aiMatchScore,
      },
      insights: (input.aiInsights ?? COMMON_AI_INSIGHTS).map((i) => ({ ...i })),
      lastAnalysedAt: NOW,
    },
    media: {
      photos: buildGallery(input.galleryPrefix, input.galleryPositions),
      videos: [],
      images360: [],
      documents: [],
      inspectionReports: [],
      serviceHistory: [],
      brochures: [],
      futureAssets: [],
    },
    history: {
      engagement: {
        views: input.views,
        enquiries: input.enquiries,
        saves: input.saves,
        daysInStock: input.daysInStock,
        conversionRate: input.views > 0 ? Math.round((input.enquiries / input.views) * 1000) / 10 : 0,
      },
      activity: [
        { id: "a1", event: `${input.views} listing views this week`, timestamp: NOW, type: "view" },
        {
          id: "a2",
          event: input.enquiries > 0 ? "New enquiry received" : "No enquiries in 14 days",
          timestamp: NOW,
          type: "lead",
        },
        { id: "a3", event: "Price last reviewed", timestamp: NOW, type: "price" },
      ],
      trustIndicators: COMMON_TRUST.map((t) => ({ ...t })),
      similarVehicleIds: [...input.similarVehicleIds],
    },
    status: {
      current: input.status,
      publishedAt: input.status !== VEHICLE_STATUS.DRAFT ? input.dateAdded : undefined,
      featuredUntil: input.featuredUntil,
      availabilityLabel: input.status === VEHICLE_STATUS.DRAFT ? "Draft" : "Available now",
    },
    createdAt: input.dateAdded,
    updatedAt: NOW,
  };
}

const ALL_SIMILAR = [
  "inv-1",
  "inv-2",
  "inv-3",
  "inv-4",
  "inv-5",
  "inv-6",
] as const;

export const VEHICLE_SHOWCASE_SEED: readonly UnifiedVehicleRecord[] = [
  buildRecord({
    id: "inv-1",
    slug: "2024-bmw-x5-xdrive40i-m-sport",
    tenantId: "atlantic-auto-collective",
    make: "BMW",
    model: "X5",
    variant: "xDrive40i M Sport",
    title: "2024 BMW X5 xDrive40i M Sport",
    subtitle: "Premium SUV · M Sport Package · Panoramic Roof",
    year: 2024,
    mileageKm: 12400,
    mileageDisplay: "12,400 km",
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "SUV",
    engine: "3.0L Turbo Inline-6",
    colour: "Alpine White",
    vin: "WBAXXXXXXX ·•••••••",
    stockNumber: "AAC-X5-2401",
    sellingPriceCents: 124990000,
    sellingPriceDisplay: "R 1,249,900",
    financeEstimateDisplay: "Est. R18,450 /mo at 11.5% over 72 months",
    monthlyRepaymentDisplay: "R 18,450",
    location: "Cape Town, WC",
    province: "Western Cape",
    dealershipId: "atlantic-auto-collective",
    dealershipName: "Atlantic Auto Collective",
    dealershipSlug: "atlantic-auto-collective",
    branchId: "aac-cpt",
    branchName: "Cape Town",
    logoInitials: "AA",
    phone: "+27 21 555 0100",
    whatsapp: "+27 82 555 0100",
    rating: 4.9,
    reviewCount: 128,
    responseTime: "Under 1 hour",
    yearsInBusiness: 12,
    vehiclesInStock: 84,
    galleryPrefix: "bmw-x5",
    galleryPositions: ["center 40%", "center 55%", "center 70%", "center 30%", "center 60%", "center 45%", "center 50%"],
    description: [
      {
        heading: "Overview",
        paragraphs: [
          "This 2024 BMW X5 xDrive40i M Sport represents the pinnacle of premium SUV ownership in South Africa. Finished in Alpine White with a full M Sport exterior and interior package, it delivers commanding presence with everyday practicality.",
          "Low mileage and a comprehensive dealer service history make this an exceptional opportunity for buyers seeking a near-new luxury SUV without the new-car wait.",
        ],
      },
      {
        heading: "Condition & History",
        paragraphs: [
          "Single owner from new. Full BMW service history at authorised dealers. Non-smoker vehicle. No accident history reported. All keys and books included.",
        ],
      },
    ],
    status: VEHICLE_STATUS.FEATURED,
    featured: true,
    listingScore: 94,
    photoScore: 92,
    descriptionScore: 88,
    priceScore: 90,
    demandScore: 96,
    aiRating: "Strong",
    health: "excellent",
    aiMatchScore: 96,
    views: 842,
    enquiries: 14,
    saves: 38,
    daysInStock: 18,
    similarVehicleIds: ALL_SIMILAR,
    purchasePriceCents: 118000000,
    dateAdded: "2026-06-09T08:00:00.000Z",
  }),
  buildRecord({
    id: "inv-2",
    slug: "2023-mercedes-benz-glc-300d-4matic",
    tenantId: "prestige-motors-sandton",
    make: "Mercedes-Benz",
    model: "GLC",
    variant: "300d 4MATIC",
    title: "2023 Mercedes-Benz GLC 300d 4MATIC",
    subtitle: "Executive SUV · AMG Line · Burmester Sound",
    year: 2023,
    mileageKm: 28100,
    mileageDisplay: "28,100 km",
    transmission: "Automatic",
    fuel: "Diesel",
    bodyType: "SUV",
    engine: "2.0L Turbo Diesel",
    colour: "Obsidian Black",
    vin: "WDCXXXXXXX ·•••••••",
    stockNumber: "PMS-GLC-2304",
    sellingPriceCents: 98950000,
    sellingPriceDisplay: "R 989,500",
    financeEstimateDisplay: "Est. R14,200 /mo at 11.5% over 72 months",
    monthlyRepaymentDisplay: "R 14,200",
    location: "Sandton, GP",
    province: "Gauteng",
    dealershipId: "prestige-motors-sandton",
    dealershipName: "Prestige Motors Sandton",
    dealershipSlug: "prestige-motors-sandton",
    branchId: "pms-sandton",
    branchName: "Sandton",
    logoInitials: "PM",
    phone: "+27 11 555 0200",
    whatsapp: "+27 82 555 0200",
    rating: 4.8,
    reviewCount: 96,
    responseTime: "Under 2 hours",
    yearsInBusiness: 18,
    vehiclesInStock: 112,
    galleryPrefix: "merc-glc",
    galleryPositions: ["center 35%", "center 50%", "center 65%", "center 28%", "center 58%", "center 42%", "center 48%"],
    description: [
      {
        paragraphs: [
          "Elegant Mercedes-Benz GLC 300d with 4MATIC all-wheel drive. AMG Line styling, premium interior, and exceptional diesel efficiency for long-distance travel.",
        ],
      },
    ],
    featureCount: 10,
    status: VEHICLE_STATUS.PUBLISHED,
    reducedPrice: true,
    listingScore: 86,
    photoScore: 84,
    descriptionScore: 78,
    priceScore: 82,
    demandScore: 88,
    aiRating: "Strong",
    health: "good",
    aiMatchScore: 92,
    views: 420,
    enquiries: 8,
    saves: 19,
    daysInStock: 32,
    similarVehicleIds: ALL_SIMILAR,
    purchasePriceCents: 92000000,
    dateAdded: "2026-05-26T08:00:00.000Z",
  }),
  buildRecord({
    id: "inv-3",
    slug: "2022-range-rover-sport-dynamic-se",
    tenantId: "summit-luxury-durban",
    make: "Land Rover",
    model: "Range Rover Sport",
    variant: "Dynamic SE",
    title: "2022 Range Rover Sport Dynamic SE",
    subtitle: "Luxury Performance SUV · Meridian Sound · Air Suspension",
    year: 2022,
    mileageKm: 41800,
    mileageDisplay: "41,800 km",
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "SUV",
    engine: "3.0L Turbo Inline-6 MHEV",
    colour: "Santorini Black",
    vin: "SALXXXXXXX ·•••••••",
    stockNumber: "SLD-RRS-2208",
    sellingPriceCents: 169500000,
    sellingPriceDisplay: "R 1,695,000",
    financeEstimateDisplay: "Est. R24,800 /mo at 11.5% over 72 months",
    monthlyRepaymentDisplay: "R 24,800",
    location: "Umhlanga, KZN",
    province: "KwaZulu-Natal",
    dealershipId: "summit-luxury-durban",
    dealershipName: "Summit Luxury Durban",
    dealershipSlug: "summit-luxury-durban",
    branchId: "sld-umhlanga",
    branchName: "Umhlanga",
    logoInitials: "SL",
    phone: "+27 31 555 0300",
    whatsapp: "+27 82 555 0300",
    rating: 4.9,
    reviewCount: 74,
    responseTime: "Under 1 hour",
    yearsInBusiness: 9,
    vehiclesInStock: 46,
    galleryPrefix: "rr-sport",
    galleryPositions: ["center 45%", "center 52%", "center 68%", "center 32%", "center 62%", "center 44%", "center 50%"],
    description: [
      {
        paragraphs: [
          "Range Rover Sport Dynamic SE with commanding road presence, adaptive air suspension, and a refined luxury cabin. Ideal for buyers who demand capability and prestige.",
        ],
      },
    ],
    status: VEHICLE_STATUS.PUBLISHED,
    listingScore: 78,
    photoScore: 80,
    descriptionScore: 76,
    priceScore: 72,
    demandScore: 75,
    aiRating: "Fair",
    health: "good",
    aiMatchScore: 89,
    views: 310,
    enquiries: 5,
    saves: 12,
    daysInStock: 45,
    similarVehicleIds: ALL_SIMILAR,
    purchasePriceCents: 158000000,
    dateAdded: "2026-05-13T08:00:00.000Z",
  }),
  buildRecord({
    id: "inv-4",
    slug: "2024-toyota-hilux-2-8-gd-6-raider",
    tenantId: "northern-bakkie-centre",
    make: "Toyota",
    model: "Hilux",
    variant: "2.8 GD-6 Raider",
    title: "2024 Toyota Hilux 2.8 GD-6 Raider",
    subtitle: "Double Cab · 4×4 · Tow Package",
    year: 2024,
    mileageKm: 8200,
    mileageDisplay: "8,200 km",
    transmission: "Automatic",
    fuel: "Diesel",
    bodyType: "Bakkie",
    engine: "2.8L Turbo Diesel",
    colour: "Glacier White",
    vin: "JTEXXXXXXX ·•••••••",
    stockNumber: "NBC-HLX-2402",
    sellingPriceCents: 74990000,
    sellingPriceDisplay: "R 749,900",
    financeEstimateDisplay: "Est. R10,850 /mo at 11.5% over 72 months",
    monthlyRepaymentDisplay: "R 10,850",
    location: "Pretoria, GP",
    province: "Gauteng",
    dealershipId: "northern-bakkie-centre",
    dealershipName: "Northern Bakkie Centre",
    dealershipSlug: "northern-bakkie-centre",
    branchId: "nbc-pretoria",
    branchName: "Pretoria",
    logoInitials: "NB",
    phone: "+27 12 555 0400",
    whatsapp: "+27 82 555 0400",
    rating: 4.7,
    reviewCount: 203,
    responseTime: "Under 30 minutes",
    yearsInBusiness: 15,
    vehiclesInStock: 156,
    galleryPrefix: "hilux",
    galleryPositions: ["center 38%", "center 48%", "center 62%", "center 30%", "center 55%", "center 40%", "center 46%"],
    description: [
      {
        paragraphs: [
          "Nearly new Toyota Hilux Raider with low mileage, full service history, and proven GD-6 reliability. Built for work and weekend adventures across South Africa.",
        ],
      },
    ],
    featureCount: 8,
    status: VEHICLE_STATUS.FEATURED,
    featured: true,
    listingScore: 91,
    photoScore: 90,
    descriptionScore: 85,
    priceScore: 88,
    demandScore: 92,
    aiRating: "Strong",
    health: "excellent",
    aiMatchScore: 94,
    views: 620,
    enquiries: 11,
    saves: 27,
    daysInStock: 12,
    similarVehicleIds: ALL_SIMILAR,
    purchasePriceCents: 71000000,
    dateAdded: "2026-06-15T08:00:00.000Z",
  }),
  buildRecord({
    id: "inv-5",
    slug: "2023-audi-e-tron-gt-quattro",
    tenantId: "electric-avenue-jhb",
    make: "Audi",
    model: "e-tron GT",
    variant: "quattro",
    title: "2023 Audi e-tron GT quattro",
    subtitle: "Electric Grand Tourer · 800V Architecture · Matrix LED",
    year: 2023,
    mileageKm: 15600,
    mileageDisplay: "15,600 km",
    transmission: "Automatic",
    fuel: "Electric",
    bodyType: "Sedan",
    engine: "Dual Motor EV · 350 kW",
    colour: "Daytona Grey",
    vin: "WAUXXXXXXX ·•••••••",
    stockNumber: "EA-ETG-2306",
    sellingPriceCents: 215000000,
    sellingPriceDisplay: "R 2,150,000",
    financeEstimateDisplay: "Est. R31,400 /mo at 11.5% over 72 months",
    monthlyRepaymentDisplay: "R 31,400",
    location: "Midrand, GP",
    province: "Gauteng",
    dealershipId: "electric-avenue-jhb",
    dealershipName: "Electric Avenue JHB",
    dealershipSlug: "electric-avenue-jhb",
    branchId: "ea-midrand",
    branchName: "Midrand",
    logoInitials: "EA",
    phone: "+27 11 555 0500",
    whatsapp: "+27 82 555 0500",
    rating: 4.9,
    reviewCount: 52,
    responseTime: "Under 1 hour",
    yearsInBusiness: 4,
    vehiclesInStock: 38,
    galleryPrefix: "etron-gt",
    galleryPositions: ["center 42%", "center 54%", "center 66%", "center 34%", "center 58%", "center 46%", "center 50%"],
    description: [
      {
        paragraphs: [
          "Stunning Audi e-tron GT quattro — electric performance with grand touring comfort. Low mileage, verified battery health, and premium specification throughout.",
        ],
      },
    ],
    status: VEHICLE_STATUS.PUBLISHED,
    listingScore: 84,
    photoScore: 86,
    descriptionScore: 82,
    priceScore: 78,
    demandScore: 80,
    aiRating: "Fair",
    health: "good",
    aiMatchScore: 91,
    views: 380,
    enquiries: 6,
    saves: 15,
    daysInStock: 28,
    similarVehicleIds: ALL_SIMILAR,
    aiInsights: COMMON_AI_INSIGHTS.map((i) =>
      i.id === "fuel-economy" ? { ...i, value: "R 850 / month charging (est.)" } : i,
    ),
    purchasePriceCents: 205000000,
    dateAdded: "2026-05-30T08:00:00.000Z",
  }),
  buildRecord({
    id: "inv-6",
    slug: "2021-ford-ranger-3-0-v6-wildtrak",
    tenantId: "coastal-commercial",
    make: "Ford",
    model: "Ranger",
    variant: "3.0 V6 Wildtrak",
    title: "2021 Ford Ranger 3.0 V6 Wildtrak",
    subtitle: "Double Cab · Bi-Turbo V6 · FX4 Off-Road",
    year: 2021,
    mileageKm: 52300,
    mileageDisplay: "52,300 km",
    transmission: "Automatic",
    fuel: "Diesel",
    bodyType: "Bakkie",
    engine: "3.0L Bi-Turbo V6",
    colour: "Sedona Orange",
    vin: "WF0XXXXXXX ·•••••••",
    stockNumber: "CC-RNG-2109",
    sellingPriceCents: 68900000,
    sellingPriceDisplay: "R 689,000",
    financeEstimateDisplay: "Est. R9,980 /mo at 11.5% over 72 months",
    monthlyRepaymentDisplay: "R 9,980",
    location: "Port Elizabeth, EC",
    province: "Eastern Cape",
    dealershipId: "coastal-commercial",
    dealershipName: "Coastal Commercial",
    dealershipSlug: "coastal-commercial",
    branchId: "cc-pe",
    branchName: "Port Elizabeth",
    logoInitials: "CC",
    phone: "+27 41 555 0600",
    whatsapp: "+27 82 555 0600",
    rating: 4.6,
    reviewCount: 89,
    responseTime: "Under 2 hours",
    yearsInBusiness: 11,
    vehiclesInStock: 67,
    galleryPrefix: "ranger",
    galleryPositions: ["center 36%", "center 46%", "center 60%", "center 28%", "center 52%", "center 38%", "center 44%"],
    description: [
      {
        paragraphs: [
          "Ford Ranger Wildtrak with the powerful 3.0L Bi-Turbo V6. FX4 off-road package, tow bar fitted, and full service history. A capable premium bakkie ready for any terrain.",
        ],
      },
    ],
    featureCount: 9,
    status: VEHICLE_STATUS.PUBLISHED,
    listingScore: 58,
    photoScore: 45,
    descriptionScore: 62,
    priceScore: 55,
    demandScore: 48,
    aiRating: "Weak",
    health: "needs-attention",
    aiMatchScore: 87,
    views: 145,
    enquiries: 1,
    saves: 4,
    daysInStock: 52,
    similarVehicleIds: ALL_SIMILAR,
    purchasePriceCents: 65000000,
    dateAdded: "2026-05-06T08:00:00.000Z",
  }),
  buildRecord({
    id: "inv-7",
    slug: "2019-vw-polo-gti",
    tenantId: "atlantic-auto-collective",
    make: "Volkswagen",
    model: "Polo",
    variant: "GTI",
    title: "2019 VW Polo GTI",
    subtitle: "Hot Hatch · DSG · Performance Pack",
    year: 2019,
    mileageKm: 68400,
    mileageDisplay: "68,400 km",
    transmission: "Automatic",
    fuel: "Petrol",
    bodyType: "Hatchback",
    engine: "2.0L Turbo",
    colour: "Pure White",
    vin: "WVWXXXXXXX ·•••••••",
    stockNumber: "AAC-PGT-1903",
    sellingPriceCents: 38990000,
    sellingPriceDisplay: "R 389,900",
    financeEstimateDisplay: "Est. R5,650 /mo",
    monthlyRepaymentDisplay: "R 5,650",
    location: "Cape Town, WC",
    province: "Western Cape",
    dealershipId: "atlantic-auto-collective",
    dealershipName: "Atlantic Auto Collective",
    dealershipSlug: "atlantic-auto-collective",
    branchId: "aac-cpt",
    branchName: "Cape Town",
    logoInitials: "AA",
    phone: "+27 21 555 0100",
    whatsapp: "+27 82 555 0100",
    rating: 4.9,
    reviewCount: 128,
    responseTime: "Under 1 hour",
    yearsInBusiness: 12,
    vehiclesInStock: 84,
    galleryPrefix: "polo-gti",
    galleryPositions: ["center 50%", "center 50%", "center 50%", "center 50%", "center 50%", "center 50%", "center 50%"],
    description: [{ paragraphs: ["2019 VW Polo GTI with DSG transmission. Requires photo refresh and price review."] }],
    featureCount: 6,
    status: VEHICLE_STATUS.PUBLISHED,
    featuredUntil: "2026-06-30T23:59:59.000Z",
    listingScore: 42,
    photoScore: 38,
    descriptionScore: 50,
    priceScore: 40,
    demandScore: 35,
    aiRating: "Critical",
    health: "critical",
    aiMatchScore: 72,
    views: 82,
    enquiries: 0,
    saves: 2,
    daysInStock: 67,
    similarVehicleIds: ["inv-1", "inv-2"],
    publishToMarketplace: false,
    purchasePriceCents: 36000000,
    dateAdded: "2026-04-21T08:00:00.000Z",
  }),
  buildRecord({
    id: "inv-8",
    slug: "2024-isuzu-d-max-3-0-td-ls",
    tenantId: "atlantic-auto-collective",
    make: "Isuzu",
    model: "D-Max",
    variant: "3.0 TD LS",
    title: "2024 Isuzu D-Max 3.0 TD LS",
    subtitle: "Double Cab · 4×4 · Utility",
    year: 2024,
    mileageKm: 4100,
    mileageDisplay: "4,100 km",
    transmission: "Automatic",
    fuel: "Diesel",
    bodyType: "Bakkie",
    engine: "3.0L Turbo Diesel",
    colour: "Silky White Pearl",
    vin: "MPATXXXXXX ·•••••••",
    stockNumber: "DRF-DRAFT-01",
    sellingPriceCents: 62990000,
    sellingPriceDisplay: "R 629,900",
    financeEstimateDisplay: "Est. R9,120 /mo",
    monthlyRepaymentDisplay: "R 9,120",
    location: "Cape Town, WC",
    province: "Western Cape",
    dealershipId: "atlantic-auto-collective",
    dealershipName: "Atlantic Auto Collective",
    dealershipSlug: "atlantic-auto-collective",
    branchId: "aac-cpt",
    branchName: "Cape Town",
    logoInitials: "AA",
    phone: "+27 21 555 0100",
    whatsapp: "+27 82 555 0100",
    rating: 4.9,
    reviewCount: 128,
    responseTime: "Under 1 hour",
    yearsInBusiness: 12,
    vehiclesInStock: 84,
    galleryPrefix: "d-max",
    galleryPositions: ["center 44%", "center 44%", "center 44%", "center 44%", "center 44%", "center 44%", "center 44%"],
    description: [{ paragraphs: ["2024 Isuzu D-Max draft listing — specifications incomplete."] }],
    featureCount: 4,
    status: VEHICLE_STATUS.DRAFT,
    listingScore: 55,
    photoScore: 50,
    descriptionScore: 45,
    priceScore: 58,
    demandScore: 52,
    aiRating: "Weak",
    health: "needs-attention",
    aiMatchScore: 70,
    views: 0,
    enquiries: 0,
    saves: 0,
    daysInStock: 3,
    similarVehicleIds: ["inv-4", "inv-6"],
    publishToMarketplace: false,
    purchasePriceCents: 59000000,
    dateAdded: "2026-06-24T08:00:00.000Z",
  }),
];

export function getShowcaseSeedRecords(): readonly UnifiedVehicleRecord[] {
  return VEHICLE_SHOWCASE_SEED;
}
