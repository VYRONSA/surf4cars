/**
 * PCP-001S1 search validation: runs representative buyer searches against the live marketplace
 * and reports result counts, so the seeded dataset can be shown to support real discovery.
 */
import { chromium } from "playwright";

const BASE = process.env.SURF_BASE_URL || "http://localhost:3003";

const SEARCHES = [
  ["Hilux under R500 000", "?query=Hilux&priceMax=50000000"],
  ["Double cab automatic", "?bodyType=Double%20Cab&transmission=Automatic"],
  ["Family SUV under R350 000", "?bodyType=SUV&priceMax=35000000"],
  ["BMW under 80 000 km", "?make=BMW&mileageMax=80000"],
  ["Diesel under 100 000 km", "?fuel=Diesel&mileageMax=100000"],
  ["Toyota in Cape Town", "?make=Toyota&province=Western%20Cape"],
  ["Dealers in Gauteng", "?province=Gauteng"],
  ["Automatic hatchback", "?bodyType=Hatch&transmission=Automatic"],
  ["Ford Ranger", "?make=Ford&model=Ranger"],
  ["Volkswagen Polo", "?make=Volkswagen&model=Polo"],
  ["Mercedes-Benz SUVs", "?make=Mercedes-Benz&bodyType=SUV"],
  ["Audi automatic", "?make=Audi&transmission=Automatic"],
  ["Suzuki under R300 000", "?make=Suzuki&priceMax=30000000"],
  ["Isuzu D-Max 4x4", "?make=Isuzu&model=D-Max"],
  ["Hybrid vehicles", "?fuel=Hybrid"],
  ["Premium over R1m", "?priceMin=100000000"],
  ["Newest first", "?sort=year-desc"],
  ["Cheapest first", "?sort=price-asc"],
  ["Lowest mileage", "?sort=mileage-asc"],
  ["Nissan Magnite", "?make=Nissan&model=Magnite"],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

console.log("label".padEnd(34) + "results  latency");
let pass = 0;
const timings = [];

for (const [label, qs] of SEARCHES) {
  const started = Date.now();
  try {
    await page.goto(`${BASE}/search${qs}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.locator('[aria-label="Search results"]').first().waitFor({ timeout: 90000 });
    await page.waitForFunction(() => /\d[\d,]*\s+results/.test(document.body.innerText), { timeout: 60000 });
    const text = await page.getByText(/\d[\d,]* results/).first().textContent();
    const count = Number(String(text).replace(/[^0-9]/g, ""));
    const ms = Date.now() - started;
    timings.push(ms);
    if (count > 0) pass += 1;
    console.log(label.padEnd(34) + String(count).padStart(7) + "  " + String(ms).padStart(6) + "ms");
  } catch (error) {
    console.log(label.padEnd(34) + "  ERROR  " + String(error.message).split("\n")[0].slice(0, 50));
  }
}

const sorted = [...timings].sort((a, b) => a - b);
console.log(`\n${pass}/${SEARCHES.length} searches returned results`);
if (sorted.length) {
  console.log(`latency  min=${sorted[0]}ms  median=${sorted[Math.floor(sorted.length / 2)]}ms  max=${sorted[sorted.length - 1]}ms`);
}

await browser.close();
