import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const BASE_URL = process.env.SURF_BASE_URL || "http://localhost:3003";
const STORE_PATH = "db/local/platform-store.json";

const viewports = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "tablet", width: 1024, height: 1366 },
  { id: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
];

const result = {
  baseUrl: BASE_URL,
  generatedAt: new Date().toISOString(),
  checks: [],
  summary: { passed: 0, failed: 0 },
};

function pushCheck(name, ok, details = {}) {
  result.checks.push({ name, ok, ...details });
  if (ok) result.summary.passed += 1;
  else result.summary.failed += 1;
}

async function withCheck(name, callback) {
  try {
    const details = await callback();
    pushCheck(name, true, details ?? {});
  } catch (error) {
    pushCheck(name, false, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function uniqueTag(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function safeGoto(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
}

async function waitForPath(page, pathStart, timeout = 30000) {
  await page.waitForFunction((value) => window.location.pathname.startsWith(value), pathStart, { timeout });
}

async function clickContinue(page) {
  const button = page.getByRole("button", { name: /continue/i }).first();
  await button.waitFor({ state: "visible", timeout: 20000 });
  await button.click();
}

async function clickBack(page) {
  const button = page.getByRole("button", { name: /back/i }).first();
  await button.waitFor({ state: "visible", timeout: 20000 });
  await button.click();
}

async function waitForHeading(page, pattern, timeout = 20000) {
  await page.getByRole("heading", { name: pattern }).first().waitFor({ timeout });
}

async function detectCurrentStep(page) {
  if (await page.getByRole("heading", { name: /tell us about your dealership/i }).first().isVisible().catch(() => false)) {
    return "dealership";
  }
  if (await page.getByRole("heading", { name: /define your brand/i }).first().isVisible().catch(() => false)) {
    return "branding";
  }
  if (await page.getByRole("heading", { name: /add your branches/i }).first().isVisible().catch(() => false)) {
    return "branch";
  }
  if (await page.getByRole("heading", { name: /create owner account and invite staff/i }).first().isVisible().catch(() => false)) {
    return "team";
  }
  if (await page.getByRole("heading", { name: /choose your package/i }).first().isVisible().catch(() => false)) {
    return "subscription";
  }
  if (await page.getByRole("heading", { name: /review your setup/i }).first().isVisible().catch(() => false)) {
    return "review";
  }
  if (await page.getByRole("heading", { name: /your dealership is ready to grow/i }).first().isVisible().catch(() => false)) {
    return "success";
  }
  return "unknown";
}

async function ensureStep(page, step, attempts = 80) {
  const targetByStep = {
    branding: /define your brand/i,
    branch: /add your branches/i,
    team: /create owner account and invite staff/i,
  };

  const target = targetByStep[step];
  if (!target) {
    throw new Error(`Unsupported ensureStep target: ${step}`);
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const current = await detectCurrentStep(page);
    if (current === step) {
      await waitForHeading(page, target, 45000);
      return;
    }

    if ((current === "branding" && step === "branch") || (current === "branch" && step === "team")) {
      await clickContinue(page);
      await page.waitForTimeout(350);
      continue;
    }

    if ((current === "team" && step === "branch") || (current === "branch" && step === "branding")) {
      await clickBack(page);
      await page.waitForTimeout(350);
      continue;
    }

    await page.waitForTimeout(500);
  }

  const finalStep = await detectCurrentStep(page);
  const headings = await page.locator("h1,h2,h3").allTextContents().catch(() => []);
  throw new Error(
    `Expected step '${step}' but landed on '${finalStep}'. URL: ${page.url()}. Headings: ${headings.join(" | ")}`,
  );
}

async function clearClientState(page) {
  await page.context().clearCookies();
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await page.evaluate(() => {
    localStorage.removeItem("surf4cars:dealer-onboarding-draft");
    localStorage.removeItem("surf4cars:auth-user-type");
    localStorage.removeItem("surf4cars:active-dealership-id");
    localStorage.removeItem("surf4cars:active-branch-id");
  }).catch(() => {});
}

async function startOnboarding(page) {
  await safeGoto(page, `${BASE_URL}/auth/sign-up/dealer`);
  const startButton = page.getByRole("button", { name: /build your dealership/i }).first();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const alreadyAtDealership = await page.locator("#business-name").isVisible().catch(() => false);
    if (alreadyAtDealership) {
      break;
    }

    await startButton.waitFor({ state: "visible", timeout: 20000 });
    try {
      await startButton.click();
    } catch {
      await page.waitForTimeout(300);
    }

    const reached = await page.locator("#business-name").isVisible().catch(() => false);
    if (reached) {
      break;
    }

    await page.waitForTimeout(400);
  }

  await page.locator("#business-name").waitFor({ state: "visible", timeout: 30000 });
}

async function fillDealershipStep(page, email, unique) {
  await page.locator("#business-name").fill(`Surf Motors ${unique}`);
  await page.locator("#trading-name").fill(`Surf Auto ${unique}`);
  await page.locator("#registration-number").fill(`REG-${unique}`);
  await page.locator("#vat-number").fill(`VAT-${unique}`);
  await page.locator("#dealer-licence").fill(`LIC-${unique}`);
  await page.locator("#business-type").selectOption("franchise");
  await page.locator("#physical-address").fill("1 Main Road");
  await page.locator("#province").selectOption("Western Cape");
  await page.locator("#city").fill("Cape Town");
  await page.locator("#postal-code").fill("8001");
  await page.locator("#dealership-email").fill(email);
  await page.locator("#telephone").fill("+27215551234");
  await page.locator("#whatsapp").fill("+27825551234");
  await page.locator("#gps-latitude").fill("-33.9249");
  await page.locator("#gps-longitude").fill("18.4241");
  await page.locator("#website").fill("https://example.com");
}

async function fillBranchStep(page, email, unique) {
  await page.locator('[id^="branch-name-"]').first().fill(`Main Branch ${unique}`);
  await page.locator('[id^="branch-address-"]').first().fill("1 Main Road");
  await page.locator('[id^="branch-province-"]').first().selectOption("Western Cape");
  await page.locator('[id^="branch-city-"]').first().fill("Cape Town");
  await page.locator('[id^="branch-postal-"]').first().fill("8001");
  await page.locator('[id^="branch-phone-"]').first().fill("+27215551234");
  await page.locator('[id^="branch-whatsapp-"]').first().fill("+27825551234");
  await page.locator('[id^="branch-email-"]').first().fill(email);
  await page.locator('[id^="branch-hours-"]').first().fill("Mon-Fri 08:00-17:00");
  await page.locator('[id^="branch-manager-"]').first().fill("Branch Manager");
}

async function fillTeamStep(page, ownerEmail) {
  await page.locator("#owner-full-name").fill("Dealer Owner");
  await page.locator("#owner-email").fill(ownerEmail);
  await page.locator("#owner-password").fill("Password123!");
}

async function ensureBranchStep(page) {
  await ensureStep(page, "branch");

  const hasBranchInput = await page.locator('[id^="branch-name-"]').first().isVisible().catch(() => false);
  if (!hasBranchInput) {
    const addBranchButton = page.getByRole("button", { name: /add branch/i }).first();
    await addBranchButton.waitFor({ state: "visible", timeout: 10000 });
    await addBranchButton.click();
  }

  await page.locator('[id^="branch-name-"]').first().waitFor({ state: "visible", timeout: 20000 });
}

async function ensureTeamStep(page) {
  await ensureStep(page, "team");
  await page.locator("#owner-full-name").waitFor({ state: "visible", timeout: 30000 });
}

async function readStore() {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { dealerships: [], branches: [] };
  }
}

async function runDesktopScenario(browser) {
  const unique = uniqueTag("pcp001b");
  const ownerEmail = `owner.${unique}@example.com`;

  const completionPayload = {
    dealership: {
      businessName: `Surf Motors ${unique}`,
      tradingName: `Surf Auto ${unique}`,
      registrationNumber: `REG-${unique}`,
      vatNumber: `VAT-${unique}`,
      dealerLicenceNumber: `LIC-${unique}`,
      businessType: "franchise",
      physicalAddress: "1 Main Road",
      province: "Western Cape",
      city: "Cape Town",
      postalCode: "8001",
      gps: { latitude: "-33.9249", longitude: "18.4241" },
      telephone: "+27215551234",
      whatsapp: "+27825551234",
      email: ownerEmail,
      website: "https://example.com",
    },
    branding: {
      logoPreview: "data:image/png;base64,abcd",
      logoFileName: "logo.png",
      coverPreview: "data:image/webp;base64,efgh",
      coverFileName: "cover.webp",
      primaryColor: "#0066ff",
      secondaryColor: "#c8a96e",
    },
    branches: [
      {
        id: `branch-${unique}`,
        branchName: `Main Branch ${unique}`,
        address: "1 Main Road",
        province: "Western Cape",
        city: "Cape Town",
        postalCode: "8001",
        telephone: "+27215551234",
        whatsapp: "+27825551234",
        email: ownerEmail,
        businessHours: "Mon-Fri 08:00-17:00",
        branchManager: "Branch Manager",
      },
    ],
    ownerAccount: {
      fullName: "Dealer Owner",
      email: ownerEmail,
      password: "Password123!",
    },
    staffInvites: [],
    subscriptionPackage: "growth",
  };

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await withCheck("start-onboarding", async () => {
    await clearClientState(page);
    await startOnboarding(page);
    return { url: page.url() };
  });

  await withCheck("dealership-validation", async () => {
    await clickContinue(page);
    const alert = page.getByRole("alert").first();
    await alert.waitFor({ state: "visible", timeout: 10000 });
    const text = (await alert.textContent()) ?? "";
    if (!text || !/required|invalid/i.test(text)) {
      throw new Error(`Unexpected validation response: ${text}`);
    }
    return { alert: text.trim() };
  });

  await withCheck("dealership-refresh-and-autosave", async () => {
    await fillDealershipStep(page, ownerEmail, unique);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#business-name").waitFor({ state: "visible", timeout: 20000 });
    const restoredName = await page.locator("#business-name").inputValue();
    if (!restoredName.includes(unique)) {
      throw new Error("Dealership draft did not restore after refresh.");
    }
    return { restoredName };
  });

  await withCheck("branding-upload-and-retry", async () => {
    let interruptionDetected = false;
    await clickContinue(page);
    await waitForHeading(page, /define your brand/i);

    const uploads = page.locator('input[type="file"]');
    const logo = uploads.first();
    try {
      await logo.setInputFiles("public/images/branding/does-not-exist.png");
    } catch {
      interruptionDetected = true;
    }

    await logo.setInputFiles("public/images/branding/logo.png");
    await uploads.nth(1).setInputFiles("public/images/hero/surf4cars-premium-hero-v3.webp");
    await clickContinue(page);
    await ensureBranchStep(page);

    return { interruptionDetected };
  });

  await withCheck("branch-validation-navigation-refresh", async () => {
    await clickContinue(page);
    await page.getByRole("alert").first().waitFor({ state: "visible", timeout: 10000 });

    await fillBranchStep(page, ownerEmail, unique);
    await clickBack(page);
    await ensureStep(page, "branding");
    await ensureStep(page, "branch");
    await ensureBranchStep(page);

    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureBranchStep(page);
    const restoredBranch = await page.locator('[id^="branch-name-"]').first().inputValue();
    if (!restoredBranch.includes(unique)) {
      throw new Error("Branch draft did not restore after refresh.");
    }

    return { restoredBranch };
  });

  await withCheck("close-browser-and-resume", async () => {
    await ensureStep(page, "team");
    await fillTeamStep(page, ownerEmail);
    await page.waitForTimeout(500);

    const state = await context.storageState();
    const resumeContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      storageState: state,
    });
    const resumePage = await resumeContext.newPage();
    await safeGoto(resumePage, `${BASE_URL}/auth/sign-up/dealer`);
    await ensureTeamStep(resumePage);
    const resumedEmail = await resumePage.locator("#owner-email").inputValue();
    await resumeContext.close();

    if (resumedEmail !== ownerEmail) {
      throw new Error("Draft did not resume after browser restart.");
    }

    return { resumedEmail };
  });

  await withCheck("cross-tab-synchronization", async () => {
    const tabB = await context.newPage();
    await safeGoto(tabB, `${BASE_URL}/auth/sign-up/dealer`);
    await ensureTeamStep(tabB);

    const syncName = `Owner ${unique}`;
    await page.locator("#owner-full-name").fill(syncName);

    await tabB.waitForFunction(
      (value) => {
        const input = document.querySelector("#owner-full-name");
        return input && input.value === value;
      },
      syncName,
      { timeout: 15000 },
    );

    await tabB.close();

    return { syncName };
  });

  await withCheck("team-subscription-review-completion", async () => {
    await fillTeamStep(page, ownerEmail);
    await clickContinue(page);
    await waitForHeading(page, /choose your package/i);

    await page.getByRole("radio").nth(1).click();
    await clickContinue(page);
    await waitForHeading(page, /review your setup/i);

    await page.getByRole("button", { name: /complete setup/i }).click();
    const dashboardLink = page.getByRole("link", { name: /enter dealer dashboard/i }).first();
    const landedInDealer = await page.waitForURL(/\/dealer\//, { timeout: 30000 }).then(() => true).catch(() => false);
    if (!landedInDealer) {
      await dashboardLink.waitFor({ state: "visible", timeout: 30000 });
      await dashboardLink.click();
    }
    await waitForPath(page, "/dealer", 30000);
    const url = page.url();

    return { url };
  });

  await withCheck("dashboard-redirect-and-session-continuity", async () => {
    await safeGoto(page, `${BASE_URL}/dealer/dashboard`);
    await waitForPath(page, "/dealer", 30000);

    try {
      await page.reload({ waitUntil: "domcontentloaded" });
    } catch {
      await safeGoto(page, `${BASE_URL}/dealer/dashboard`);
    }
    await waitForPath(page, "/dealer", 30000);
    const url = page.url();

    return { url };
  });

  await withCheck("duplicate-completion-idempotency", async () => {
    const idContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const idPage = await idContext.newPage();
    await clearClientState(idPage);

    const responseA = await idPage.request.post(`${BASE_URL}/api/v1/dealer/onboarding/complete`, {
      data: completionPayload,
      timeout: 120000,
    });
    if (!responseA.ok()) {
      throw new Error(`First completion retry failed: ${await responseA.text()}`);
    }
    const first = await responseA.json();

    const responseB = await idPage.request.post(`${BASE_URL}/api/v1/dealer/onboarding/complete`, {
      data: completionPayload,
      timeout: 120000,
    });
    if (!responseB.ok()) {
      throw new Error(`Second completion retry failed: ${await responseB.text()}`);
    }
    const second = await responseB.json();

    await idContext.close();

    if (first.dealershipId !== second.dealershipId || first.primaryBranchId !== second.primaryBranchId) {
      throw new Error("Completion was not idempotent across duplicate requests.");
    }

    let dealershipRows = [];
    let branchRows = [];
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const afterStore = await readStore();
      dealershipRows = (afterStore.dealerships || []).filter((x) => x.id === first.dealershipId);
      branchRows = (afterStore.branches || []).filter((x) => x.dealershipId === first.dealershipId);
      if (dealershipRows.length > 0 && branchRows.length > 0) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (dealershipRows.length !== 1) {
      throw new Error(`Expected one dealership record, found ${dealershipRows.length}.`);
    }
    if (branchRows.length < 1) {
      throw new Error("No branch records found for completed dealership.");
    }

    return {
      dealershipId: first.dealershipId,
      primaryBranchId: first.primaryBranchId,
      afterDealershipCount: dealershipRows.length,
      branchCount: branchRows.length,
    };
  });

  await context.close();
}

async function runViewportSmoke(browser, viewport) {
  const unique = uniqueTag(`pcp001b-${viewport.id}`);
  const ownerEmail = `owner.${unique}@example.com`;
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile ?? false,
    hasTouch: viewport.hasTouch ?? false,
  });
  const page = await context.newPage();

  await withCheck(`${viewport.id}-onboarding-responsive-smoke`, async () => {
    await clearClientState(page);
    await startOnboarding(page);
    await fillDealershipStep(page, ownerEmail, unique);
    await clickContinue(page);
    await waitForHeading(page, /define your brand/i);
    return { url: page.url(), viewport: viewport.id };
  });

  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    await runDesktopScenario(browser);
    await runViewportSmoke(browser, viewports[1]);
    await runViewportSmoke(browser, viewports[2]);
  } finally {
    await browser.close();
  }

  const output = "scripts/pcp001b-onboarding-verify.latest.json";
  await writeFile(output, JSON.stringify(result, null, 2));

  if (result.summary.failed > 0) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

void main();
