import { UNPRESENTABLE_VEHICLE_PHOTOGRAPHY } from "@/config/media";
import { loadEditorial } from "@/services/editorial/editorial.service";
import { loadIntegrityFlags, loadMediaReviews, loadVehicleReviews } from "@/services/media-review";
import { classifySegment, buildPriceContext, rankByAspiration, HOMEPAGE_SEGMENTS } from "@/services/presentation";
import { getVehicleEngine } from "@/services/vehicle-engine";
import { toShowcaseVehicleListing } from "@/services/vehicle-engine/vehicle-projection.service";
import { createDomainServerClient } from "@/lib/supabase/service-client";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("founder-dashboard");

/**
 * SURF4CARS — the Founder's morning control panel.
 *
 * ONE ENGINE, ONE ANSWER
 * ======================
 * Every number here is read from the service that already owns it: stock from the vehicle engine,
 * approvals from the review service, curation from the editorial service. Nothing is recounted with
 * a second query, because a dashboard that computes its own version of a number is how two screens
 * come to disagree about the same fact — and this codebase has paid for that three times, most
 * recently a fortnight ago when a second `cover_image_url` column was added beside the
 * `cover_data_url` that already existed. That duplicate was found *by building this page*, because a
 * dashboard has to ask "how many dealerships are missing a cover" and there were two possible
 * answers.
 *
 * WHY THE TWO SCORES ARE CHECKLISTS AND NOT WEIGHTINGS
 * ====================================================
 * A weighted score is a number nobody can argue with and nobody can act on. "Homepage health: 68%"
 * says nothing about what to do, and the weights are invented — which makes it exactly the kind of
 * confident fabrication this platform refuses everywhere else.
 *
 * So both scores are "n of m named conditions met", every condition is listed with its real figure,
 * and each one is a thing somebody can go and fix. A condition that cannot be checked from here
 * counts as *not met* rather than being quietly excluded, because a launch score that assumes the
 * unverifiable is fine is worse than no score.
 */

export interface DashboardMetric {
  readonly label: string;
  readonly value: number;
  /** Context a bare number cannot carry — "of 229", "all demonstration". */
  readonly note?: string;
  /** Where to go and do something about it. */
  readonly href?: string;
  /** True when this number is a queue that wants clearing rather than a fact. */
  readonly actionable?: boolean;
}

export interface ScoreCondition {
  readonly label: string;
  readonly met: boolean;
  readonly detail: string;
  /** Set where the condition cannot be checked from inside the application. */
  readonly unverifiable?: boolean;
  readonly href?: string;
}

export interface DashboardScore {
  readonly met: number;
  readonly total: number;
  readonly conditions: readonly ScoreCondition[];
}

export interface FounderDashboard {
  readonly marketplace: readonly DashboardMetric[];
  readonly photography: readonly DashboardMetric[];
  readonly dealerships: readonly DashboardMetric[];
  readonly enquiries: readonly DashboardMetric[];
  readonly homepageHealth: DashboardScore;
  readonly launchReadiness: DashboardScore;
  /** Sources that could not be read, named rather than silently zeroed. */
  readonly unavailable: readonly string[];
}

