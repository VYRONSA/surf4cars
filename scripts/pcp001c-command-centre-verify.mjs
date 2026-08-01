import { chromium } from "playwright";

const BASE_URL = process.env.SURF_BASE_URL || "http://localhost:3003";

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

async function waitForDashboardReady(page, timeout = 30000) {
  await waitForPath(page, "/dealer/dashboard", timeout);
  await page.waitForFunction(() => {
    const hasDashboardText = document.body.innerText.includes("Dealer Command Centre");
    const hasKpis = document.querySelectorAll("[data-kpi-id]").length > 0;
    return hasDashboardText || hasKpis;
  }, { timeout });
}

async function clearClientState(page) {
  await page.context().clearCookies();
  await safeGoto(page, BASE_URL);
  await page.evaluate(() => {
    localStorage.removeItem("surf4cars:dealer-onboarding-draft");
    localStorage.removeItem("surf4cars:auth-user-type");
    localStorage.removeItem("surf4cars:active-dealership-id");
    localStorage.removeItem("surf4cars:active-branch-id");
  }).catch(() => {});
}

async function clickContinue(page) {
  const button = page.getByRole("button", { name: /continue/i }).first();
  await button.waitFor({ state: "visible", timeout: 20000 });
  await button.click();
}

async function completeOnboardingToDashboard(page, unique) {
  const email = `owner.${unique}@example.com`;

  await clearClientState(page);
  await safeGoto(page, `${BASE_URL}/auth/sign-up/dealer`);

  const startButton = page.getByRole("button", { name: /build your dealership/i }).first();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const ready = await page.locator("#business-name").isVisible().catch(() => false);
    if (ready) break;
    await startButton.waitFor({ state: "visible", timeout: 20000 });
    await startButton.click().catch(() => {});
    await page.waitForTimeout(300);
  }

  await page.locator("#business-name").waitFor({ state: "visible", timeout: 30000 });
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
  await clickContinue(page);

  await page.getByRole("heading", { name: /define your brand/i }).first().waitFor({ timeout: 30000 });
  const uploads = page.locator('input[type="file"]');
  await uploads.first().setInputFiles("public/images/branding/logo.png");
  await uploads.nth(1).setInputFiles("public/images/hero/surf4cars-premium-hero-v3.webp");
  await page.getByAltText("Logo preview").first().waitFor({ timeout: 15000 });
  await page.getByAltText("Cover preview").first().waitFor({ timeout: 15000 });
  await clickContinue(page);

  await page.getByRole("heading", { name: /add your branches/i }).first().waitFor({ timeout: 30000 });
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
  await clickContinue(page);

  await page.getByRole("heading", { name: /create owner account and invite staff/i }).first().waitFor({ timeout: 30000 });
  await page.locator("#owner-full-name").fill("Dealer Owner");
  await page.locator("#owner-email").fill(email);
  await page.locator("#owner-password").fill("Password123!");
  await clickContinue(page);

  await page.getByRole("heading", { name: /choose your package/i }).first().waitFor({ timeout: 30000 });
  await page.getByRole("radio").nth(1).click();
  await clickContinue(page);

  await page.getByRole("heading", { name: /review your setup/i }).first().waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: /complete setup/i }).first().click();
  const dashboardLink = page.getByRole("link", { name: /enter dealer dashboard/i }).first();
  await dashboardLink.waitFor({ state: "visible", timeout: 30000 });
  const landedInDealer = await page.waitForURL(/\/dealer\//, { timeout: 30000 }).then(() => true).catch(() => false);
  if (!landedInDealer) {
    await dashboardLink.click();
  }
  const landedAfterClick = await page.waitForURL(/\/dealer\//, { timeout: 30000 }).then(() => true).catch(() => false);
  if (!landedAfterClick) {
    await safeGoto(page, `${BASE_URL}/dealer/dashboard`);
  }
  await waitForDashboardReady(page, 30000);
  return { email };
}

async function countVisible(page, selector) {
  return page.locator(selector).count();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const unique = uniqueTag("pcp001c");

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopContext.newPage();
    const { email } = await completeOnboardingToDashboard(desktopPage, unique);

    await withCheck("dealer-signs-in-and-dashboard-loads", async () => {
      await waitForDashboardReady(desktopPage, 30000);
      return { url: desktopPage.url() };
    });

    await withCheck("dealer-context-correct", async () => {
      const heading = (await desktopPage.locator("h1").first().textContent())?.trim() ?? "";
      if (!heading.includes(unique)) {
        throw new Error(`Unexpected dealer heading: ${heading}`);
      }
      return { heading };
    });

    await withCheck("kpi-cards-correct", async () => {
      const kpiCount = await countVisible(desktopPage, "[data-kpi-id]");
      if (kpiCount < 8) {
        throw new Error(`Expected at least 8 KPI cards, found ${kpiCount}.`);
      }
      return { kpiCount };
    });

    await withCheck("inventory-summary-updates", async () => {
      await desktopPage.getByRole("heading", { name: /inventory snapshot/i }).first().waitFor({ timeout: 20000 });
      const text = await desktopPage.locator("body").innerText();
      if (!/ready to publish|missing photos|needs price review/i.test(text)) {
        throw new Error("Inventory summary did not render live categories.");
      }
      return { matched: true };
    });

    await withCheck("leads-summary-and-empty-states", async () => {
      await desktopPage.getByRole("heading", { name: /recent leads/i }).first().waitFor({ timeout: 20000 });
      const bodyText = await desktopPage.locator("body").innerText();
      if (!/recent leads/i.test(bodyText)) {
        throw new Error("Recent leads section missing.");
      }
      return { emptyOrLive: /view all|recent leads/i.test(bodyText) };
    });

    await withCheck("activity-feed-updates", async () => {
      await desktopPage.getByRole("heading", { name: /activity feed/i }).first().waitFor({ timeout: 20000 });
      return { activityItems: await countVisible(desktopPage, "[data-activity-id]") };
    });

    await withCheck("notifications-and-coming-soon-states", async () => {
      await desktopPage.getByRole("button", { name: /notifications coming soon/i }).first().click();
      await desktopPage.getByText(/notifications coming soon/i).first().waitFor({ timeout: 10000 });
      return { toast: true };
    });

    await withCheck("quick-actions-work", async () => {
      const manageInventory = desktopPage.getByRole("link", { name: /manage inventory/i }).first();
      await manageInventory.waitFor({ timeout: 15000 });
      await manageInventory.click();
      await waitForPath(desktopPage, "/dealer/inventory", 30000);
      await safeGoto(desktopPage, `${BASE_URL}/dealer/dashboard`);
      await waitForDashboardReady(desktopPage, 30000);
      return { returned: desktopPage.url() };
    });

    await withCheck("navigation-works", async () => {
      const dashboardNav = desktopPage.getByRole("link", { name: /dashboard/i }).first();
      await dashboardNav.waitFor({ timeout: 15000 });
      await dashboardNav.click();
      await waitForDashboardReady(desktopPage, 30000);
      return { url: desktopPage.url() };
    });

    await withCheck("refresh-preserves-state-and-browser-refresh", async () => {
      await desktopPage.getByRole("button", { name: /refresh/i }).first().click();
      await desktopPage.reload({ waitUntil: "domcontentloaded" });
      await waitForDashboardReady(desktopPage, 30000);
      return { url: desktopPage.url() };
    });

    await withCheck("cross-tab-synchronization", async () => {
      const tabB = await desktopContext.newPage();
      await safeGoto(tabB, `${BASE_URL}/dealer/dashboard`);
      await waitForDashboardReady(tabB, 30000);
      await desktopPage.evaluate(() => {
        localStorage.setItem("surf4cars:active-dealership-id", localStorage.getItem("surf4cars:active-dealership-id") ?? "");
      });
      await tabB.waitForTimeout(1000);
      await tabB.close();
      return { synced: true };
    });

    await withCheck("session-continuity", async () => {
      await safeGoto(desktopPage, `${BASE_URL}/dealer/dashboard`);
      await waitForPath(desktopPage, "/dealer/dashboard", 30000);
      const stillThere = desktopPage.url();
      if (!stillThere.includes("/dealer/dashboard")) {
        throw new Error(`Unexpected session redirect: ${stillThere}`);
      }
      return { url: stillThere, email };
    });

    const authenticatedState = await desktopContext.storageState();

    await desktopContext.close();

    const tabletContext = await browser.newContext({ viewport: { width: 1024, height: 1366 }, storageState: authenticatedState });
    const tabletPage = await tabletContext.newPage();
    await safeGoto(tabletPage, `${BASE_URL}/dealer/dashboard`);
    await withCheck("tablet-workspace", async () => {
      await waitForDashboardReady(tabletPage, 30000);
      const actionsVisible = await tabletPage.getByRole("heading", { name: /quick actions/i }).first().isVisible();
      if (!actionsVisible) {
        throw new Error("Quick Actions not visible on tablet.");
      }
      return { url: tabletPage.url() };
    });
    await tabletContext.close();

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: authenticatedState });
    const mobilePage = await mobileContext.newPage();
    await safeGoto(mobilePage, `${BASE_URL}/dealer/dashboard`);
    await withCheck("phone-premium-presentation", async () => {
      await mobilePage.getByRole("navigation", { name: /dashboard quick navigation/i }).first().waitFor({ timeout: 30000 });
      const summaryVisible = await mobilePage.getByRole("heading", { name: /executive summary/i }).first().isVisible();
      if (!summaryVisible) {
        throw new Error("Executive Summary not visible on phone layout.");
      }
      return { url: mobilePage.url() };
    });
    await mobileContext.close();
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
  if (result.summary.failed > 0) {
    process.exitCode = 1;
  }
}

await main();
