import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE_URL = process.env.SURF_BASE_URL || "http://localhost:3003";
const STORE_PATH = "db/local/platform-store.json";

const result = {
  baseUrl: BASE_URL,
  generatedAt: new Date().toISOString(),
  checks: [],
  timings: {},
  outOfScope: [],
  summary: { passed: 0, failed: 0 },
};

function pushCheck(name, ok, details = {}) {
  result.checks.push({ name, ok, ...details });
  if (ok) result.summary.passed += 1;
  else result.summary.failed += 1;
}

async function withCheck(name, callback) {
  const startedAt = Date.now();
  try {
    const details = await callback();
    result.timings[name] = Date.now() - startedAt;
    pushCheck(name, true, details ?? {});
  } catch (error) {
    result.timings[name] = Date.now() - startedAt;
    pushCheck(name, false, { error: error instanceof Error ? error.message : String(error) });
  }
}

async function safeGoto(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
}

const MEDIA_URLS = [
  "/images/branding/logo.png",
  "/images/hero/surf4cars-premium-hero-v3.webp",
  "/images/dashboard/inventory-management-hero.webp",
  "/images/dashboard/dealer-dashboard-hero.webp",
  "/images/dealers/dealer-profile-hero.webp",
  "/images/vehicles/vehicle-details-hero.webp",
];

function resolveDealerships() {
  const store = JSON.parse(readFileSync(STORE_PATH, "utf8"));
  const usable = [];
  for (let index = store.dealerships.length - 1; index >= 0 && usable.length < 2; index -= 1) {
    const dealership = store.dealerships[index];
    const branch = store.branches.find((item) => item.dealershipId === dealership.id);
    if (branch) usable.push({ dealership, branch });
  }
  if (usable.length < 2) {
    throw new Error("Two dealerships with branches are required to verify cross-dealer isolation.");
  }
  return { primary: usable[0], rival: usable[1] };
}

function dealerCookie(dealership, branch) {
  return [
    "surf4cars-auth-user-type=dealer-owner",
    `surf4cars-active-dealership-id=${dealership.id}`,
    `surf4cars-active-branch-id=${branch.id}`,
  ].join("; ");
}

function buildPublishPayload(spec) {
  return {
    identification: {
      stockNumber: spec.stockNumber, vin: spec.vin, registration: spec.registration,
      make: spec.make, model: spec.model, variant: spec.variant,
      year: String(spec.year), condition: "used",
    },
    specifications: {
      mileage: String(spec.mileageKm), colour: spec.colour, fuel: spec.fuel,
      transmission: spec.transmission, engine: spec.engine, bodyType: spec.bodyType,
      power: "", torque: "", driveType: "AWD", doors: "5", seats: "5",
    },
    pricing: {
      sellingPrice: String(spec.price), purchasePrice: String(Math.round(spec.price * 0.9)),
      retailPrice: String(Math.round(spec.price * 1.05)), tradePrice: String(Math.round(spec.price * 0.92)),
      financeAvailable: true, monthlyFinanceEstimate: "R 20,000 / month", tradeInAccepted: true,
    },
    media: Array.from({ length: 6 }, (_, index) => ({
      id: `${spec.stockNumber}-m${index}`, kind: "photo", name: `photo-${index}.png`,
      previewUrl: MEDIA_URLS[index % MEDIA_URLS.length], isPrimary: index === 0,
      uploadProgress: 100, angleTag: "front", fingerprint: `fp-${index}`, width: 1600, height: 900,
    })),
    licenceDisc: {
      fileName: "licence.png", fileUrl: "/images/branding/logo.png",
      analysisStatus: "complete", analysisMessage: "OCR complete",
      extractedRegistration: spec.registration, extractedVin: spec.vin, extractedExpiryDate: "2027-12-31",
    },
    selectedFeatures: ["sunroof", "leather", "carplay"],
    description: `${spec.title} for PCP-001H lead ecosystem verification.`,
    descriptionBuilder: {
      title: spec.title,
      description: `${spec.title} — stock published for PCP-001H lead ecosystem verification.`,
      highlights: ["Verified VIN"], seoTitle: `${spec.title} for sale`,
      seoDescription: `${spec.title} on SURF FOR CARS.`,
      generationStatus: "complete", generationMessage: "Complete",
    },
    identificationAi: { analysisStatus: "complete", analysisMessage: "Complete", provider: "internal" },
    intelligenceReview: { status: "complete", qualityScore: 92, missingInformation: [], missingPhotos: [], suggestedImprovements: [] },
    pricingWorkspace: { recommendedPriceCents: spec.price * 100, confidence: "high", marketPosition: "Market aligned", status: "complete", statusMessage: "Pricing validated" },
    publishing: {
      mode: "publish-now", scheduledDate: "", featuredListing: false, marketplace: true,
      dealerWebsite: true, googleAds: false, facebook: false, instagram: false,
      whatsapp: false, tiktok: false, email: false,
    },
    publishResult: { status: "idle", message: "", vehicleId: null },
  };
}

