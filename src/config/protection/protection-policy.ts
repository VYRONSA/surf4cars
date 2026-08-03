/**
 * SURF4CARS — Platform Protection Policy.
 *
 * THE ONE PLACE PROTECTION IS CONFIGURED
 * ======================================
 * Every limit, weight, threshold and exemption the protection layer applies is written here and
 * nowhere else. The engine that reads this file makes no decisions of its own — if a number does not
 * appear below, the platform does not enforce it.
 *
 * That rule exists because of what this layer is. A protection layer is judged by the traffic it
 * refuses, and refusals are invisible until they are somebody's: a dealer publishing forty cars, a
 * buyer opening ten tabs, Googlebot recrawling after a sitemap change. When the numbers behind those
 * refusals are scattered across route handlers, nobody can answer "what would this have done to
 * Googlebot?" without reading the whole codebase — so nobody asks, and the answer is discovered in
 * production. One file makes the question answerable in one screen.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT DO
 * =======================================
 * It does not protect the database. The audit that opened PCP-048 found the entire published
 * inventory retrievable in one anonymous PostgREST request, without the application being involved
 * at all — no proxy, no route handler, no policy below. That is fixed by grants, in
 * `20260815090000_pcp048_revoke_vehicle_identifiers.sql`, and it is worth stating here because this
 * is the file somebody will read when they want to know whether the platform is protected. A limit
 * written here governs the front door. It says nothing about the door beside it.
 */

/* ── Surfaces ─────────────────────────────────────────────────────────────────────────────────── */

/**
 * What a caller is entitled to reach, from the Phase 1 audit of all 64 API routes.
 *
 * Classification is by *entitlement*, not by path shape, because the two disagree in the case that
 * matters: `/api/v1/intelligence/*` looks like an internal namespace and is reachable by anybody.
 */
export type SurfaceClass = "public" | "authenticated" | "operations" | "internal";

export interface Surface {
  readonly id: string;
  readonly label: string;
  readonly class: SurfaceClass;
  /** Matched longest-prefix-first, so `/api/v1/dealer/imports` can differ from `/api/v1/dealer`. */
  readonly pathPrefixes: readonly string[];
  readonly policy: RateLimitPolicyName;
  /**
   * Whether a verified search engine may be exempted from throttling on this surface.
   *
   * True only where indexing is the point. An indexer has no business on a dealer's inventory
   * endpoint, and a rule that exempted one there would be an open door wearing a Googlebot label.
   */
  readonly crawlable: boolean;
}

/* ── Rate limit policies ──────────────────────────────────────────────────────────────────────── */

