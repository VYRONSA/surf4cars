import { chromium } from "playwright";

const BASE_URL = "http://localhost:3003";
const dealershipId = "dealership-36ab80f2-3057-4831-af89-18ed1403a1bb";
const branchId = "branch-d9a8edf1-d68b-47a5-9fd8-f82e31d0a96f";

const unique = Date.now();
const stockNumber = `SFC012-${unique}`;
const vin = `WBA${String(unique).slice(-14)}`;
const registration = `CA${String(unique).slice(-6)}`;

const result = {
  scenarios: {
    missingRequiredFieldsBlocked: false,
    insufficientImagesBlocked: false,
    incompleteAiBlocked: false,
    compliantPublishSucceeded: false,
    retryPublishSucceeded: false,
    duplicatePublishHandled: false,
    singleLiveListing: false,
    qualityScoreConsistent: false,
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

function buildPayload(overrides = {}) {
  const base = {
    dealershipId,
    branchId,
    draftId: `draft-sfc012-${unique}`,
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
        sellingPrice: "1249900",
        retailPrice: "",
        tradePrice: "",
        financeAvailable: true,
        monthlyFinanceEstimate: "",
        tradeInAccepted: false,
      },
      specifications: {
        mileage: "38000",
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
      description: "Well-maintained performance SUV with full service records and premium trim package.",
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
        qualityScore: 88,
        missingInformation: [],
        missingPhotos: [],
        suggestedImprovements: [],
      },
      descriptionBuilder: {
        title: `2024 BMW X5 ${stockNumber}`,
        description: "Premium pre-owned BMW X5 xDrive40i with complete service history and immaculate condition.",
        highlights: ["One owner", "M Sport package", "Adaptive suspension"],
        seoTitle: `2024 BMW X5 ${stockNumber} for sale`,
        seoDescription: "Shop this 2024 BMW X5 xDrive40i with premium spec and verified history on SURF4CARS.",
        generationStatus: "complete",
        generationMessage: "Complete",
      },
      pricingWorkspace: {
        recommendedPriceCents: 124990000,
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

  return {
    ...base,
    ...overrides,
    payload: {
      ...base.payload,
      ...(overrides.payload ?? {}),
    },
  };
}

function toListingQualityInput(publishRequest) {
  const payload = publishRequest.payload;
  return {
    title: payload.descriptionBuilder.title,
    description: payload.descriptionBuilder.description || payload.description,
    seoTitle: payload.descriptionBuilder.seoTitle,
    seoDescription: payload.descriptionBuilder.seoDescription,
    askingPriceCents: Math.round(Number(payload.pricing.sellingPrice || 0) * 100),
    currency: "ZAR",
    vin: payload.identification.vin || payload.licenceDisc.extractedVin,
    registrationNumber: payload.identification.registration || payload.licenceDisc.extractedRegistration,
    mileageKm: Number(payload.specifications.mileage || 0),
    photoCount: payload.media.filter((item) => item.kind === "photo").length,
    hasPrimaryPhoto: payload.media.some((item) => item.kind === "photo" && item.isPrimary),
    serviceHistoryAvailable: false,
  };
}

async function setDealerContext(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ dealershipId, branchId }) => {
    localStorage.setItem("surf4cars:auth-user-type", "dealer-owner");
    localStorage.setItem("surf4cars:active-dealership-id", dealershipId);
    localStorage.setItem("surf4cars:active-branch-id", branchId);
    document.cookie = "surf4cars-auth-user-type=dealer-owner;path=/";
    document.cookie = `surf4cars-active-dealership-id=${dealershipId};path=/`;
    document.cookie = `surf4cars-active-branch-id=${branchId};path=/`;
  }, { dealershipId, branchId });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await setDealerContext(page);

    const missingRequiredRequest = buildPayload({
      draftId: `draft-sfc012-missing-${unique}`,
      payload: {
        identification: {
          stockNumber,
          vin: "",
          registration: "",
          make: "BMW",
          model: "X5",
          variant: "xDrive40i",
          year: "2024",
          condition: "used",
        },
        licenceDisc: {
          fileName: "licence.png",
          fileUrl: "/images/branding/logo.png",
          analysisStatus: "complete",
          analysisMessage: "OCR complete",
          extractedRegistration: "",
          extractedVin: "",
          extractedExpiryDate: "2027-12-31",
        },
      },
    });

    const missingRequiredResponse = await page.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: missingRequiredRequest,
    });
    const missingRequiredBody = await missingRequiredResponse.json().catch(() => null);
    result.scenarios.missingRequiredFieldsBlocked = !missingRequiredResponse.ok();
    pushCheck("missingRequiredFieldsBlocked", result.scenarios.missingRequiredFieldsBlocked, {
      status: missingRequiredResponse.status(),
      message: missingRequiredBody?.error ?? null,
    });

    const insufficientImagesRequest = buildPayload({
      draftId: `draft-sfc012-images-${unique}`,
      payload: {
        media: buildMedia(1),
      },
    });

    const insufficientImagesResponse = await page.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: insufficientImagesRequest,
    });
    const insufficientImagesBody = await insufficientImagesResponse.json().catch(() => null);
    result.scenarios.insufficientImagesBlocked = !insufficientImagesResponse.ok();
    pushCheck("insufficientImagesBlocked", result.scenarios.insufficientImagesBlocked, {
      status: insufficientImagesResponse.status(),
      message: insufficientImagesBody?.error ?? null,
    });

    const incompleteAiRequest = buildPayload({
      draftId: `draft-sfc012-ai-${unique}`,
      payload: {
        intelligenceReview: {
          status: "idle",
          qualityScore: 0,
          missingInformation: [],
          missingPhotos: [],
          suggestedImprovements: [],
        },
        descriptionBuilder: {
          title: `2024 BMW X5 ${stockNumber}`,
          description: "Premium pre-owned BMW X5 xDrive40i with complete service history and immaculate condition.",
          highlights: ["One owner", "M Sport package", "Adaptive suspension"],
          seoTitle: `2024 BMW X5 ${stockNumber} for sale`,
          seoDescription: "Shop this 2024 BMW X5 xDrive40i with premium spec and verified history on SURF4CARS.",
          generationStatus: "idle",
          generationMessage: "Awaiting AI analysis",
        },
      },
    });

    const incompleteAiResponse = await page.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: incompleteAiRequest,
    });
    const incompleteAiBody = await incompleteAiResponse.json().catch(() => null);
    result.scenarios.incompleteAiBlocked = !incompleteAiResponse.ok();
    pushCheck("incompleteAiBlocked", result.scenarios.incompleteAiBlocked, {
      status: incompleteAiResponse.status(),
      message: incompleteAiBody?.error ?? null,
    });

    const compliantRequest = buildPayload();
    const qualityPreResponse = await page.request.post(`${BASE_URL}/api/v1/intelligence/listing-quality`, {
      data: toListingQualityInput(compliantRequest),
    });
    const qualityPreBody = await qualityPreResponse.json().catch(() => null);

    const publishResponse = await page.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: compliantRequest,
    });
    const publishBody = await publishResponse.json().catch(() => null);
    result.scenarios.compliantPublishSucceeded = publishResponse.ok() && Boolean(publishBody?.vehicleId);
    pushCheck("compliantPublishSucceeded", result.scenarios.compliantPublishSucceeded, {
      status: publishResponse.status(),
      vehicleId: publishBody?.vehicleId ?? null,
      qualityScore: publishBody?.qualityScore ?? null,
    });

    const retryResponse = await page.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: compliantRequest,
    });
    const retryBody = await retryResponse.json().catch(() => null);
    result.scenarios.retryPublishSucceeded = retryResponse.ok() && retryBody?.vehicleId === publishBody?.vehicleId;
    pushCheck("retryPublishSucceeded", result.scenarios.retryPublishSucceeded, {
      status: retryResponse.status(),
      sameVehicleId: retryBody?.vehicleId === publishBody?.vehicleId,
    });

    const duplicateResponse = await page.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: compliantRequest,
    });
    const duplicateBody = await duplicateResponse.json().catch(() => null);
    result.scenarios.duplicatePublishHandled = duplicateResponse.ok() && duplicateBody?.vehicleId === publishBody?.vehicleId;
    pushCheck("duplicatePublishHandled", result.scenarios.duplicatePublishHandled, {
      status: duplicateResponse.status(),
      sameVehicleId: duplicateBody?.vehicleId === publishBody?.vehicleId,
    });

    const inventoryResponse = await page.request.get(
      `${BASE_URL}/api/v1/dealer/inventory/vehicles?dealershipId=${dealershipId}`,
    );
    const inventoryBody = await inventoryResponse.json().catch(() => null);
    const vehicles = inventoryBody?.items ?? inventoryBody?.vehicles ?? [];
    const matching = vehicles.filter((item) => (item.stockNumber ?? item.stock_number) === stockNumber);
    result.scenarios.singleLiveListing = matching.length === 1;
    pushCheck("singleLiveListing", result.scenarios.singleLiveListing, { count: matching.length });

    const qualityPostResponse = await page.request.post(`${BASE_URL}/api/v1/intelligence/listing-quality`, {
      data: toListingQualityInput(compliantRequest),
    });
    const qualityPostBody = await qualityPostResponse.json().catch(() => null);

    const preScore = qualityPreBody?.qualityScore ?? null;
    const postScore = qualityPostBody?.qualityScore ?? null;
    const publishScore = publishBody?.qualityScore ?? null;
    const retryScore = retryBody?.qualityScore ?? null;

    result.scenarios.qualityScoreConsistent =
      typeof preScore === "number" &&
      preScore === postScore &&
      preScore === publishScore &&
      preScore === retryScore;

    pushCheck("qualityScoreConsistent", result.scenarios.qualityScoreConsistent, {
      preScore,
      postScore,
      publishScore,
      retryScore,
    });

    result.details = {
      stockNumber,
      vehicleId: publishBody?.vehicleId ?? null,
      preScore,
      postScore,
      publishScore,
      retryScore,
      blockedMessages: {
        missingRequired: missingRequiredBody?.error ?? null,
        insufficientImages: insufficientImagesBody?.error ?? null,
        incompleteAi: incompleteAiBody?.error ?? null,
      },
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
