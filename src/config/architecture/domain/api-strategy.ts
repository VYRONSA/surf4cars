/**
 * SURF FOR CARS — API Strategy
 *
 * Multi-surface API architecture for web, mobile, and partners.
 */

export const API_SURFACES = {
  publicApi: {
    id: "public",
    label: "Public API",
    basePath: "/api/v1/public",
    authentication: "none | api-key (rate-limited)",
    audience: "Marketplace consumers, SEO crawlers, public integrations",
    endpoints: [
      "GET /vehicles — search and list vehicles",
      "GET /vehicles/:id — vehicle detail",
      "GET /dealers — list dealers",
      "GET /dealers/:slug — dealer profile",
      "GET /search — vehicle search with filters",
      "GET /collections — lifestyle collections",
      "GET /content/articles — buying guides and news",
    ],
    rateLimit: "1000 req/hour per IP",
    versioning: "URL path versioning (/api/v1/)",
  },
  dealerApi: {
    id: "dealer",
    label: "Dealer API",
    basePath: "/api/v1/dealer",
    authentication: "Bearer token (dealer user session) | API key",
    audience: "Dealer Command Centre, dealer integrations, DMS feeds",
    endpoints: [
      "CRUD /inventory — vehicle inventory management",
      "CRUD /leads — lead management",
      "GET /analytics — dealer analytics",
      "POST /media — media upload",
      "GET /crm — CRM records",
      "POST /marketing/campaigns — campaign management",
      "POST /ai/jobs — trigger AI operations",
    ],
    rateLimit: "10,000 req/hour per dealership",
    tenancy: "Scoped by dealership_id from auth token",
  },
  buyerApi: {
    id: "buyer",
    label: "Buyer API",
    basePath: "/api/v1/buyer",
    authentication: "Bearer token (buyer session)",
    audience: "Buyer portal, future mobile app",
    endpoints: [
      "GET /saved — saved vehicles",
      "POST /saved — save vehicle",
      "GET /searches — saved searches",
      "GET /messages — dealer conversations",
      "POST /messages — send message",
      "GET /alerts — price alerts",
      "GET /activity — activity history",
    ],
    rateLimit: "5,000 req/hour per user",
    mobileSupported: true,
  },
  partnerApi: {
    id: "partner",
    label: "Partner API",
    basePath: "/api/v1/partners",
    authentication: "OAuth 2.0 client credentials | API key with partner scope",
    audience: "Third-party integrations, DMS systems, finance partners",
    endpoints: [
      "POST /inventory/sync — bulk inventory sync",
      "POST /leads/webhook — lead delivery",
      "GET /vehicles/export — vehicle data export",
      "POST /webhooks/subscribe — webhook registration",
    ],
    rateLimit: "Configurable per partner agreement",
    versioning: "Partner API versioned independently (/api/partners/v1/)",
  },
  developerApi: {
    id: "developer",
    label: "Developer API",
    basePath: "/api/v1/developer",
    authentication: "API key with developer scope",
    audience: "Developer portal, internal tooling",
    endpoints: [
      "CRUD /api-keys — key management",
      "CRUD /webhooks — webhook configuration",
      "GET /logs — API usage logs",
      "GET /usage — usage statistics",
    ],
    rateLimit: "Per key configuration",
  },
  adminApi: {
    id: "admin",
    label: "Admin API",
    basePath: "/api/v1/admin",
    authentication: "Bearer token (platform admin) + MFA",
    audience: "Administration portal, internal operations",
    endpoints: [
      "CRUD /dealers — dealer management",
      "CRUD /users — user management",
      "GET /audit — audit logs",
      "POST /moderation — moderation actions",
      "GET /health — platform health",
    ],
    rateLimit: "Internal — no public limit",
  },
  mobileApi: {
    id: "mobile",
    label: "Mobile API",
    basePath: "/api/v1/mobile",
    authentication: "Bearer token + device registration",
    audience: "Future iOS and Android applications",
    endpoints: [
      "Composes buyer + public endpoints optimised for mobile",
      "Push notification registration",
      "Offline sync endpoints for saved vehicles",
    ],
    notes: [
      "Thin wrapper over buyer and public APIs",
      "Shared TypeScript types package for mobile SDK",
      "GraphQL consideration for Phase 2 mobile",
    ],
  },
} as const;

export const WEBHOOK_SYSTEM = {
  delivery: {
    protocol: "HTTPS POST with JSON payload",
    signature: "HMAC-SHA256 signature in X-SFC-Signature header",
    retry: "Exponential backoff — 3 attempts over 24 hours",
    deadLetter: "Failed deliveries stored in WebhookDelivery entity",
  },
  eventTypes: [
    "vehicle.published",
    "vehicle.updated",
    "vehicle.sold",
    "vehicle.delisted",
    "lead.created",
    "lead.updated",
    "lead.won",
    "campaign.published",
    "media.uploaded",
    "ai.completed",
    "subscription.changed",
    "dealer.registered",
    "user.invited",
    "branch.created",
    "notification.sent",
  ],
  versioning: "Event schema versioned — webhook payload includes schema_version",
} as const;

export const API_AUTH_STRATEGY = {
  methods: {
    sessionToken: "JWT for web portal sessions — short-lived access + refresh token",
    apiKey: "Long-lived API keys for server-to-server — scoped permissions",
    oauth: "OAuth 2.0 for partner integrations — authorization code + client credentials",
    mfa: "Required for platform admin and billing operations",
  },
  tokenClaims: [
    "sub (user_id)",
    "dealership_id",
    "branch_id (optional)",
    "roles[]",
    "permissions[]",
    "locale",
    "currency",
  ],
  rateLimiting: {
    strategy: "Token bucket per API key / user / IP",
    storage: "Redis",
    headers: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
  },
} as const;
