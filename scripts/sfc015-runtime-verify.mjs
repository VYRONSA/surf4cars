import { chromium } from "playwright";

const BASE_URL = "http://localhost:3003";
const dealershipId = "dealership-36ab80f2-3057-4831-af89-18ed1403a1bb";
const branchId = "branch-d9a8edf1-d68b-47a5-9fd8-f82e31d0a96f";
const buyerId = `buyer-sfc015-${Date.now()}`;

const unique = Date.now();
const stockNumber = `SFC015-${unique}`;
const vin = `WBA${String(unique).slice(-14)}`;
const registration = `CA${String(unique).slice(-6)}`;

const result = {
  scenarios: {
    createEnquiry: false,
    duplicateEnquiryHandling: false,
    dealerReceivesEnquiry: false,
    assignEnquiry: false,
    respondToEnquiry: false,
    scheduleTestDrive: false,
    financeRequest: false,
    statusProgression: false,
    closeWon: false,
    closeLost: false,
    dashboardUpdates: false,
    dealerIntelligenceUpdates: false,
    buyerStatusSynchronization: false,
    activityTimelineIntegrity: false,
  },
  checks: [],
  details: {},
  errors: [],
};

function pushCheck(name, ok, extra = {}) {
  result.checks.push({ name, ok, ...extra });
}

function buildMedia(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `photo-${index + 1}`,
    kind: "photo",
    name: `photo-${index + 1}.png`,
    previewUrl: "/images/branding/logo.png",
    isPrimary: index === 0,
    uploadProgress: 100,
  }));
}

function buildPublishPayload() {
  return {
    dealershipId,
    branchId,
    draftId: `draft-sfc015-${unique}`,
    publishNow: true,
    payload: {
      identification: {
        stockNumber,
        vin,
        registration,
        make: "BMW",
        model: "X5",
        variant: "xDrive40i",
        year: "2024",
        condition: "used",
      },
      pricing: {
        purchasePrice: "",
        sellingPrice: "1329900",
        retailPrice: "",
        tradePrice: "",
        financeAvailable: true,
        monthlyFinanceEstimate: "",
        tradeInAccepted: false,
      },
      specifications: {
        mileage: "28500",
        transmission: "Automatic",
        fuel: "Petrol",
        engine: "3.0L",
        power: "",
        torque: "",
        driveType: "AWD",
        bodyType: "SUV",
        doors: "5",
        seats: "5",
        colour: "Blue",
      },
      selectedFeatures: ["sunroof", "adaptive-cruise", "wireless-carplay"],
      media: buildMedia(6),
      description: "Dealer enquiry lifecycle verification listing.",
      publishing: {
        mode: "publish-now",
        scheduledDate: "",
        featuredListing: false,
        marketplace: true,
        dealerWebsite: true,
        googleAds: false,
        facebook: false,
        instagram: false,
        whatsapp: false,
        tiktok: false,
        email: false,
      },
      licenceDisc: {
        fileName: "licence.png",
        fileUrl: "/images/branding/logo.png",
        analysisStatus: "complete",
        analysisMessage: "OCR complete",
        extractedRegistration: registration,
        extractedVin: vin,
        extractedExpiryDate: "2027-12-31",
      },
      identificationAi: {
        analysisStatus: "complete",
        analysisMessage: "Identification complete",
        provider: "internal",
      },
      intelligenceReview: {
        status: "complete",
        qualityScore: 92,
        missingInformation: [],
        missingPhotos: [],
        suggestedImprovements: [],
      },
      descriptionBuilder: {
        title: `2024 BMW X5 ${stockNumber}`,
        description: "Premium pre-owned BMW X5 prepared for enquiry lifecycle verification.",
        highlights: ["Verified", "Enquiry ready", "Dealer workflow"],
        seoTitle: `2024 BMW X5 ${stockNumber} for sale`,
        seoDescription: "Dealer enquiry lifecycle verification listing on SURF4CARS.",
        generationStatus: "complete",
        generationMessage: "Complete",
      },
      pricingWorkspace: {
        recommendedPriceCents: 132990000,
        confidence: "high",
        marketPosition: "Market aligned",
        status: "complete",
        statusMessage: "Pricing validated",
      },
      publishResult: {
        status: "idle",
        message: "",
        vehicleId: null,
      },
    },
  };
}

