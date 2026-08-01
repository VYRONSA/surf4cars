import { chromium } from "playwright";

const BASE_URL = "http://localhost:3003";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.removeItem("surf4cars:dealer-onboarding-draft");
    localStorage.removeItem("surf4cars:auth-user-type");
    localStorage.removeItem("surf4cars:active-dealership-id");
    localStorage.removeItem("surf4cars:active-branch-id");
  });
  await context.clearCookies();

  const unique = Date.now().toString().slice(-6);
  const email = `owner.${unique}@example.com`;

  await page.goto(`${BASE_URL}/auth/sign-up/dealer`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /build your dealership/i }).first().click();
  await page.locator("#business-name").waitFor({ state: "visible", timeout: 30000 });

  await page.locator("#business-name").fill(`Surf ${unique}`);
  await page.locator("#trading-name").fill(`Trade ${unique}`);
  await page.locator("#registration-number").fill(`REG-${unique}`);
  await page.locator("#vat-number").fill(`VAT-${unique}`);
  await page.locator("#business-type").selectOption("franchise");
  await page.locator("#physical-address").fill("1 Main");
  await page.locator("#province").selectOption("Western Cape");
  await page.locator("#city").fill("Cape Town");
  await page.locator("#postal-code").fill("8001");
  await page.locator("#dealership-email").fill(email);
  await page.locator("#telephone").fill("+2721");
  await page.locator("#whatsapp").fill("+2782");
  await page.locator("#gps-latitude").fill("-33");
  await page.locator("#gps-longitude").fill("18");
  await page.locator("#website").fill("https://example.com");

  await page.getByRole("button", { name: /continue/i }).first().click();
  await page.getByRole("heading", { name: /define your brand/i }).first().waitFor({ timeout: 30000 });

  const uploads = page.locator('input[type="file"]');
  await uploads.first().setInputFiles("public/images/branding/logo.png");
  await uploads.nth(1).setInputFiles("public/images/hero/surf4cars-premium-hero-v3.webp");

  await page.getByAltText("Logo preview").first().waitFor({ state: "visible", timeout: 30000 });
  await page.getByAltText("Cover preview").first().waitFor({ state: "visible", timeout: 30000 });

  await page.getByRole("button", { name: /continue/i }).first().click();
  await page.waitForTimeout(2500);

  const url = page.url();
  const headings = await page.getByRole("heading").allTextContents().catch(() => []);
  const alerts = await page.getByRole("alert").allTextContents().catch(() => []);
  const branchVisible = await page.locator('[id^="branch-name-"]').first().isVisible().catch(() => false);
  const teamVisible = await page.locator("#owner-full-name").isVisible().catch(() => false);

  console.log(JSON.stringify({ url, headings, alerts, branchVisible, teamVisible }, null, 2));

  await context.close();
  await browser.close();
}

void main();