export interface RateLimitPolicy {
  /** Requests permitted inside the window. */
  readonly limit: number;
  readonly windowMs: number;
  /**
   * What the caller is counted as.
   *
   * `subject` counts a signed-in dealership or buyer, so one dealership's bulk import cannot exhaust
   * the allowance of another behind the same office NAT. `address` counts a network origin and is
   * the only option available before a caller identifies themselves.
   */
  readonly countBy: "subject" | "address";
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * The policies, in one table.
 *
 * The public numbers are deliberately generous. A protection layer's first job is to be wrong in the
 * safe direction: the cost of throttling a real buyer mid-enquiry is a lost sale and an unhappy
 * dealership, while the cost of letting a scraper through for another minute is that the behaviour
 * engine gets more evidence before it acts. Volumetric limits catch the crude; the behaviour engine
 * below is what catches the patient.
 */
export const RATE_LIMIT_POLICIES = {
  /** Browsing the marketplace. Sized so a fast human with many tabs never notices it. */
  browse: { limit: 600, windowMs: 5 * MINUTE, countBy: "address" },
  /** Search is more expensive per request and is the natural enumeration surface. */
  search: { limit: 120, windowMs: 5 * MINUTE, countBy: "address" },
  /** Unauthenticated and writes into dealer CRMs. Tight on purpose. Unchanged from PRP-006. */
  enquiry: { limit: 10, windowMs: 10 * MINUTE, countBy: "address" },
  /** Credential surfaces. Low, because the only caller who needs many attempts is guessing. */
  authentication: { limit: 20, windowMs: 10 * MINUTE, countBy: "address" },
  /** Public read APIs. Mirrors the documented public API allowance. */
  publicApi: { limit: 1_000, windowMs: HOUR, countBy: "address" },
  /** A signed-in buyer. */
  buyerApi: { limit: 5_000, windowMs: HOUR, countBy: "subject" },
  /** A dealership, which may legitimately bulk-import. */
  dealerApi: { limit: 10_000, windowMs: HOUR, countBy: "subject" },
  /**
   * AI. Metered rather than merely limited, because every call costs money and compute — the one
   * surface where the abuse and the bill are the same event.
   */
  intelligence: { limit: 60, windowMs: HOUR, countBy: "subject" },
  /** Staff tooling, behind the operations permission gate already. */
  operations: { limit: 5_000, windowMs: HOUR, countBy: "subject" },
  /** Cron and internal callers, authenticated by shared secret. */
  internal: { limit: 600, windowMs: HOUR, countBy: "address" },
} as const satisfies Record<string, RateLimitPolicy>;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES;

/* ── The surface map ──────────────────────────────────────────────────────────────────────────── */

export const SURFACES: readonly Surface[] = [
  {
    id: "intelligence",
    label: "AI intelligence",
    class: "authenticated",
    pathPrefixes: ["/api/v1/intelligence"],
    policy: "intelligence",
    crawlable: false,
  },
  {
    id: "operations-api",
    label: "Operations API",
    class: "operations",
    pathPrefixes: ["/api/v1/operations"],
    policy: "operations",
    crawlable: false,
  },
  {
    id: "internal-api",
    label: "Internal API",
    class: "internal",
    pathPrefixes: ["/api/v1/internal"],
    policy: "internal",
    crawlable: false,
  },
  {
    id: "dealer-api",
    label: "Dealer API",
    class: "authenticated",
    pathPrefixes: ["/api/v1/dealer"],
    policy: "dealerApi",
    crawlable: false,
  },
  {
    id: "buyer-api",
    label: "Buyer API",
    class: "authenticated",
    pathPrefixes: ["/api/v1/buyer"],
    policy: "buyerApi",
    crawlable: false,
  },
  {
    id: "market-api",
    label: "Market intelligence API",
    class: "authenticated",
    pathPrefixes: ["/api/v1/market"],
    policy: "buyerApi",
    crawlable: false,
  },
  {
    id: "enquiry",
    label: "Marketplace enquiry",
    class: "public",
    pathPrefixes: ["/api/v1/marketplace/enquiries"],
    policy: "enquiry",
    crawlable: false,
  },
  {
    id: "public-api",
    label: "Public API",
    class: "public",
    pathPrefixes: ["/api/v1/marketplace"],
    policy: "publicApi",
    crawlable: false,
  },
  {
    id: "authentication",
    label: "Authentication",
    class: "public",
    pathPrefixes: ["/auth"],
    policy: "authentication",
    /* Sign-in pages are indexable and harmless to index; the limit is on the credential POST. */
    crawlable: true,
  },
  {
    id: "operations-portal",
    label: "Operations portal",
    class: "operations",
    pathPrefixes: ["/operations", "/admin"],
    policy: "operations",
    crawlable: false,
  },
  {
    id: "dealer-portal",
    label: "Dealer portal",
    class: "authenticated",
    pathPrefixes: ["/dealer"],
    policy: "dealerApi",
    crawlable: false,
  },
  {
    id: "buyer-portal",
    label: "Buyer portal",
    class: "authenticated",
    pathPrefixes: ["/buyer"],
    policy: "buyerApi",
    crawlable: false,
  },
  {
    id: "search",
    label: "Marketplace search",
    class: "public",
    pathPrefixes: ["/search"],
    policy: "search",
    crawlable: true,
  },
  {
    id: "marketplace",
    label: "Marketplace pages",
    class: "public",
    pathPrefixes: ["/vehicle", "/dealers"],
    policy: "browse",
    crawlable: true,
  },
] as const;

/**
 * Longest-prefix-first, so a more specific surface always wins.
 *
 * `/api/v1/marketplace/enquiries` and `/api/v1/marketplace` are both declared above, and declaration
 * order is not something a future edit should have to preserve by hand.
 */
export function resolveSurface(pathname: string): Surface | null {
  let best: Surface | null = null;
  let bestLength = -1;

  for (const surface of SURFACES) {
    for (const prefix of surface.pathPrefixes) {
      const matches = pathname === prefix || pathname.startsWith(`${prefix}/`);
      if (matches && prefix.length > bestLength) {
        best = surface;
        bestLength = prefix.length;
      }
    }
  }

  return best;
}

/* ── Verified crawlers ────────────────────────────────────────────────────────────────────────── */

/**
 * Search engines, and how we decide something really is one.
 *
 * A user agent string is supplied by the client and is therefore evidence of nothing — anybody can
 * claim to be Googlebot, and the ones worth stopping always do. The user agent selects a *candidate*
 * policy; `verifyMethod` names what must be true before the exemption is granted.
 *
 * `reverse-dns` is the method Google and Bing both document: resolve the caller's address to a
 * hostname, require it to sit under the operator's domain, then resolve that hostname back and
 * require it to match the original address. A forged user agent fails at the first step.
 *
 * Note what an exemption is and is not. A verified crawler is exempt from *throttling*. It is still
 * counted, still scored and still visible in the Platform Protection dashboard — because "Googlebot
 * is hammering search" is something the Founder should be able to see, even though the answer is
 * never to block it.
 */
export interface CrawlerRule {
  readonly id: string;
  readonly label: string;
  /** Matched case-insensitively against the user agent. */
  readonly userAgentPattern: RegExp;
  readonly verifyMethod: "reverse-dns";
  /** Hostname suffixes the reverse lookup must land on. */
  readonly verifiedHostSuffixes: readonly string[];
}

export const VERIFIED_CRAWLERS: readonly CrawlerRule[] = [
  {
    id: "googlebot",
    label: "Googlebot",
    userAgentPattern: /googlebot|google-inspectiontool|storebot-google/i,
    verifyMethod: "reverse-dns",
    verifiedHostSuffixes: [".googlebot.com", ".google.com", ".googleusercontent.com"],
  },
  {
    id: "bingbot",
    label: "Bingbot",
    userAgentPattern: /bingbot|adidxbot|bingpreview/i,
    verifyMethod: "reverse-dns",
    verifiedHostSuffixes: [".search.msn.com"],
  },
] as const;

/* ── Behaviour signals ────────────────────────────────────────────────────────────────────────── */

/**
 * What raises suspicion, and by how much.
 *
 * Scores accumulate over `BEHAVIOUR_WINDOW_MS` and decay; no single signal is disqualifying, which
 * is the entire design. Every one of these fires on a legitimate visitor sometimes — a buyer opening
 * six tabs from a price comparison looks like rapid enumeration, and a dealer pasting a link into
 * WhatsApp arrives with no referrer. One signal is a coincidence. Four at once, sustained, is a
 * script.
 *
 * The weights are the tuning surface. They are not thresholds: raising `noReferrer` does not block
 * anybody by itself, it only shortens the distance to `observe` for a caller already doing three
 * other suspicious things.
 */
export interface BehaviourSignal {
  readonly id: string;
  readonly label: string;
  readonly weight: number;
  readonly description: string;
}

export const BEHAVIOUR_WINDOW_MS = 10 * MINUTE;

/** Points bled per minute of good behaviour, so a caller can recover without intervention. */
export const BEHAVIOUR_DECAY_PER_MINUTE = 4;

export const BEHAVIOUR_SIGNALS = {
  sequentialVehicles: {
    id: "sequentialVehicles",
    label: "Sequential vehicle requests",
    weight: 12,
    description: "Consecutive vehicle pages in listing order rather than by interest.",
  },
  rapidPagination: {
    id: "rapidPagination",
    label: "Rapid pagination",
    weight: 10,
    description: "Advancing search pages faster than results could be read.",
  },
  deepEnumeration: {
    id: "deepEnumeration",
    label: "Large search enumeration",
    weight: 14,
    description: "Walking the result set beyond any plausible shopping depth.",
  },
  noReferrer: {
    id: "noReferrer",
    label: "No referrer",
    weight: 3,
    description: "Weak on its own — shared links and privacy settings both produce it.",
  },
  impossibleSpeed: {
    id: "impossibleSpeed",
    label: "Impossible browsing speed",
    weight: 18,
    description: "Page-to-page intervals below human reaction time.",
  },
  sustainedRequests: {
    id: "sustainedRequests",
    label: "Continuous requests",
    weight: 8,
    description: "Requests at a constant cadence with no pauses.",
  },
  botSignature: {
    id: "botSignature",
    label: "Known bot signature",
    weight: 15,
    description: "Self-declared automation that is not a verified search engine.",
  },
  headlessSignature: {
    id: "headlessSignature",
    label: "Headless browser signature",
    weight: 10,
    description: "Automation framework fingerprints in the request.",
  },
} as const satisfies Record<string, BehaviourSignal>;

export type BehaviourSignalName = keyof typeof BEHAVIOUR_SIGNALS;

/* ── Progressive defence ──────────────────────────────────────────────────────────────────────── */

/**
 * What a score buys you.
 *
 * Nothing is ever blocked on first contact. The ladder exists so that the expensive, irreversible
 * response — refusing somebody outright — is reached only by a caller who has been given several
 * chances to look human and has declined each time.
 *
 * `slow` is the workhorse and the most under-rated rung. A scraper's economics depend on throughput;
 * adding a second per request makes harvesting the catalogue take a day instead of a minute, at no
 * cost to a human who reads a page for longer than that anyway. It degrades the attack without ever
 * producing the false-positive story that ends with a dealership on the phone.
 */
export type DefenceLevel = "normal" | "observe" | "slow" | "challenge" | "block";

export interface DefenceRung {
  readonly level: DefenceLevel;
  /** Score at or above which this rung applies. */
  readonly fromScore: number;
  /** Artificial delay applied before the response, in milliseconds. */
  readonly delayMs: number;
  readonly description: string;
}

/** The floor. Named rather than indexed so `resolveDefenceLevel` cannot return `undefined`. */
const NORMAL_RUNG: DefenceRung = {
  level: "normal",
  fromScore: 0,
  delayMs: 0,
  description: "Nothing is recorded beyond ordinary request counting.",
};

export const DEFENCE_LADDER: readonly DefenceRung[] = [
  NORMAL_RUNG,
  {
    level: "observe",
    fromScore: 30,
    delayMs: 0,
    description: "Scored and surfaced in the dashboard. The caller notices nothing.",
  },
  {
    level: "slow",
    fromScore: 60,
    delayMs: 1_200,
    description: "Responses delayed. Ruins throughput, invisible to a reader.",
  },
  {
    level: "challenge",
    fromScore: 85,
    delayMs: 2_500,
    description: "Proof of work or interactive challenge before the response.",
  },
  {
    level: "block",
    fromScore: 110,
    delayMs: 0,
    description: "Refused with 429. Reserved for sustained, unambiguous abuse.",
  },
] as const;

export function resolveDefenceLevel(score: number): DefenceRung {
  let current = NORMAL_RUNG;
  for (const rung of DEFENCE_LADDER) {
    if (score >= rung.fromScore) current = rung;
  }
  return current;
}

/* ── Search protection ────────────────────────────────────────────────────────────────────────── */

/**
 * Bounds on the search surface.
 *
 * `maxResultWindow` is the one that actually prevents harvesting: paging is capped by *depth*, not
 * by rate, so no amount of patience walks the whole catalogue through this endpoint. The number is
 * chosen against buyer behaviour rather than against attacker behaviour — a shopper who has looked
 * at five hundred cars in one search has told us the search was wrong, and the answer they need is a
 * filter, not page fifty-one.
 */
export const SEARCH_LIMITS = {
  maxPageSize: 48,
  defaultPageSize: 24,
  maxPage: 50,
  maxResultWindow: 500,
  /** Facet-heavy queries cost more; counted separately so one cannot mask the other. */
  expensiveFacetCount: 6,
} as const;

/* ── Retention ────────────────────────────────────────────────────────────────────────────────── */

/**
 * How long protection telemetry is kept.
 *
 * Short by design. This layer counts behaviour, and a durable record of who visited what is personal
 * information under POPIA that the platform gains nothing from holding — the same reasoning that
 * made `postgres-rate-limit-store` hash its keys before storing them. Long enough to investigate an
 * incident, not long enough to become one.
 */
export const RETENTION = {
  behaviourScoreHours: 24,
  rateLimitEventDays: 7,
  aggregatedMetricsDays: 90,
} as const;