async function setDealerContext(page, context) {
  await context.addCookies([
    { name: "surf4cars-auth-user-type", value: "dealer-owner", url: BASE_URL },
    { name: "surf4cars-active-dealership-id", value: dealershipId, url: BASE_URL },
    { name: "surf4cars-active-branch-id", value: branchId, url: BASE_URL },
  ]);

  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ dealershipId, branchId }) => {
    localStorage.setItem("surf4cars:auth-user-type", "dealer-owner");
    localStorage.setItem("surf4cars:active-dealership-id", dealershipId);
    localStorage.setItem("surf4cars:active-branch-id", branchId);
  }, { dealershipId, branchId });
}

async function setBuyerContext(page, context, activeBuyerId) {
  await context.addCookies([
    { name: "surf4cars-auth-user-type", value: "buyer", url: BASE_URL },
    { name: "surf4cars-active-buyer-id", value: activeBuyerId, url: BASE_URL },
  ]);

  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ activeBuyerId }) => {
    localStorage.setItem("surf4cars:auth-user-type", "buyer");
    localStorage.setItem("surf4cars:active-buyer-id", activeBuyerId);
  }, { activeBuyerId });
}

async function listDealerEnquiries(page) {
  const response = await page.request.get(`${BASE_URL}/api/v1/dealer/leads?dealershipId=${dealershipId}`);
  const body = await response.json().catch(() => null);
  return { response, body, enquiries: body?.enquiries ?? [] };
}