export async function loadFounderDashboard(): Promise<FounderDashboard> {
  const unavailable: string[] = [];
  const supabase = createDomainServerClient();

  const engine = getVehicleEngine();
  const published = await engine.listPublishable().catch((error) => {
    log.error("stock read failed", { message: String(error) });
    unavailable.push("vehicle stock");
    return [];
  });

  const [reviews, vehicleReviews, flags, editorial] = await Promise.all([
    loadMediaReviews(),
    loadVehicleReviews(),
    loadIntegrityFlags(),
    loadEditorial({ publishedOnly: false }),
  ]);

  const listings = published.map(toShowcaseVehicleListing);

  /* ── Photography ────────────────────────────────────────────────────────────────────────────── */

  const approvedPhotographs = [...reviews.all.values()].filter(
    (review) => review.state === "approved_homepage",
  );

  /*
    "Approved homepage vehicles" is not the same as "approved photographs". One frame serves many
    listings in this library, so a single approval can light up a dozen cars — and the Founder's
    question is how many *vehicles* are eligible to appear.
  */
  const approvedVehicles = listings.filter(
    (listing) => listing.imageSrc && reviews.approvedForHomepage.has(listing.imageSrc),
  ).length;

  const awaitingReview = published.filter((record) => !vehicleReviews.has(record.id)).length;

  /* ── Dealerships ────────────────────────────────────────────────────────────────────────────── */

  let dealerRows: {
    id: string;
    logo_data_url: string | null;
    cover_data_url: string | null;
    cover_image_provenance: string | null;
    telephone: string | null;
    email: string | null;
    is_demonstration: boolean | null;
  }[] = [];

  if (supabase) {
    const { data, error } = await supabase
      .from("dealerships")
      .select("id,logo_data_url,cover_data_url,cover_image_provenance,telephone,email,is_demonstration");
    if (error) {
      log.error("dealership read failed", { message: error.message });
      unavailable.push("dealerships");
    } else {
      dealerRows = data ?? [];
    }
  } else {
    unavailable.push("dealerships");
  }

  const demonstrationDealers = dealerRows.filter((row) => row.is_demonstration === true).length;
  const withoutLogo = dealerRows.filter((row) => !row.logo_data_url?.trim()).length;
  /* Provenance, not the filename — see `publishableCover` in the homepage loader for why. */
  const withoutCover = dealerRows.filter(
    (row) =>
      !row.cover_data_url?.trim()
      || !["dealer", "surf4cars-verified"].includes(row.cover_image_provenance ?? ""),
  ).length;
  const withoutContact = dealerRows.filter(
    (row) => !row.telephone?.trim() && !row.email?.trim(),
  ).length;

  /* ── Enquiries ──────────────────────────────────────────────────────────────────────────────── */

  let newToday = 0;
  let unread = 0;

  if (supabase) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayResult, unreadResult] = await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay.toISOString()),
      /* "Unread" is `status = 'new'`: a lead nobody has picked up. The table has eight statuses and
         no read flag, so this is the closest honest reading rather than an invented one. */
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);

    if (todayResult.error || unreadResult.error) unavailable.push("enquiries");
    newToday = todayResult.count ?? 0;
    unread = unreadResult.count ?? 0;
  } else {
    unavailable.push("enquiries");
  }

  /* ── Editorial ──────────────────────────────────────────────────────────────────────────────── */

  const pendingPlacements = editorial.value.flatMap((entry) =>
    entry.placements.filter((placement) => !placement.published || !entry.slot.published),
  ).length;

  /* ── Homepage health ────────────────────────────────────────────────────────────────────────── */

  /*
    Defined as: how many of the six merchandising bands could be dressed right now.

    Chosen because it is the question the shop window actually poses — a homepage with two of six
    bands filled is a different business from one with six — and because every part of it is
    countable. No weights, and nothing that improves because a number moved somewhere else.
  */
  const prices = buildPriceContext(published.map((record) => record.pricing.sellingPriceCents));
  const approvedListings = listings.filter(
    (listing) => listing.imageSrc && reviews.approvedForHomepage.has(listing.imageSrc),
  );
  const rankedApproved = rankByAspiration(approvedListings, prices);
  const fillableSegments = new Set(
    rankedApproved
      .map((entry) => classifySegment(entry.vehicle, entry.verdict))
      .filter((segment): segment is NonNullable<typeof segment> => Boolean(segment)),
  );

  const spotlightPublished = editorial.value.some(
    (entry) =>
      entry.slot.kind === "dealer-spotlight"
      && entry.slot.published
      && entry.placements.some((placement) => placement.published),
  );

  const flaggedApprovals = approvedPhotographs.filter((review) =>
    flags.some((flag) => flag.photograph === review.photograph),
  ).length;

  const homepageConditions: ScoreCondition[] = [
    ...HOMEPAGE_SEGMENTS.map((segment) => ({
      label: segment.headline,
      met: fillableSegments.has(segment.segment),
      detail: fillableSegments.has(segment.segment)
        ? "can be filled with approved photography"
        : "no approved photograph fits this band",
      href: "/operations/photography",
    })),
    {
      label: "Dealer Spotlight published",
      met: spotlightPublished,
      detail: spotlightPublished ? "a dealership is approved" : "no approved placement",
      href: "/operations/editorial",
    },
    {
      label: "No approved photograph carries an open flag",
      met: flaggedApprovals === 0,
      detail:
        flaggedApprovals === 0
          ? "nothing approved is flagged"
          : `${flaggedApprovals} approved ${flaggedApprovals === 1 ? "photograph is" : "photographs are"} flagged`,
      href: "/operations/photography",
    },
  ];

  /* ── Launch readiness ───────────────────────────────────────────────────────────────────────── */

  /*
    The six launch blockers from `docs/reports/pcp043-launch-readiness.md`, checked where they can be
    and marked unverifiable where they cannot. An unverifiable condition counts as *not met*: a score
    that assumes the parts it cannot see are fine is the kind of confident fabrication this platform
    refuses everywhere else.
  */
  const rejectedInDatabase = [...reviews.all.values()].filter((review) => review.state === "rejected");
  const rejectionDrift = rejectedInDatabase.filter(
    (review) => !UNPRESENTABLE_VEHICLE_PHOTOGRAPHY.has(review.photograph),
  ).length;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  const appUrlSet = appUrl.length > 0 && !appUrl.includes("localhost");
  const mailConfigured = Boolean(
    process.env.RESEND_API_KEY?.trim()
      || process.env.SMTP_HOST?.trim()
      || process.env.POSTMARK_SERVER_TOKEN?.trim(),
  );
  const cronConfigured = Boolean(process.env.CRON_SECRET?.trim());
  const realDealers = dealerRows.length - demonstrationDealers;
  const contactableRealDealers = dealerRows.filter(
    (row) => row.is_demonstration !== true && (row.telephone?.trim() || row.email?.trim()),
  ).length;

  const launchConditions: ScoreCondition[] = [
    {
      label: "Photographs approved for the homepage",
      met: approvedVehicles > 0,
      detail:
        approvedVehicles > 0
          ? `${approvedVehicles} vehicles eligible`
          : "the shop window is dark until something is approved",
      href: "/operations/photography",
    },
    {
      label: "Every rejection also blocks search",
      met: rejectionDrift === 0,
      detail:
        rejectionDrift === 0
          ? `${rejectedInDatabase.length} rejections, all enforced on search`
          : `${rejectionDrift} rejected in the console and still served on search`,
      href: "/operations/photography",
    },
    {
      label: "Email provider configured",
      met: mailConfigured,
      detail: mailConfigured ? "a provider key is present" : "no provider key in the environment",
    },
    {
      label: "Production URL configured",
      met: appUrlSet,
      detail: appUrlSet ? appUrl : "NEXT_PUBLIC_APP_URL is unset or points at localhost",
    },
    {
      label: "Scheduler secret configured",
      met: cronConfigured,
      detail: cronConfigured ? "CRON_SECRET is present" : "no scheduler secret in the environment",
    },
    {
      label: "Real dealerships are contactable",
      met: realDealers > 0 && contactableRealDealers === realDealers,
      detail:
        realDealers === 0
          ? "no non-demonstration dealerships yet"
          : `${contactableRealDealers} of ${realDealers} have a telephone or an email address`,
      href: "/operations/dealer-management",
    },
    {
      label: "Verified sending domain",
      met: false,
      unverifiable: true,
      detail: "cannot be checked from inside the application",
    },
  ];

  const score = (conditions: readonly ScoreCondition[]): DashboardScore => ({
    met: conditions.filter((condition) => condition.met).length,
    total: conditions.length,
    conditions,
  });

  return {
    marketplace: [
      { label: "Vehicles published", value: published.length },
      {
        label: "Dealerships",
        value: dealerRows.length,
        note: demonstrationDealers > 0 ? `${demonstrationDealers} demonstration` : undefined,
      },
      {
        label: "Pending editorial approvals",
        value: pendingPlacements,
        href: "/operations/editorial",
        actionable: pendingPlacements > 0,
      },
    ],
    photography: [
      {
        label: "Vehicles approved for the homepage",
        value: approvedVehicles,
        note: `${approvedPhotographs.length} photographs`,
        href: "/operations/photography",
      },
      {
        label: "Vehicles awaiting review",
        value: awaitingReview,
        note: `of ${published.length}`,
        href: "/operations/photography",
        actionable: awaitingReview > 0,
      },
      {
        label: "Open integrity flags",
        value: flags.length,
        href: "/operations/photography",
        actionable: flags.length > 0,
      },
    ],
    dealerships: [
      {
        label: "Without a logo",
        value: withoutLogo,
        note: `of ${dealerRows.length}`,
        actionable: withoutLogo > 0,
      },
      {
        label: "Without a cover photograph",
        value: withoutCover,
        note: `of ${dealerRows.length}`,
        actionable: withoutCover > 0,
      },
      {
        label: "Without contact details",
        value: withoutContact,
        note: `of ${dealerRows.length}`,
        actionable: withoutContact > 0,
      },
    ],
    enquiries: [
      { label: "New today", value: newToday },
      { label: "Unassigned", value: unread, actionable: unread > 0 },
    ],
    homepageHealth: score(homepageConditions),
    launchReadiness: score(launchConditions),
    unavailable,
  };
}