async function publishVehicle(request, tenant, spec) {
  const response = await request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
    timeout: 60000,
    headers: { cookie: dealerCookie(tenant.dealership, tenant.branch) },
    data: {
      dealershipId: tenant.dealership.id,
      branchId: tenant.branch.id,
      draftId: spec.draftId,
      publishNow: true,
      payload: buildPublishPayload(spec),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok() || !body?.vehicleId) {
    throw new Error(`Publish failed: ${response.status()} ${JSON.stringify(body)}`);
  }
  return body.vehicleId;
}

async function postEnquiry(request, payload) {
  const startedAt = Date.now();
  const response = await request.post(`${BASE_URL}/api/v1/marketplace/enquiries`, { timeout: 45000, data: payload });
  const body = await response.json().catch(() => null);
  return { status: response.status(), ok: response.ok(), body, elapsedMs: Date.now() - startedAt };
}

async function listLeads(request, tenant, statusFilter) {
  const startedAt = Date.now();
  const url = new URL(`${BASE_URL}/api/v1/dealer/leads`);
  url.searchParams.set("dealershipId", tenant.dealership.id);
  if (statusFilter) url.searchParams.set("status", statusFilter);
  const response = await request.get(url.toString(), {
    timeout: 45000,
    headers: { cookie: dealerCookie(tenant.dealership, tenant.branch) },
  });
  const body = await response.json().catch(() => null);
  return { status: response.status(), ok: response.ok(), enquiries: body?.enquiries ?? [], elapsedMs: Date.now() - startedAt };
}

async function leadAction(request, tenant, leadId, action) {
  const startedAt = Date.now();
  const response = await request.patch(
    `${BASE_URL}/api/v1/dealer/leads/${leadId}?dealershipId=${encodeURIComponent(tenant.dealership.id)}`,
    { timeout: 45000, headers: { cookie: dealerCookie(tenant.dealership, tenant.branch) }, data: action },
  );
  const body = await response.json().catch(() => null);
  return { status: response.status(), ok: response.ok(), body, elapsedMs: Date.now() - startedAt };
}

/**
 * The dealer shell resolves its active dealership from localStorage, not just cookies, so a
 * cookie-only session lands back on sign-in. Seed both, exactly as the real onboarding flow does.
 */