async function getDealerEnquiry(page, enquiryId) {
  const response = await page.request.get(`${BASE_URL}/api/v1/dealer/leads/${enquiryId}?dealershipId=${dealershipId}`);
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function patchDealerEnquiry(page, enquiryId, data) {
  const response = await page.request.patch(`${BASE_URL}/api/v1/dealer/leads/${enquiryId}?dealershipId=${dealershipId}`, {
    data,
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function listBuyerEnquiries(page, activeBuyerId) {
  const response = await page.request.get(`${BASE_URL}/api/v1/buyer/enquiries?buyerId=${activeBuyerId}`);
  const body = await response.json().catch(() => null);
  return { response, body, enquiries: body?.enquiries ?? [] };
}

function dashboardLeadMetric(body) {
  const metric = body?.health?.find((item) => item.id === "enquiries");
  return metric ? Number(String(metric.value).replace(/[^0-9]/g, "") || "0") : 0;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const dealerContext = await browser.newContext();
  const buyerContext = await browser.newContext();
  const dealerPage = await dealerContext.newPage();
  const buyerPage = await buyerContext.newPage();

  try {
    await setDealerContext(dealerPage, dealerContext);
    await setBuyerContext(buyerPage, buyerContext, buyerId);

    const publishResponse = await dealerPage.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: buildPublishPayload(),
    });
    const publishBody = await publishResponse.json().catch(() => null);
    const vehicleId = publishBody?.vehicleId;
    if (!vehicleId) {
      throw new Error("Vehicle publish failed for SFC-015 verification.");
    }

    const beforeDashboard = await dealerPage.request.get(`${BASE_URL}/api/v1/dealer/dashboard?dealershipId=${dealershipId}`);
    const beforeDashboardBody = await beforeDashboard.json().catch(() => null);
    const beforeEnquiriesToday = dashboardLeadMetric(beforeDashboardBody);

    const enquiryPayload = {
      vehicleId,
      dealershipId,
      buyerName: "SFC015 Buyer",
      buyerEmail: "sfc015buyer@example.com",
      buyerPhone: "+27710000000",
      message: "I want more details about this vehicle.",
      enquiryType: "contact",
    };

    const createResponse = await buyerPage.request.post(`${BASE_URL}/api/v1/marketplace/enquiries`, { data: enquiryPayload });
    const createBody = await createResponse.json().catch(() => null);
    const enquiryId = createBody?.enquiry?.id;
    result.scenarios.createEnquiry = createResponse.ok() && Boolean(enquiryId) && createBody?.duplicate === false;
    pushCheck("createEnquiry", result.scenarios.createEnquiry, { status: createResponse.status(), enquiryId, duplicate: createBody?.duplicate ?? null });

    const duplicateResponse = await buyerPage.request.post(`${BASE_URL}/api/v1/marketplace/enquiries`, { data: enquiryPayload });
    const duplicateBody = await duplicateResponse.json().catch(() => null);
    result.scenarios.duplicateEnquiryHandling = duplicateResponse.ok() && duplicateBody?.duplicate === true && duplicateBody?.enquiry?.id === enquiryId;
    pushCheck("duplicateEnquiryHandling", result.scenarios.duplicateEnquiryHandling, { status: duplicateResponse.status(), duplicate: duplicateBody?.duplicate ?? null, enquiryId: duplicateBody?.enquiry?.id ?? null });

    const dealerList = await listDealerEnquiries(dealerPage);
    const dealerEnquiry = dealerList.enquiries.find((item) => item.id === enquiryId) ?? null;
    result.scenarios.dealerReceivesEnquiry = dealerList.response.ok() && dealerEnquiry?.status === "new";
    pushCheck("dealerReceivesEnquiry", result.scenarios.dealerReceivesEnquiry, { status: dealerList.response.status(), leadCount: dealerList.enquiries.length, enquiryStatus: dealerEnquiry?.status ?? null });

    const assign = await patchDealerEnquiry(dealerPage, enquiryId, { type: "assign", assignedToUserId: "dealer-owner-1", assignedToName: "Dealer Owner" });
    result.scenarios.assignEnquiry = assign.response.ok() && assign.body?.status === "assigned";
    pushCheck("assignEnquiry", result.scenarios.assignEnquiry, { status: assign.response.status(), enquiryStatus: assign.body?.status ?? null });

    const respond = await patchDealerEnquiry(dealerPage, enquiryId, { type: "respond", responseMessage: "Thanks, we can assist today." });
    result.scenarios.respondToEnquiry = respond.response.ok() && respond.body?.status === "responded";
    pushCheck("respondToEnquiry", result.scenarios.respondToEnquiry, { status: respond.response.status(), enquiryStatus: respond.body?.status ?? null });

    const followUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const followUp = await patchDealerEnquiry(dealerPage, enquiryId, { type: "follow-up", followUpAt, note: "Follow up tomorrow morning." });
    const testDriveAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const schedule = await patchDealerEnquiry(dealerPage, enquiryId, { type: "schedule-test-drive", scheduledFor: testDriveAt });
    result.scenarios.scheduleTestDrive = schedule.response.ok() && schedule.body?.status === "test-drive-scheduled";
    pushCheck("scheduleTestDrive", result.scenarios.scheduleTestDrive, { status: schedule.response.status(), enquiryStatus: schedule.body?.status ?? null });

    const finance = await patchDealerEnquiry(dealerPage, enquiryId, { type: "finance-request", note: "Finance pack sent." });
    result.scenarios.financeRequest = finance.response.ok() && finance.body?.status === "finance-in-progress";
    pushCheck("financeRequest", result.scenarios.financeRequest, { status: finance.response.status(), enquiryStatus: finance.body?.status ?? null });

    result.scenarios.statusProgression =
      followUp.response.ok() && followUp.body?.status === "follow-up" &&
      schedule.body?.status === "test-drive-scheduled" &&
      finance.body?.status === "finance-in-progress";
    pushCheck("statusProgression", result.scenarios.statusProgression, {
      followUpStatus: followUp.body?.status ?? null,
      scheduleStatus: schedule.body?.status ?? null,
      financeStatus: finance.body?.status ?? null,
    });

    const closeWon = await patchDealerEnquiry(dealerPage, enquiryId, { type: "close-won", note: "Buyer committed to purchase." });
    result.scenarios.closeWon = closeWon.response.ok() && closeWon.body?.status === "closed-won";
    pushCheck("closeWon", result.scenarios.closeWon, { status: closeWon.response.status(), enquiryStatus: closeWon.body?.status ?? null });

    const secondEnquiryPayload = {
      vehicleId,
      dealershipId,
      buyerName: "SFC015 Buyer",
      buyerEmail: "sfc015buyer@example.com",
      buyerPhone: "+27710000000",
      message: "I am no longer interested, but please log this second enquiry path.",
      enquiryType: "finance",
    };
    const secondCreate = await buyerPage.request.post(`${BASE_URL}/api/v1/marketplace/enquiries`, { data: secondEnquiryPayload });
    const secondCreateBody = await secondCreate.json().catch(() => null);
    const secondEnquiryId = secondCreateBody?.enquiry?.id;
    const closeLost = await patchDealerEnquiry(dealerPage, secondEnquiryId, { type: "close-lost", note: "Buyer selected another vehicle." });
    result.scenarios.closeLost = closeLost.response.ok() && closeLost.body?.status === "closed-lost";
    pushCheck("closeLost", result.scenarios.closeLost, { status: closeLost.response.status(), enquiryStatus: closeLost.body?.status ?? null });

    const afterDashboard = await dealerPage.request.get(`${BASE_URL}/api/v1/dealer/dashboard?dealershipId=${dealershipId}`);
    const afterDashboardBody = await afterDashboard.json().catch(() => null);
    const afterEnquiriesToday = dashboardLeadMetric(afterDashboardBody);
    result.scenarios.dashboardUpdates = afterDashboard.ok() && afterEnquiriesToday >= beforeEnquiriesToday + 2;
    pushCheck("dashboardUpdates", result.scenarios.dashboardUpdates, { beforeEnquiriesToday, afterEnquiriesToday });

    const dealerDashboardPage = await dealerContext.newPage();
    await dealerDashboardPage.goto(`${BASE_URL}/dealer/dashboard`, { waitUntil: "domcontentloaded" });
    await dealerDashboardPage.waitForTimeout(1000);
    const dashboardText = await dealerDashboardPage.locator("body").innerText();
    const dashboardInsights = Array.isArray(afterDashboardBody?.aiInsights)
      ? afterDashboardBody.aiInsights.map((item) => String(item.message))
      : [];
    result.scenarios.dealerIntelligenceUpdates =
      /open enquir|follow up|new lead/i.test(dashboardText) ||
      dashboardInsights.some((message) => /open enquir|lead|follow/i.test(message));
    pushCheck("dealerIntelligenceUpdates", result.scenarios.dealerIntelligenceUpdates, {
      containsEnquiryLanguage: /open enquir|follow up|new lead/i.test(dashboardText),
      dashboardInsights,
    });

    const buyerEnquiries = await listBuyerEnquiries(buyerPage, buyerId);
    const buyerStatuses = buyerEnquiries.enquiries.map((item) => item.status);
    result.scenarios.buyerStatusSynchronization =
      buyerEnquiries.response.ok() &&
      buyerStatuses.includes("closed-won") &&
      buyerStatuses.includes("closed-lost");
    pushCheck("buyerStatusSynchronization", result.scenarios.buyerStatusSynchronization, { statuses: buyerStatuses });

    const detail = await getDealerEnquiry(dealerPage, enquiryId);
    const timelineTypes = Array.isArray(detail.body?.timeline) ? detail.body.timeline.map((entry) => entry.type) : [];
    result.scenarios.activityTimelineIntegrity =
      detail.response.ok() &&
      ["created", "assigned", "responded", "follow-up", "test-drive-scheduled", "finance-in-progress", "closed-won"].every((type) => timelineTypes.includes(type));
    pushCheck("activityTimelineIntegrity", result.scenarios.activityTimelineIntegrity, { timelineTypes });

    result.details = {
      vehicleId,
      enquiryId,
      secondEnquiryId,
      beforeEnquiriesToday,
      afterEnquiriesToday,
      buyerStatuses,
      timelineTypes,
    };

    await dealerDashboardPage.close();
  } catch (error) {
    result.errors.push(error instanceof Error ? error.stack ?? error.message : String(error));
  } finally {
    await dealerContext.close();
    await buyerContext.close();
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

await run();
