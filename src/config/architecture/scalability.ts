/**
 * SURF FOR CARS — Scalability & Future Expansion Architecture
 */

export const SCALABILITY_ARCHITECTURE = {
  dataScale: {
    dealerships: {
      target: "100,000+",
      strategy: [
        "Multi-tenant row-level security via Supabase RLS",
        "Dealer-scoped data partitioning by organisation_id",
        "Read replicas for analytics and search workloads",
        "CDN caching for public dealer profiles and media",
      ],
    },
    vehicleListings: {
      target: "Millions",
      strategy: [
        "Dedicated search index (Elasticsearch/Typesense/Meilisearch)",
        "Paginated and cursor-based API responses",
        "Image optimisation pipeline with AVIF/WebP delivery",
        "Lazy loading and incremental static regeneration for public pages",
      ],
    },
    buyers: {
      target: "Millions",
      strategy: [
        "Buyer activity stored in append-only event streams",
        "Separate read models for saved items and recommendations",
        "Rate limiting on API and search endpoints",
        "Edge caching for anonymous marketplace traffic",
      ],
    },
  },
  internationalisation: {
    multiCountry: {
      strategy: [
        "Locale routing: /[locale]/... or subdomain per region",
        "Country-specific vehicle regulations and unit formats",
        "Geo-based dealer and inventory filtering",
        "Regional compliance modules (GDPR, privacy per jurisdiction)",
      ],
    },
    multiLanguage: {
      strategy: [
        "i18n message catalogues in src/locales/",
        "RTL layout support in design system",
        "LocaleProvider at root layout level",
        "SEO hreflang tags per translated route",
      ],
    },
    multiCurrency: {
      strategy: [
        "CurrencyProvider with locale-aware formatting",
        "Base currency storage with display conversion",
        "Exchange rate service abstraction",
        "Price display tokens in design system",
      ],
    },
  },
  mobile: {
    strategy: [
      "Versioned REST API at /api/v1/*",
      "Shared TypeScript types package (future monorepo)",
      "JWT/session token auth compatible with mobile clients",
      "Push notification service via notifications module",
      "Offline-first patterns for saved vehicles and messages",
    ],
  },
  ai: {
    strategy: [
      "AI Studio as isolated service boundary",
      "Async job queue for generation tasks",
      "Usage metering for billing and admin monitoring",
      "Feature flags for gradual AI module rollout",
      "Prompt and model versioning in ai-studio feature",
    ],
  },
  marketplaceApi: {
    strategy: [
      "Public read API for vehicles, dealers, search",
      "Authenticated write API for inventory and CRM",
      "API key authentication with scoped permissions",
      "Webhook events for partner integrations",
      "OpenAPI documentation in developer portal",
    ],
  },
  partnerIntegrations: {
    strategy: [
      "Partner API namespace at /api/v1/partners",
      "OAuth 2.0 for third-party app authorisation",
      "Webhook delivery with retry and dead-letter queues",
      "Sandbox environment for integration testing",
      "Feature flags per partner capability",
    ],
  },
} as const;

export const FUTURE_EXPANSION = {
  recommendedPhases: [
    {
      phase: "1",
      focus: "Public marketplace + dealer inventory + authentication",
      modules: ["marketplace", "vehicle", "dealership", "inventory", "authentication", "search"],
    },
    {
      phase: "2",
      focus: "Buyer portal + CRM + notifications",
      modules: ["buyer-portal", "crm", "notifications"],
    },
    {
      phase: "3",
      focus: "Marketing Studio + Analytics + SEO",
      modules: ["marketing-studio", "analytics", "seo"],
    },
    {
      phase: "4",
      focus: "AI Studio + advanced dealer tools",
      modules: ["ai-studio"],
    },
    {
      phase: "5",
      focus: "Administration + Developer API + mobile",
      modules: ["administration", "developer"],
    },
    {
      phase: "6",
      focus: "International expansion + partner ecosystem",
      modules: ["i18n", "partner-api", "mobile-app"],
    },
  ],
  infrastructureRecommendations: [
    "Supabase for auth, database, and real-time subscriptions",
    "Object storage (S3/R2) for media with CDN",
    "Redis for caching, sessions, and job queues",
    "Dedicated search service decoupled from primary database",
    "Background workers for AI, media processing, and webhooks",
    "Observability stack: logs, metrics, traces per portal",
  ],
  appRouterStrategy: [
    "Route groups per portal: (public), (buyer), (dealer), (admin), (developer), (auth)",
    "Parallel routes for modals and command palette overlays",
    "Intercepting routes for vehicle quick-view on marketplace",
    "Middleware for auth, locale, and permission enforcement",
    "generateMetadata per route for SEO at scale",
  ],
} as const;
