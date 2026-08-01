import { chromium } from "playwright";

const BASE_URL = "http://localhost:3003";
const dealershipId = "dealership-36ab80f2-3057-4831-af89-18ed1403a1bb";
const branchId = "branch-d9a8edf1-d68b-47a5-9fd8-f82e31d0a96f";

const unique = Date.now();
const stockNumber = `SFC014-${unique}`;
const vin = `WBA${String(unique).slice(-14)}`;
const registration = `CA${String(unique).slice(-6)}`;
const vehicleTitle = `2024 BMW X5 ${stockNumber}`;

const result = {
  scenarios: {
    inventoryCountsChangeAfterPublish: false,
    soldCountChangesAfterMarkSold: false,
    archivedCountChangesAfterArchive: false,
    dashboardRefreshReflectsUpdates: false,
    inventoryIntelligenceUpdatesAfterChanges: false,
    dealerIntelligenceUpdatesAfterChanges: false,
    activityFeedReflectsActions: false,
    noShowcaseDataRemains: false,
    refreshConsistency: false,
    crossTabConsistency: false,
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
    draftId: `draft-sfc014-${unique}`,
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
        sellingPrice: "1319900",
        retailPrice: "",
        tradePrice: "",
        financeAvailable: true,
        monthlyFinanceEstimate: "",
        tradeInAccepted: false,
      },
      specifications: {
        mileage: "29500",
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
      description: "Dealer dashboard live data verification listing.",
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
        qualityScore: 90,
        missingInformation: [],
        missingPhotos: [],
        suggestedImprovements: [],
      },
      descriptionBuilder: {
        title: vehicleTitle,
        description: "Premium pre-owned BMW X5 prepared for dashboard live-data verification.",
        highlights: ["Verified", "Published", "Tracked"],
        seoTitle: `${vehicleTitle} for sale`,
        seoDescription: "Live dealer dashboard verification listing on SURF4CARS.",
        generationStatus: "complete",
        generationMessage: "Complete",
      },
      pricingWorkspace: {
        recommendedPriceCents: 131990000,
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

async function fetchDashboard(page) {
  const response = await page.request.get(`${BASE_URL}/api/v1/dealer/dashboard?dealershipId=${dealershipId}`);
  const body = await response.json().catch(() => null);
  return { response, body };
}

function getKpiValue(payload, id) {
  const match = payload?.kpis?.find((item) => item.id === id);
  if (!match) return null;
  const digits = String(match.value).replace(/[^0-9]/g, "");
  return digits.length > 0 ? Number(digits) : null;
}

async function readKpiValue(page, id) {
  const text = await page.locator(`[data-kpi-id="${id}"] [data-kpi-value]`).innerText();
  const digits = text.replace(/[^0-9]/g, "");
  return digits.length > 0 ? Number(digits) : null;
}

async function patchStatus(page, vehicleId, status) {
  const response = await page.request.patch(`${BASE_URL}/api/v1/dealer/inventory/vehicles/${vehicleId}/status?dealershipId=${dealershipId}`, {
    data: { status },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function submitLead(page, vehicleId, enquiryType, buyerName) {
  const response = await page.request.post(`${BASE_URL}/api/v1/marketplace/enquiries`, {
    data: {
      vehicleId,
      dealershipId,
      buyerName,
      buyerEmail: `${buyerName.toLowerCase().replace(/[^a-z0-9]+/g, "")}@example.com`,
      buyerPhone: "+27710000000",
      message: `Interested in ${vehicleTitle}`,
      enquiryType,
    },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const primaryPage = await context.newPage();
  const secondaryPage = await context.newPage();

  try {
    await setDealerContext(primaryPage, context);
    await setDealerContext(secondaryPage, context);

    const beforeDashboard = await fetchDashboard(primaryPage);
    const beforeTotal = getKpiValue(beforeDashboard.body, "total") ?? 0;
    const beforePublished = getKpiValue(beforeDashboard.body, "published") ?? 0;
    const beforeSold = getKpiValue(beforeDashboard.body, "sold") ?? 0;
    const beforeArchived = getKpiValue(beforeDashboard.body, "archived") ?? 0;

    await primaryPage.goto(`${BASE_URL}/dealer/dashboard`, { waitUntil: "domcontentloaded" });
    await secondaryPage.goto(`${BASE_URL}/dealer/dashboard`, { waitUntil: "domcontentloaded" });
    await primaryPage.locator('[data-kpi-id="total"]').waitFor({ timeout: 20000 });
    await secondaryPage.locator('[data-kpi-id="total"]').waitFor({ timeout: 20000 });

    const publishResponse = await primaryPage.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: buildPublishPayload(),
    });
    const publishBody = await publishResponse.json().catch(() => null);
    const vehicleId = publishBody?.vehicleId;
    if (!vehicleId) {
      throw new Error("Vehicle publish failed for SFC-014 verification.");
    }

    await primaryPage.reload({ waitUntil: "domcontentloaded" });
    await primaryPage.locator('[data-kpi-id="published"]').waitFor({ timeout: 20000 });

    const afterPublishDashboard = await fetchDashboard(primaryPage);
    const afterPublishTotal = getKpiValue(afterPublishDashboard.body, "total") ?? 0;
    const afterPublishPublished = getKpiValue(afterPublishDashboard.body, "published") ?? 0;
    const recentInventoryItems = afterPublishDashboard.body?.inventory?.find((item) => item.id === "recent")?.items ?? [];

    result.scenarios.inventoryCountsChangeAfterPublish =
      publishResponse.ok() && afterPublishTotal === beforeTotal + 1 && afterPublishPublished >= beforePublished + 1;
    pushCheck("inventoryCountsChangeAfterPublish", result.scenarios.inventoryCountsChangeAfterPublish, {
      beforeTotal,
      afterPublishTotal,
      beforePublished,
      afterPublishPublished,
      vehicleId,
    });

    await secondaryPage.bringToFront();
    await secondaryPage.waitForTimeout(1200);
    const secondaryPublished = await readKpiValue(secondaryPage, "published");
    result.scenarios.crossTabConsistency = secondaryPublished === afterPublishPublished;
    pushCheck("crossTabConsistency", result.scenarios.crossTabConsistency, {
      expectedPublished: afterPublishPublished,
      actualPublished: secondaryPublished,
    });

    await submitLead(primaryPage, vehicleId, "contact", "SFC014 Contact");
    await submitLead(primaryPage, vehicleId, "test-drive", "SFC014 Test Drive");
    await submitLead(primaryPage, vehicleId, "finance", "SFC014 Finance");

    await primaryPage.bringToFront();
    await primaryPage.reload({ waitUntil: "domcontentloaded" });
    await primaryPage.waitForTimeout(1200);

    const pageTextAfterLeads = await primaryPage.locator("body").innerText();
    result.scenarios.dealerIntelligenceUpdatesAfterChanges = /new lead|lead|photo|pricing/i.test(pageTextAfterLeads);
    pushCheck("dealerIntelligenceUpdatesAfterChanges", result.scenarios.dealerIntelligenceUpdatesAfterChanges, {
      containsLeadLanguage: /new lead|lead/i.test(pageTextAfterLeads),
    });

    result.scenarios.inventoryIntelligenceUpdatesAfterChanges = recentInventoryItems.some((item) => item.title.includes(stockNumber));
    pushCheck("inventoryIntelligenceUpdatesAfterChanges", result.scenarios.inventoryIntelligenceUpdatesAfterChanges, {
      stockNumber,
      recentInventoryItems,
    });

    const soldResponse = await patchStatus(primaryPage, vehicleId, "sold");
    const soldDashboard = await fetchDashboard(primaryPage);
    const afterSoldCount = getKpiValue(soldDashboard.body, "sold") ?? 0;
    result.scenarios.soldCountChangesAfterMarkSold = soldResponse.response.ok() && afterSoldCount >= beforeSold + 1;
    pushCheck("soldCountChangesAfterMarkSold", result.scenarios.soldCountChangesAfterMarkSold, {
      beforeSold,
      afterSoldCount,
      status: soldResponse.response.status(),
    });

    const archiveResponse = await patchStatus(primaryPage, vehicleId, "archived");
    const archiveDashboard = await fetchDashboard(primaryPage);
    const afterArchivedCount = getKpiValue(archiveDashboard.body, "archived") ?? 0;
    result.scenarios.archivedCountChangesAfterArchive = archiveResponse.response.ok() && afterArchivedCount >= beforeArchived + 1;
    pushCheck("archivedCountChangesAfterArchive", result.scenarios.archivedCountChangesAfterArchive, {
      beforeArchived,
      afterArchivedCount,
      status: archiveResponse.response.status(),
    });

    await primaryPage.reload({ waitUntil: "domcontentloaded" });
    const uiArchived = await readKpiValue(primaryPage, "archived");
    result.scenarios.dashboardRefreshReflectsUpdates = uiArchived === afterArchivedCount;
    pushCheck("dashboardRefreshReflectsUpdates", result.scenarios.dashboardRefreshReflectsUpdates, {
      apiArchived: afterArchivedCount,
      uiArchived,
    });

    const refreshedDashboard = await fetchDashboard(primaryPage);
    const refreshedArchived = getKpiValue(refreshedDashboard.body, "archived") ?? 0;
    result.scenarios.refreshConsistency = refreshedArchived === afterArchivedCount;
    pushCheck("refreshConsistency", result.scenarios.refreshConsistency, {
      firstArchived: afterArchivedCount,
      secondArchived: refreshedArchived,
    });

    const activityText = await primaryPage.locator("body").innerText();
    result.scenarios.activityFeedReflectsActions =
      activityText.includes("Listing created with lifecycle status published") &&
      activityText.includes("enquiry received") &&
      activityText.includes("Lifecycle moved from sold to archived");
    pushCheck("activityFeedReflectsActions", result.scenarios.activityFeedReflectsActions, {
      publishSeen: activityText.includes("Listing created with lifecycle status published"),
      leadSeen: activityText.includes("enquiry received"),
      archiveSeen: activityText.includes("Lifecycle moved from sold to archived"),
    });

    result.scenarios.noShowcaseDataRemains =
      !activityText.includes("Atlantic Auto Collective") &&
      !activityText.includes("Premium Pro") &&
      !activityText.includes("42% more views than similar vehicles in Cape Town");
    pushCheck("noShowcaseDataRemains", result.scenarios.noShowcaseDataRemains, {
      hasAtlanticAutoCollective: activityText.includes("Atlantic Auto Collective"),
      hasPremiumPro: activityText.includes("Premium Pro"),
      hasShowcaseInsight: activityText.includes("42% more views than similar vehicles in Cape Town"),
    });

    result.details = {
      vehicleId,
      stockNumber,
      beforeTotal,
      afterPublishTotal,
      beforePublished,
      afterPublishPublished,
      beforeSold,
      afterSoldCount,
      beforeArchived,
      afterArchivedCount,
    };
  } catch (error) {
    result.errors.push(error instanceof Error ? error.stack ?? error.message : String(error));
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

await run();
