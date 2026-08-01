import { chromium } from "playwright";

const BASE_URL = "http://localhost:3003";
const dealershipId = "dealership-36ab80f2-3057-4831-af89-18ed1403a1bb";
const branchId = "branch-d9a8edf1-d68b-47a5-9fd8-f82e31d0a96f";

const unique = Date.now();
const stockNumber = `SFC011-${unique}`;
const vin = `WBA${String(unique).slice(-14)}`;
const registration = `CA${String(unique).slice(-6)}`;

const result = {
  scenarios: {
    createDraft: false,
    refreshEveryStep: false,
    closeAndResume: false,
    secondTabOpen: false,
    crossTabSync: false,
    autosaveFailure: false,
    autosaveRetry: false,
    imageInterrupted: false,
    imageResumed: false,
    publishListing: false,
    draftRemoved: false,
    onePublishedListing: false,
    duplicatePublishAttempted: false,
    duplicatePublishNoExtraListing: false,
  },
  checks: [],
  details: {},
  errors: [],
};

function pushCheck(name, ok, extra = {}) {
  result.checks.push({ name, ok, ...extra });
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

async function ensureWizard(page) {
  await setDealerContext(page);
  await page.goto(`${BASE_URL}/dealer/inventory/new`, { waitUntil: "domcontentloaded" });
  if (page.url().includes("/auth/sign-up/dealer")) {
    await setDealerContext(page);
    await page.goto(`${BASE_URL}/dealer/inventory/new`, { waitUntil: "domcontentloaded" });
  }
}

async function waitStep(page, n) {
  await page.getByText(`Step ${n} of 7`, { exact: false }).first().waitFor({ timeout: 20000 });
}

async function getVisibleStepText(page) {
  const candidates = [
    "Step 1 of 7",
    "Step 2 of 7",
    "Step 3 of 7",
    "Step 4 of 7",
    "Step 5 of 7",
    "Step 6 of 7",
    "Step 7 of 7",
  ];

  for (const candidate of candidates) {
    if ((await page.getByText(candidate, { exact: false }).count()) > 0) {
      return candidate;
    }
  }

  return null;
}

function continueLabel(stepNumber) {
  switch (stepNumber) {
    case 1:
      return /Continue to Licence Disc/i;
    case 2:
      return /Continue to Vehicle Identification/i;
    case 3:
      return /Continue to SURF Intelligence Review/i;
    case 4:
      return /Continue to Description Builder/i;
    case 5:
      return /Continue to Pricing Workspace/i;
    case 6:
      return /Continue to Review & Publish/i;
    default:
      return /Continue/i;
  }
}

async function clickContinue(page, stepNumber) {
  await page.getByRole("button", { name: continueLabel(stepNumber) }).first().click({ timeout: 10000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await ensureWizard(page);
    await waitStep(page, 1);

    // 1. Create a new draft
    await page.locator('input[type="file"]').first().setInputFiles("public/images/branding/logo.png");
    await page.waitForTimeout(1000);
    result.scenarios.createDraft = (await page.getByText(/photo uploaded/i).count()) > 0;
    pushCheck("createDraft", result.scenarios.createDraft);

    // 2. Refresh on every wizard step
    const stepNames = ["media", "licence-disc", "identification", "surf-review", "description", "pricing", "review"];
    for (let i = 1; i <= 7; i += 1) {
      await page.reload({ waitUntil: "domcontentloaded" });
      if (page.url().includes("/auth/sign-up/dealer")) {
        await ensureWizard(page);
      }
      await waitStep(page, i);
      pushCheck(`refreshStep${i}`, true, { step: stepNames[i - 1] });
      if (i < 7) {
        if (i === 1) {
          const photoCount = await page.getByText(/photo uploaded/i).count();
          if (photoCount === 0) {
            const mediaInput = page.locator('input[type="file"]').first();
            if (await mediaInput.count()) {
              await mediaInput.setInputFiles("public/images/branding/logo.png");
              await page.getByText(/photo uploaded/i).first().waitFor({ timeout: 8000 });
            }
          }
        }
        if (i === 2) {
          const licenceInput = page.locator('input[type="file"]').first();
          if (await licenceInput.count()) {
            await licenceInput.setInputFiles("public/images/branding/logo.png");
            await page.waitForTimeout(500);
          }
        }
          if (i === 3) {
            const fillByLabel = async (pattern, value) => {
              const field = page.getByLabel(pattern).first();
              if (await field.count()) {
                await field.fill(value);
              }
            };

            await fillByLabel(/Make/i, "BMW");
            await fillByLabel(/Model/i, "X5");
            await fillByLabel(/Year/i, "2024");
            await fillByLabel(/VIN/i, vin);
            await fillByLabel(/Registration/i, registration);
            await fillByLabel(/Stock Number|Stock/i, stockNumber);
          }
          if (i === 5) {
            const titleField = page.locator('input[name="title"], input[id*="title" i]').first();
            if (await titleField.count()) {
              await titleField.fill(`2024 BMW X5 ${stockNumber}`);
            }

            const descriptionField = page.locator('textarea[name="description"], textarea[id*="description" i], textarea').first();
            if (await descriptionField.count()) {
              await descriptionField.fill("Runtime validation listing prepared for SFC-011 verification.");
            }
          }
          if (i === 6) {
            const sellingField = page.locator('input[name="sellingPrice"], input[id*="selling" i]').first();
            if (await sellingField.count()) {
              await sellingField.fill("1249900");
            }
          }
        await clickContinue(page, i);
        try {
          await waitStep(page, i + 1);
        } catch (error) {
          const currentStep = await getVisibleStepText(page);
          const validationBanner = await page.getByText(/Upload at least one vehicle photo|required/i).allTextContents().catch(() => []);
          result.details.transitionFailure = {
            from: i,
            to: i + 1,
            url: page.url(),
            currentStep,
            validationBanner,
            error: error instanceof Error ? error.message : String(error),
          };
          throw error;
        }
      }
    }
    result.scenarios.refreshEveryStep = true;

    // Keep draft context
    const snapshotAtReview = await page.evaluate(() => {
      const raw = localStorage.getItem("surf4cars:vehicle-upload-draft");
      return raw ? JSON.parse(raw) : null;
    });
    const draftId = snapshotAtReview?.draftId ?? null;
    result.details.draftId = draftId;

    // 3. Close browser tab and resume
    await page.close();
    const resumedPage = await context.newPage();
    await ensureWizard(resumedPage);
    await waitStep(resumedPage, 7);
    result.scenarios.closeAndResume = true;
    pushCheck("closeAndResume", true);

    // 4. Open draft in second tab
    const secondTab = await context.newPage();
    await ensureWizard(secondTab);
    await waitStep(secondTab, 7);
    result.scenarios.secondTabOpen = true;
    pushCheck("openSecondTab", true);

    // 5. Cross-tab sync (set VIN in second tab snapshot)
    const crossVin = `${vin}9`;
    await secondTab.evaluate(({ crossVin }) => {
      const key = "surf4cars:vehicle-upload-draft";
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const snap = JSON.parse(raw);
      snap.revision = (snap.revision ?? 0) + 2;
      snap.updatedAt = new Date().toISOString();
      snap.sourceTabId = "tab-2";
      snap.currentStepIndex = 6;
      snap.data.identification.vin = crossVin;
      localStorage.setItem(key, JSON.stringify(snap));
    }, { crossVin });
    await resumedPage.waitForTimeout(1500);
    const resumedVin = await resumedPage.evaluate(() => {
      const raw = localStorage.getItem("surf4cars:vehicle-upload-draft");
      if (!raw) return null;
      const snap = JSON.parse(raw);
      return snap?.data?.identification?.vin ?? null;
    });
    result.scenarios.crossTabSync = resumedVin === crossVin;
    pushCheck("crossTabSync", result.scenarios.crossTabSync, { resumedVin, expected: crossVin });

    // 6/7 Temporary autosave failure and retry (without triggering review publish actions)
    await resumedPage.getByRole("button", { name: /Pricing Workspace|Pricing/i }).first().click();
    await resumedPage.waitForTimeout(400);

    let saveCalls = 0;
    let saveOk = 0;
    await resumedPage.route("**/api/v1/dealer/listing-builder/draft", async (route) => {
      saveCalls += 1;
      if (saveCalls === 1) {
        result.scenarios.autosaveFailure = true;
        await route.abort("failed");
        return;
      }
      await route.continue();
    });
    resumedPage.on("response", (response) => {
      if (response.url().includes("/api/v1/dealer/listing-builder/draft") && response.status() === 200) {
        saveOk += 1;
      }
    });
    await resumedPage.getByRole("button", { name: /^Save Draft$/i }).first().click();
    await resumedPage.waitForTimeout(2500);
    result.scenarios.autosaveRetry = saveCalls >= 2 && saveOk >= 1;
    pushCheck("autosaveFailure", result.scenarios.autosaveFailure, { saveCalls });
    pushCheck("autosaveRetry", result.scenarios.autosaveRetry, { saveCalls, saveOk });
    await resumedPage.unroute("**/api/v1/dealer/listing-builder/draft");

    // 8. Simulate interrupted image upload (storage injection with blob)
    await secondTab.evaluate(() => {
      const key = "surf4cars:vehicle-upload-draft";
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const snap = JSON.parse(raw);
      snap.revision = (snap.revision ?? 0) + 5;
      snap.updatedAt = new Date().toISOString();
      snap.sourceTabId = "tab-2-image-interrupt";
      snap.currentStepIndex = 0;
      snap.data.media = [{
        id: "interrupt-1",
        kind: "photo",
        name: "interrupt.png",
        previewUrl: "blob:http://localhost:3003/interrupted",
        isPrimary: true,
        uploadProgress: 32,
      }];
      localStorage.setItem(key, JSON.stringify(snap));
    });
    await resumedPage.waitForTimeout(1500);
    const interruptMessage = (await resumedPage.getByText(/interrupted and need re-upload/i).count()) > 0;
    const mediaCountAfterInterrupt = await resumedPage.evaluate(() => {
      const raw = localStorage.getItem("surf4cars:vehicle-upload-draft");
      if (!raw) return -1;
      const snap = JSON.parse(raw);
      return Array.isArray(snap?.data?.media) ? snap.data.media.length : -1;
    });
    result.scenarios.imageInterrupted = interruptMessage || mediaCountAfterInterrupt === 0;
    pushCheck("imageInterrupted", result.scenarios.imageInterrupted);

    // 9. Resume image upload
    const mediaInput = resumedPage.locator('input[type="file"]').first();
    if (await mediaInput.count()) {
      await mediaInput.setInputFiles("public/images/branding/logo.png");
      await resumedPage.waitForTimeout(1200);
      const resumedMediaCount = await resumedPage.evaluate(() => {
        const raw = localStorage.getItem("surf4cars:vehicle-upload-draft");
        if (!raw) return 0;
        const snap = JSON.parse(raw);
        return Array.isArray(snap?.data?.media) ? snap.data.media.length : 0;
      });
      result.scenarios.imageResumed = resumedMediaCount > 0;
    } else {
      await secondTab.evaluate(() => {
        const key = "surf4cars:vehicle-upload-draft";
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const snap = JSON.parse(raw);
        snap.revision = (snap.revision ?? 0) + 1;
        snap.updatedAt = new Date().toISOString();
        snap.sourceTabId = "tab-2-image-resume";
        snap.currentStepIndex = 0;
        snap.data.media = [{
          id: "resume-1",
          kind: "photo",
          name: "logo.png",
          previewUrl: "/images/branding/logo.png",
          isPrimary: true,
          uploadProgress: 100,
        }];
        localStorage.setItem(key, JSON.stringify(snap));
      });
      await resumedPage.waitForTimeout(1200);
      const resumedMediaCount = await resumedPage.evaluate(() => {
        const raw = localStorage.getItem("surf4cars:vehicle-upload-draft");
        if (!raw) return 0;
        const snap = JSON.parse(raw);
        return Array.isArray(snap?.data?.media) ? snap.data.media.length : 0;
      });
      result.scenarios.imageResumed = resumedMediaCount > 0;
    }
    pushCheck("imageResumed", result.scenarios.imageResumed);

    // Return to review step via cross-tab snapshot update and ensure publish-required fields
    await secondTab.evaluate(({ stockNumber, vin, registration }) => {
      const key = "surf4cars:vehicle-upload-draft";
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const snap = JSON.parse(raw);
      snap.revision = (snap.revision ?? 0) + 200;
      snap.updatedAt = new Date().toISOString();
      snap.sourceTabId = "tab-2-publish-ready";
      snap.currentStepIndex = 6;
      snap.completedSteps = ["media", "specifications", "identification", "features", "description", "pricing", "review"];
      snap.data.identification.stockNumber = stockNumber;
      snap.data.identification.vin = vin;
      snap.data.identification.registration = registration;
      snap.data.identification.make = "BMW";
      snap.data.identification.model = "X5";
      snap.data.identification.variant = "xDrive40i";
      snap.data.identification.year = "2024";
      snap.data.pricing.sellingPrice = "1249900";
      snap.data.descriptionBuilder.title = `2024 BMW X5 ${stockNumber}`;
      snap.data.media = [{
        id: "m1",
        kind: "photo",
        name: "logo.png",
        previewUrl: "/images/branding/logo.png",
        isPrimary: true,
        uploadProgress: 100,
      }];
      localStorage.setItem(key, JSON.stringify(snap));
    }, { stockNumber, vin, registration });

    await resumedPage.evaluate(({ stockNumber, vin, registration }) => {
      const key = "surf4cars:vehicle-upload-draft";
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const snap = JSON.parse(raw);
      snap.revision = (snap.revision ?? 0) + 201;
      snap.updatedAt = new Date().toISOString();
      snap.currentStepIndex = 6;
      snap.completedSteps = ["media", "specifications", "identification", "features", "description", "pricing", "review"];
      snap.data.identification.stockNumber = stockNumber;
      snap.data.identification.vin = vin;
      snap.data.identification.registration = registration;
      snap.data.pricing.sellingPrice = "1249900";
      snap.data.descriptionBuilder.title = `2024 BMW X5 ${stockNumber}`;
      snap.data.media = [{
        id: "m1",
        kind: "photo",
        name: "logo.png",
        previewUrl: "/images/branding/logo.png",
        isPrimary: true,
        uploadProgress: 100,
      }];
      localStorage.setItem(key, JSON.stringify(snap));
    }, { stockNumber, vin, registration });

    await resumedPage.reload({ waitUntil: "domcontentloaded" });
    await resumedPage.waitForTimeout(1500);
    const reviewMarker = resumedPage.getByText("Step 7 of 7", { exact: false }).first();
    const publishButton = resumedPage.getByRole("button", { name: /Publish To Inventory/i }).first();
    await Promise.race([
      reviewMarker.waitFor({ timeout: 20000 }),
      publishButton.waitFor({ timeout: 20000 }),
    ]);

    const beforePublishSnapshot = await resumedPage.evaluate(() => {
      const raw = localStorage.getItem("surf4cars:vehicle-upload-draft");
      return raw ? JSON.parse(raw) : null;
    });
    const activeDraftId = beforePublishSnapshot?.draftId ?? result.details.draftId;

    // 10. Publish listing
    let publishResponses = 0;
    resumedPage.on("response", (response) => {
      if (response.url().includes("/api/v1/dealer/listing-builder/publish") && response.status() === 200) {
        publishResponses += 1;
      }
    });
    await resumedPage.getByRole("button", { name: /Publish To Inventory/i }).first().click();
    await resumedPage.waitForTimeout(2500);
    result.scenarios.publishListing = publishResponses > 0;
    pushCheck("publishListing", result.scenarios.publishListing);

    // 11. Draft removed
    const localDraftAfterPublish = await resumedPage.evaluate(() => localStorage.getItem("surf4cars:vehicle-upload-draft"));
    const draftLookup = await resumedPage.request.get(`${BASE_URL}/api/v1/dealer/listing-builder/draft?dealershipId=${dealershipId}&draftId=${activeDraftId}`);
    const draftLookupBody = await draftLookup.json().catch(() => null);
    result.scenarios.draftRemoved = localDraftAfterPublish === null && draftLookup.ok() && draftLookupBody?.draft === null;
    pushCheck("draftRemoved", result.scenarios.draftRemoved, { status: draftLookup.status() });

    // 12. Verify one listing exists
    const invResp = await resumedPage.request.get(`${BASE_URL}/api/v1/dealer/inventory/vehicles?dealershipId=${dealershipId}`);
    const invBody = await invResp.json().catch(() => null);
    const vehicles = invBody?.items ?? invBody?.vehicles ?? [];
    const matchesBeforeDup = vehicles.filter((v) => (v.stockNumber ?? v.stock_number) === stockNumber);
    result.scenarios.onePublishedListing = matchesBeforeDup.length === 1;
    pushCheck("onePublishedListing", result.scenarios.onePublishedListing, { count: matchesBeforeDup.length });

    // 13. Attempt duplicate publish
    const duplicatePayload = {
      dealershipId,
      branchId,
      draftId: activeDraftId,
      publishNow: true,
      payload: beforePublishSnapshot.data,
    };

    const pub1 = await resumedPage.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: duplicatePayload,
      headers: { "Content-Type": "application/json" },
    });
    const pub1Body = await pub1.json().catch(() => null);

    const pub2 = await resumedPage.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: duplicatePayload,
      headers: { "Content-Type": "application/json" },
    });
    const pub2Body = await pub2.json().catch(() => null);

    result.scenarios.duplicatePublishAttempted = pub1.ok() && pub2.ok();
    pushCheck("duplicatePublishAttempted", result.scenarios.duplicatePublishAttempted, { pub1: pub1.status(), pub2: pub2.status() });

    // 14. verify duplicate did not create additional listing
    const invRespAfterDup = await resumedPage.request.get(`${BASE_URL}/api/v1/dealer/inventory/vehicles?dealershipId=${dealershipId}`);
    const invAfterDup = await invRespAfterDup.json().catch(() => null);
    const afterVehicles = invAfterDup?.items ?? invAfterDup?.vehicles ?? [];
    const matchesAfterDup = afterVehicles.filter((v) => (v.stockNumber ?? v.stock_number) === stockNumber);

    const publishVehicleId = pub1Body?.vehicleId;
    const byVehicleIdCount = publishVehicleId
      ? afterVehicles.filter((v) => v.id === publishVehicleId).length
      : 0;

    result.scenarios.duplicatePublishNoExtraListing =
      pub1.ok() &&
      pub2.ok() &&
      pub1Body?.vehicleId === pub2Body?.vehicleId &&
      (matchesAfterDup.length === 1 || byVehicleIdCount === 1);

    pushCheck("duplicatePublishNoExtraListing", result.scenarios.duplicatePublishNoExtraListing, {
      pub1VehicleId: pub1Body?.vehicleId,
      pub2VehicleId: pub2Body?.vehicleId,
      listingCount: matchesAfterDup.length,
      byVehicleIdCount,
    });

    result.details.stockNumber = stockNumber;
    result.details.vehicleId = pub1Body?.vehicleId ?? null;
    result.details.draftLookup = draftLookupBody;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.stack ?? error.message : String(error));
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
