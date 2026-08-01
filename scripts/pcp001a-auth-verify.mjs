import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const BASE_URL = process.env.SURF_BASE_URL || "http://localhost:3003";

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

async function readLocation(page) {
  return page.evaluate(() => ({ pathname: window.location.pathname, search: window.location.search, href: window.location.href }));
}

async function waitForPath(page, predicate, timeout = 20000) {
  await page.waitForFunction(
    ({ kind, value }) => {
      const p = window.location.pathname;
      return kind === "startsWith" ? p.startsWith(value) : p === value;
    },
    predicate,
    { timeout },
  );
}

async function waitForText(page, pattern, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const text = await page.locator("body").innerText().catch(() => "");
    if (pattern.test(text)) {
      return text;
    }
    await page.waitForTimeout(250);
  }

  throw new Error(`Timed out waiting for text: ${pattern}`);
}

async function clickWhenEnabled(page, namePattern) {
  const button = page.getByRole("button", { name: namePattern }).first();
  await button.waitFor({ state: "visible", timeout: 20000 });
  await page.waitForFunction((el) => !!el && !el.disabled, await button.elementHandle(), { timeout: 20000 });
  await button.click();
}

async function signInDealer(page, redirect = "/dealer/dashboard") {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(`${BASE_URL}/auth/sign-in?portal=dealer&redirect=${encodeURIComponent(redirect)}`, { waitUntil: "domcontentloaded" });
      await page.getByLabel("Email").fill("dealer.auth.test@example.com");
      await page.getByLabel("Password").fill("Password123!");
      await clickWhenEnabled(page, /^sign in$/i);
      await waitForPath(page, { kind: "startsWith", value: "/dealer" }, 30000);
      await page.getByRole("button", { name: /profile menu/i }).first().waitFor({ state: "visible", timeout: 30000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(500);
    }
  }

  throw lastError ?? new Error("Dealer sign-in failed.");
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

async function checkViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile ?? false,
    hasTouch: viewport.hasTouch ?? false,
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/dealer`, { waitUntil: "networkidle" });
    await waitForPath(page, { kind: "value", value: "/auth/sign-in" });
    const loc = await readLocation(page);
    const params = new URLSearchParams(loc.search);
    pushCheck(`viewport-${viewport.id}-unauthorized-redirect`, params.get("portal") === "dealer", { pathname: loc.pathname, search: loc.search });

    await page.goto(`${BASE_URL}/auth/sign-in?portal=dealer`, { waitUntil: "networkidle" });
    const heading = await page.getByRole("heading", { name: /dealer sign in/i }).first().isVisible();
    pushCheck(`viewport-${viewport.id}-sign-in-render`, heading);
  } catch (error) {
    pushCheck(`viewport-${viewport.id}-smoke`, false, { error: error instanceof Error ? error.message : String(error) });
  } finally {
    await context.close();
  }
}

async function checkDealerJourney(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await withCheck("dealer-registration-entry", async () => {
    await page.goto(`${BASE_URL}/auth/sign-up/dealer`, { waitUntil: "domcontentloaded" });
    const registrationEntry = await page
      .getByRole("heading", { name: /register|onboarding|dealership/i })
      .first()
      .isVisible();
    if (!registrationEntry) {
      throw new Error("Dealer registration entry heading not visible.");
    }
    return { url: page.url() };
  });

  await withCheck("forgot-password", async () => {
    await page.goto(`${BASE_URL}/auth/forgot-password?portal=dealer`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email").fill("dealer.auth.test@example.com");
    await clickWhenEnabled(page, /send reset link/i);
    await waitForText(page, /if this account exists|reset link has been sent/i);
    return { url: page.url() };
  });

  await withCheck("dealer-login", async () => {
    await signInDealer(page, "/dealer/dashboard");
    return { url: page.url() };
  });

  await withCheck("session-persistence", async () => {
    await signInDealer(page, "/dealer/dashboard");
    await page.goto(`${BASE_URL}/dealer/dashboard`, { waitUntil: "domcontentloaded" });
    await waitForPath(page, { kind: "startsWith", value: "/dealer" }, 30000);
    await page.getByRole("button", { name: /profile menu/i }).first().waitFor({ state: "visible", timeout: 30000 });
    return { url: page.url() };
  });

  await withCheck("browser-refresh", async () => {
    await signInDealer(page, "/dealer/dashboard");
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/ERR_ABORTED|frame was detached/i.test(message)) {
        throw error;
      }
      await page.goto(`${BASE_URL}/dealer/dashboard`, { waitUntil: "domcontentloaded" });
    }
    await waitForPath(page, { kind: "startsWith", value: "/dealer" }, 30000);
    await page.getByRole("button", { name: /profile menu/i }).first().waitFor({ state: "visible", timeout: 30000 });
    return { url: page.url() };
  });

  await withCheck("deep-link-recovery", async () => {
    const deepContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    try {
      const deep = await deepContext.newPage();
      await deep.goto(`${BASE_URL}/dealer/inventory?view=grid`, { waitUntil: "domcontentloaded" });
      await waitForPath(deep, { kind: "value", value: "/auth/sign-in" }, 30000);
      const deepLoc = await readLocation(deep);
      const deepRedirect = new URLSearchParams(deepLoc.search).get("redirect") || "";

      await deep.getByLabel("Email").fill("dealer.auth.test@example.com");
      await deep.getByLabel("Password").fill("Password123!");
      await clickWhenEnabled(deep, /^sign in$/i);
      await waitForPath(deep, { kind: "startsWith", value: "/dealer/inventory" }, 30000);
      const finalUrl = deep.url();
      if (!finalUrl.includes("/dealer/inventory?view=grid")) {
        throw new Error(`Deep-link not restored exactly, got: ${finalUrl}`);
      }
      return { url: finalUrl, redirect: deepRedirect };
    } finally {
      await deepContext.close();
    }
  });

  await withCheck("return-to-origin", async () => {
    const returnContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    try {
      const returnPage = await returnContext.newPage();
      await returnPage.goto(`${BASE_URL}/dealer/settings?section=account`, { waitUntil: "domcontentloaded" });
      await waitForPath(returnPage, { kind: "value", value: "/auth/sign-in" }, 30000);
      await returnPage.getByLabel("Email").fill("dealer.auth.test@example.com");
      await returnPage.getByLabel("Password").fill("Password123!");
      await clickWhenEnabled(returnPage, /^sign in$/i);
      await waitForPath(returnPage, { kind: "startsWith", value: "/dealer/settings" }, 30000);
      const loc = await readLocation(returnPage);
      if (!loc.search.includes("section=account")) {
        throw new Error(`Expected return query to persist, got: ${loc.search}`);
      }
      return { url: returnPage.url() };
    } finally {
      await returnContext.close();
    }
  });

  await withCheck("cross-tab-logout", async () => {
    const tabA = await context.newPage();
    const tabB = await context.newPage();
    await signInDealer(tabA, "/dealer/dashboard");
    await tabA.goto(`${BASE_URL}/dealer/dashboard`, { waitUntil: "domcontentloaded" });
    await tabB.goto(`${BASE_URL}/dealer/dashboard`, { waitUntil: "domcontentloaded" });
    await tabA.getByRole("button", { name: /profile menu/i }).first().waitFor({ state: "visible", timeout: 45000 });
    await tabA.getByRole("button", { name: /profile menu/i }).click();
    await tabA.getByRole("menuitem", { name: /sign out/i }).click();
    await waitForPath(tabB, { kind: "value", value: "/auth/sign-in" }, 30000);
    return { tabBUrl: tabB.url() };
  });

  await withCheck("dealer-logout", async () => {
    await page.goto(`${BASE_URL}/dealer/dashboard`, { waitUntil: "domcontentloaded" });
    await waitForPath(page, { kind: "value", value: "/auth/sign-in" }, 30000);
    return { url: page.url() };
  });

  await withCheck("reset-password", async () => {
    await page.goto(`${BASE_URL}/auth/reset-password?portal=dealer&redirect=/dealer/dashboard`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("New password").fill("Password123!");
    await page.getByLabel("Confirm password").fill("Password123!");
    await clickWhenEnabled(page, /update password/i);
    await waitForPath(page, { kind: "startsWith", value: "/dealer" }, 30000);
    return { url: page.url() };
  });

  await withCheck("verify-email-or-pending", async () => {
    await page.goto(`${BASE_URL}/auth/verify-email?portal=dealer`, { waitUntil: "domcontentloaded" });
    const verifyBody = await waitForText(page, /pending verification|email verified|not active in local fallback mode/i);
    return { snippet: verifyBody.slice(0, 180), url: page.url() };
  });

  await withCheck("session-expiry", async () => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.removeItem("surf4cars:auth-user-type");
      localStorage.removeItem("surf4cars:active-dealership-id");
      localStorage.removeItem("surf4cars:active-branch-id");
    });
    await page.goto(`${BASE_URL}/dealer/dashboard`, { waitUntil: "domcontentloaded" });
    await waitForPath(page, { kind: "value", value: "/auth/sign-in" }, 30000);
    return { url: page.url() };
  });

  await withCheck("unauthorized-route-protection", async () => {
    await page.goto(`${BASE_URL}/operations/dashboard`, { waitUntil: "domcontentloaded" });
    const unauthorized = (await readLocation(page)).pathname === "/unauthorized";
    if (!unauthorized) {
      throw new Error(`Expected /unauthorized, got ${page.url()}`);
    }
    return { url: page.url() };
  });

  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const warm = await browser.newPage();
        await warm.goto(`${BASE_URL}/auth/sign-in?portal=dealer`, { waitUntil: "domcontentloaded", timeout: 15000 });
        await warm.close();
        break;
      } catch (error) {
        if (attempt === 19) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    for (const vp of viewports) {
      await checkViewport(browser, vp);
    }
    await checkDealerJourney(browser);
  } finally {
    await browser.close();
  }

  const output = "scripts/pcp001a-auth-verify.latest.json";
  await writeFile(output, JSON.stringify(result, null, 2));

  if (result.summary.failed > 0) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

void main();