async function seedDealerSession(context, page, tenant) {
  await context.addCookies([
    { name: "surf4cars-auth-user-type", value: "dealer-owner", domain: "localhost", path: "/" },
    { name: "surf4cars-active-dealership-id", value: tenant.dealership.id, domain: "localhost", path: "/" },
    { name: "surf4cars-active-branch-id", value: tenant.branch.id, domain: "localhost", path: "/" },
  ]);
  await safeGoto(page, BASE_URL);
  await page.evaluate(({ dealershipId, branchId }) => {
    localStorage.setItem("surf4cars:auth-user-type", "dealer-owner");
    localStorage.setItem("surf4cars:active-dealership-id", dealershipId);
    localStorage.setItem("surf4cars:active-branch-id", branchId);
  }, { dealershipId: tenant.dealership.id, branchId: tenant.branch.id });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const stamp = Date.now();
  const { primary, rival } = resolveDealerships();

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
    const page = await context.newPage();
    const req = page.request;

    const spec = {
      make: "Lexus", model: "NX", variant: "350h", year: 2024,
      price: 1180000, mileageKm: 17000, colour: "Sonic Grey", fuel: "Hybrid",
      transmission: "Automatic", engine: "2.5L", bodyType: "SUV",
      stockNumber: `PCP001H-${stamp}`,
      vin: `PCPH${String(stamp).slice(-11)}0`,
      registration: `CH${String(stamp).slice(-6)}`,
      draftId: `pcp001h-${stamp}`,
      title: `2024 Lexus NX 350h ${stamp}`,
    };

    let vehicleId = null;
    let financeLeadId = null;
    let contactLeadId = null;

    await withCheck("lifecycle-seed-published-vehicle", async () => {
      vehicleId = await publishVehicle(req, primary, spec);
      return { vehicleId };
    });

    await withCheck("finance-enquiry-submission", async () => {
      const enquiry = await postEnquiry(req, {
        dealershipId: primary.dealership.id,
        vehicleId,
        buyerName: "Finance Applicant",
        buyerEmail: `finance.${stamp}@example.com`,
        buyerPhone: "+27821110001",
        message: "Please send me finance options for this vehicle.",
        enquiryType: "finance",
      });
      result.timings.financeSubmitMs = enquiry.elapsedMs;
      if (!enquiry.ok) throw new Error(`Finance enquiry failed: ${enquiry.status} ${JSON.stringify(enquiry.body)}`);
      if (enquiry.body?.enquiry?.enquiryType !== "finance") {
        throw new Error(`Stored as ${enquiry.body?.enquiry?.enquiryType}, expected finance.`);
      }
      if (enquiry.body?.enquiry?.status !== "new") {
        throw new Error(`Finance lead opened in status ${enquiry.body?.enquiry?.status}, expected new.`);
      }
      financeLeadId = enquiry.body.enquiry.id;
      return { leadId: financeLeadId, elapsedMs: enquiry.elapsedMs };
    });

    await withCheck("lead-creation-and-routing", async () => {
      const enquiry = await postEnquiry(req, {
        dealershipId: primary.dealership.id,
        vehicleId,
        buyerName: "Contact Buyer",
        buyerEmail: `contact.${stamp}@example.com`,
        buyerPhone: "+27821110002",
        message: "Is this vehicle still available?",
        enquiryType: "contact",
      });
      if (!enquiry.ok) throw new Error(`Contact enquiry failed: ${enquiry.status}`);
      contactLeadId = enquiry.body.enquiry.id;

      const leads = await listLeads(req, primary);
      result.timings.leadListMs = leads.elapsedMs;
      const ids = leads.enquiries.map((e) => e.id);
      if (!ids.includes(financeLeadId) || !ids.includes(contactLeadId)) {
        throw new Error("Enquiries did not route into the owning dealer's lead queue.");
      }
      const routed = leads.enquiries.find((e) => e.id === financeLeadId);
      if (routed.dealershipId !== primary.dealership.id) throw new Error("Lead routed to the wrong dealership.");
      if (routed.vehicleId !== vehicleId) throw new Error("Lead lost its vehicle reference.");
      return { leadCount: leads.enquiries.length, elapsedMs: leads.elapsedMs };
    });

    await withCheck("lead-ownership-and-dealer-isolation", async () => {
      // Rival dealer must not see, read, or mutate another dealership's lead.
      const rivalList = await listLeads(req, rival);
      if (rivalList.ok && rivalList.enquiries.some((e) => e.id === financeLeadId)) {
        throw new Error("Another dealership can see this dealer's lead in its own queue.");
      }

      const crossRead = await req.get(
        `${BASE_URL}/api/v1/dealer/leads/${financeLeadId}?dealershipId=${encodeURIComponent(primary.dealership.id)}`,
        { timeout: 45000, headers: { cookie: dealerCookie(rival.dealership, rival.branch) } },
      );
      if (crossRead.ok()) throw new Error("Rival dealership read another dealer's lead.");

      const crossWrite = await req.patch(
        `${BASE_URL}/api/v1/dealer/leads/${financeLeadId}?dealershipId=${encodeURIComponent(primary.dealership.id)}`,
        {
          timeout: 45000,
          headers: { cookie: dealerCookie(rival.dealership, rival.branch) },
          data: { type: "respond", responseMessage: "hijack attempt" },
        },
      );
      if (crossWrite.ok()) throw new Error("Rival dealership mutated another dealer's lead.");

      // A dealer-role session that claims no dealership scope must not be trusted with any queue.
      const unscoped = await req.get(
        `${BASE_URL}/api/v1/dealer/leads?dealershipId=${encodeURIComponent(primary.dealership.id)}`,
        { timeout: 45000, headers: { cookie: "surf4cars-auth-user-type=dealer-owner" } },
      );
      if (unscoped.ok()) {
        throw new Error("An unscoped dealer session was granted access to a dealership's leads.");
      }

      return { crossRead: crossRead.status(), crossWrite: crossWrite.status(), unscoped: unscoped.status() };
    });

    await withCheck("permissions-buyer-and-anonymous-denied", async () => {
      const asBuyer = await req.get(
        `${BASE_URL}/api/v1/dealer/leads?dealershipId=${encodeURIComponent(primary.dealership.id)}`,
        { timeout: 45000, headers: { cookie: "surf4cars-auth-user-type=buyer" } },
      );
      if (asBuyer.ok()) throw new Error("Buyer role can read dealer leads.");

      const anonymous = await req.get(
        `${BASE_URL}/api/v1/dealer/leads?dealershipId=${encodeURIComponent(primary.dealership.id)}`,
        { timeout: 45000 },
      );
      if (anonymous.ok()) throw new Error("Anonymous caller can read dealer leads.");

      const opsAsDealer = await req.get(`${BASE_URL}/api/v1/operations/applications-centre`, {
        timeout: 45000,
        headers: { cookie: dealerCookie(primary.dealership, primary.branch) },
      });
      if (opsAsDealer.ok()) throw new Error("Dealer role can read the Operations applications centre.");

      return { buyer: asBuyer.status(), anonymous: anonymous.status(), dealerOnOps: opsAsDealer.status() };
    });

    await withCheck("operations-lead-visibility-is-gated", async () => {
      // Unlike the dealer APIs, Operations authorisation has no local-store fallback: it requires a
      // Supabase-authenticated session even in development. That is the stricter, safer posture, so
      // this check verifies the gate rather than loosening it to obtain a reachable response.
      // End-to-end Operations lead visibility is therefore only verifiable once the Supabase schema
      // is applied, and is deferred to PCP-001I.
      const withOperationsRole = await req.get(`${BASE_URL}/api/v1/operations/applications-centre`, {
        timeout: 60000,
        headers: { cookie: "surf4cars-auth-user-type=operations-director" },
      });
      if (withOperationsRole.ok()) {
        throw new Error("Operations centre served data without a Supabase-authenticated session.");
      }
      if (withOperationsRole.status() !== 401) {
        throw new Error(`Expected 401 from Operations without a session, got ${withOperationsRole.status()}.`);
      }

      // The aggregation the Operations centre reads from must still be wired to the shared lead
      // store — verified here at the data layer, which is what PCP-001I will exercise end to end.
      const store = JSON.parse(readFileSync(STORE_PATH, "utf8"));
      const financeLeadInStore = store.leads.some((lead) => lead.id === financeLeadId);
      if (!financeLeadInStore) {
        throw new Error("Lead is absent from the shared store the Operations centre aggregates.");
      }

      result.outOfScopeNote = "Operations end-to-end lead visibility deferred to PCP-001I (requires Supabase session).";
      return {
        gateStatus: withOperationsRole.status(),
        sharedStoreWired: true,
        endToEndVerification: "deferred-to-PCP-001I",
      };
    });

    await withCheck("lead-lifecycle-transitions", async () => {
      const timings = {};
      const assign = await leadAction(req, primary, financeLeadId, {
        type: "assign", assignedToUserId: "user-pcp001h", assignedToName: "Lead Owner",
      });
      timings.assign = assign.elapsedMs;
      if (!assign.ok || assign.body?.status !== "assigned") {
        throw new Error(`Assign failed: ${assign.status} ${JSON.stringify(assign.body)}`);
      }
      if (assign.body?.assignedToName !== "Lead Owner") throw new Error("Assignment owner not recorded.");

      const respond = await leadAction(req, primary, financeLeadId, {
        type: "respond", responseMessage: "Finance options sent.",
      });
      timings.respond = respond.elapsedMs;
      if (!respond.ok || respond.body?.status !== "responded") throw new Error("Respond transition failed.");

      const finance = await leadAction(req, primary, financeLeadId, {
        type: "finance-request", note: "Application submitted to finance house.",
      });
      timings.finance = finance.elapsedMs;
      if (!finance.ok || finance.body?.status !== "finance-in-progress") {
        throw new Error(`Finance transition failed: ${JSON.stringify(finance.body)}`);
      }

      const followUp = await leadAction(req, primary, financeLeadId, {
        type: "follow-up", followUpAt: new Date(Date.now() + 86400000).toISOString(), note: "Chase approval.",
      });
      timings.followUp = followUp.elapsedMs;
      if (!followUp.ok || followUp.body?.status !== "follow-up") throw new Error("Follow-up transition failed.");

      const closed = await leadAction(req, primary, financeLeadId, { type: "close-won", note: "Vehicle sold." });
      timings.close = closed.elapsedMs;
      if (!closed.ok || closed.body?.status !== "closed-won") throw new Error("Close-won transition failed.");

      result.timings.lifecycleActionsMs = timings;
      return { finalStatus: closed.body.status, timings };
    });

    await withCheck("lead-lifecycle-guards-terminal-state", async () => {
      const reopen = await leadAction(req, primary, financeLeadId, {
        type: "respond", responseMessage: "Trying to reopen a closed lead.",
      });
      if (reopen.ok) throw new Error("A closed-won lead accepted a further transition.");
      const body = reopen.body;
      if (!String(body?.error ?? "").toLowerCase().includes("invalid enquiry transition")) {
        throw new Error(`Unexpected rejection reason: ${JSON.stringify(body)}`);
      }
      return { status: reopen.status, error: body.error };
    });

    await withCheck("lead-timeline-and-audit", async () => {
      const detail = await req.get(
        `${BASE_URL}/api/v1/dealer/leads/${financeLeadId}?dealershipId=${encodeURIComponent(primary.dealership.id)}`,
        { timeout: 45000, headers: { cookie: dealerCookie(primary.dealership, primary.branch) } },
      );
      if (!detail.ok()) throw new Error(`Lead detail failed: ${detail.status()}`);
      const lead = await detail.json();
      const types = (lead.timeline ?? []).map((entry) => entry.type);
      for (const expected of ["created", "assigned", "responded"]) {
        if (!types.includes(expected)) {
          throw new Error(`Timeline missing "${expected}". Present: ${JSON.stringify(types)}`);
        }
      }
      if ((lead.timeline ?? []).length < 5) {
        throw new Error(`Timeline recorded only ${lead.timeline?.length} entries across 5 transitions.`);
      }
      const ordered = [...lead.timeline].every((entry, index, arr) =>
        index === 0 || Date.parse(arr[index - 1].createdAt) <= Date.parse(entry.createdAt));
      if (!ordered) throw new Error("Timeline entries are not chronologically ordered.");

      const store = JSON.parse(readFileSync(STORE_PATH, "utf8"));
      const audit = store.inventoryAudit.filter((entry) =>
        String(entry.payload ?? "").includes(financeLeadId));
      return { timelineEntries: lead.timeline.length, auditEntries: audit.length };
    });

    await withCheck("duplicate-suppression", async () => {
      const payload = {
        dealershipId: primary.dealership.id,
        vehicleId,
        buyerName: "Repeat Enquirer",
        buyerEmail: `repeat.${stamp}@example.com`,
        buyerPhone: "+27821110003",
        message: "Identical enquiry.",
        enquiryType: "contact",
      };
      const first = await postEnquiry(req, payload);
      const second = await postEnquiry(req, payload);
      if (!first.ok || first.body?.duplicate !== false) throw new Error("First enquiry not treated as new.");
      if (!second.ok || second.body?.duplicate !== true) throw new Error("Repeat enquiry not flagged duplicate.");
      if (first.body.enquiry.id !== second.body.enquiry.id) throw new Error("Duplicate created a second lead.");

      // A finance request from the same buyer on the same vehicle is a distinct intent, not a duplicate.
      const financeVariant = await postEnquiry(req, { ...payload, enquiryType: "finance", message: "Finance please." });
      if (!financeVariant.ok || financeVariant.body?.duplicate !== false) {
        throw new Error("A distinct finance request was suppressed as a duplicate of a contact enquiry.");
      }
      return { duplicateSuppressed: true, financeTreatedSeparately: true };
    });

    await withCheck("lead-filtering-and-sorting", async () => {
      const all = await listLeads(req, primary);
      const closed = await listLeads(req, primary, "closed-won");
      result.timings.leadFilterMs = closed.elapsedMs;
      if (!closed.ok) throw new Error(`Status filter failed: ${closed.status}`);
      if (closed.enquiries.some((e) => e.status !== "closed-won")) {
        throw new Error("Status filter returned leads in other statuses.");
      }
      if (!closed.enquiries.some((e) => e.id === financeLeadId)) {
        throw new Error("Status filter omitted the closed lead.");
      }
      if (closed.enquiries.length >= all.enquiries.length) {
        throw new Error("Status filter did not narrow the result set.");
      }

      const ordered = all.enquiries.every((lead, index, arr) =>
        index === 0 || Date.parse(arr[index - 1].lastUpdatedAt) >= Date.parse(lead.lastUpdatedAt));
      if (!ordered) throw new Error("Lead list is not sorted by most recently updated.");

      const repeat = await listLeads(req, primary);
      if (repeat.enquiries.map((e) => e.id).join(",") !== all.enquiries.map((e) => e.id).join(",")) {
        throw new Error("Lead ordering is not deterministic across identical requests.");
      }
      return { total: all.enquiries.length, closedWon: closed.enquiries.length };
    });

    await withCheck("error-handling-invalid-targets", async () => {
      const cases = [];

      const unknownLead = await req.get(
        `${BASE_URL}/api/v1/dealer/leads/pcp001h-no-such-lead?dealershipId=${encodeURIComponent(primary.dealership.id)}`,
        { timeout: 45000, headers: { cookie: dealerCookie(primary.dealership, primary.branch) } },
      );
      cases.push(["unknown lead", unknownLead.ok()]);

      const missingDealership = await req.get(`${BASE_URL}/api/v1/dealer/leads`, {
        timeout: 45000, headers: { cookie: dealerCookie(primary.dealership, primary.branch) },
      });
      cases.push(["missing dealershipId", missingDealership.ok()]);

      const badStatus = await req.get(
        `${BASE_URL}/api/v1/dealer/leads?dealershipId=${encodeURIComponent(primary.dealership.id)}&status=not-a-status`,
        { timeout: 45000, headers: { cookie: dealerCookie(primary.dealership, primary.branch) } },
      );
      cases.push(["invalid status filter", badStatus.ok()]);

      const badAction = await leadAction(req, primary, contactLeadId, { type: "not-a-real-action" });
      cases.push(["invalid action", badAction.ok]);

      const deletedVehicleEnquiry = await postEnquiry(req, {
        dealershipId: primary.dealership.id,
        vehicleId: "pcp001h-no-such-vehicle",
        buyerName: "Ghost", buyerEmail: `ghost.${stamp}@example.com`,
        buyerPhone: "+27821110004", message: "x", enquiryType: "finance",
      });
      cases.push(["finance enquiry on unknown vehicle", deletedVehicleEnquiry.ok]);

      const accepted = cases.filter(([, ok]) => ok).map(([label]) => label);
      if (accepted.length > 0) throw new Error(`Invalid requests accepted: ${accepted.join(", ")}`);
      return { rejectedCases: cases.length };
    });

    await withCheck("archived-vehicle-blocks-new-finance-lead", async () => {
      const archive = await req.patch(
        `${BASE_URL}/api/v1/dealer/inventory/vehicles/${vehicleId}/status?dealershipId=${encodeURIComponent(primary.dealership.id)}`,
        {
          timeout: 45000,
          headers: { cookie: dealerCookie(primary.dealership, primary.branch) },
          data: { status: "archived" },
        },
      );
      if (!archive.ok()) throw new Error(`Archive failed: ${archive.status()}`);

      const late = await postEnquiry(req, {
        dealershipId: primary.dealership.id,
        vehicleId,
        buyerName: "Late Finance",
        buyerEmail: `late.${stamp}@example.com`,
        buyerPhone: "+27821110005",
        message: "Finance please.",
        enquiryType: "finance",
      });
      if (late.ok) throw new Error("Finance enquiry accepted against an archived vehicle.");

      // Existing leads must survive the vehicle being withdrawn.
      const leads = await listLeads(req, primary);
      if (!leads.enquiries.some((e) => e.id === financeLeadId)) {
        throw new Error("Archiving the vehicle removed an existing lead from the dealer's queue.");
      }
      return { blocked: late.status, existingLeadsPreserved: true };
    });

    await withCheck("dealer-dashboard-lead-visibility", async () => {
      await seedDealerSession(context, page, primary);
      const startedAt = Date.now();
      await safeGoto(page, `${BASE_URL}/dealer/dashboard`);
      await page.waitForFunction(() => document.body.innerText.includes("Recent Leads"), { timeout: 60000 });
      result.timings.dashboardLoadMs = Date.now() - startedAt;

      // The heading renders before the rows stream in, so wait for actual lead content.
      await page.waitForFunction(() => {
        const heading = document.querySelector("#dashboard-leads-heading");
        const section = heading ? heading.closest("section") : null;
        return Boolean(section && /Finance Applicant|Contact Buyer|Repeat Enquirer/.test(section.innerText));
      }, { timeout: 30000 }).catch(() => {
        throw new Error("Dashboard Recent Leads widget never showed this sprint's buyers.");
      });

      const widget = await page.evaluate(() => {
        const heading = document.querySelector("#dashboard-leads-heading");
        const section = heading ? heading.closest("section") : null;
        return section ? section.innerText : "";
      });
      if (!widget.includes("Finance Applicant")) {
        throw new Error("Finance lead absent from the dealer's Recent Leads widget.");
      }
      // The widget must be scoped to this dealership only.
      if (widget.includes("SFC015 Buyer")) {
        throw new Error("Dashboard widget leaked another dealership's lead.");
      }
      return { dashboardLoadMs: result.timings.dashboardLoadMs, widgetRows: widget.split("Open").length - 1 };
    });

    for (const [label, viewport, isMobile] of [
      ["desktop-presentation", { width: 1440, height: 1200 }, false],
      ["tablet-presentation", { width: 1024, height: 1366 }, false],
      ["premium-phone-presentation", { width: 390, height: 844 }, true],
    ]) {
      await withCheck(label, async () => {
        const responsiveContext = await browser.newContext({ viewport, isMobile, hasTouch: isMobile });
        try {
          const responsivePage = await responsiveContext.newPage();
          await seedDealerSession(responsiveContext, responsivePage, primary);
          await safeGoto(responsivePage, `${BASE_URL}/dealer/dashboard`);
          await responsivePage.waitForFunction(
            () => document.body.innerText.includes("Recent Leads"),
            { timeout: 60000 },
          );
          const overflow = await responsivePage.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          if (overflow > 2) throw new Error(`Dashboard overflows horizontally by ${overflow}px at ${viewport.width}px.`);
          return { viewport: `${viewport.width}x${viewport.height}`, overflow };
        } finally {
          await responsiveContext.close();
        }
      });
    }

    result.outOfScope = [
      "Insurance — no buyer or dealer insurance enquiry flow exists. 'Insurance' appears only as an Operations partner/revenue category and a dealer staff-role label. Not implemented; not built.",
      "Lead free-text search — the lead API filters by status only. No search index or query parameter exists. Not implemented; not built.",
      "Lead attachments — the lead model has no attachment field (attachments exist only on Operations applications). Not implemented; not built.",
      "Finance affordability capture — the vehicle finance calculator is client-side only (deposit/interest/term) and does not feed the finance enquiry, which carries contact details and message. Not implemented; not built.",
      "Lead notifications — leads are persisted for dealer retrieval; no email/SMS/push dispatch exists. Not implemented; not built.",
      "Dedicated dealer lead-management UI — leads are exposed via API and the dashboard 'Recent Leads' widget; there is no /dealer/leads page. Not implemented; not built.",
    ];

    await context.close();
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
  if (result.summary.failed > 0) {
    process.exitCode = 1;
  }
}

await main();
