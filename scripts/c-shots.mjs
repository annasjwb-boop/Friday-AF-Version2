import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5174";
const OUT = ".sanctuary-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

await page
  .goto(BASE, { waitUntil: "domcontentloaded" })
  .catch(() => page.goto(BASE, { waitUntil: "domcontentloaded" }));
await page.evaluate(() => {
  localStorage.setItem("aidfinder:background", "sanctuary-c");
});

for (let i = 0; i < 4; i++) {
  try {
    await page.goto(BASE, { waitUntil: "networkidle" });
    break;
  } catch (err) {
    if (i === 3) throw err;
    await page.waitForTimeout(1500);
  }
}
await page.waitForTimeout(4000);
await page.screenshot({ path: `${OUT}/c-home.png` });
console.log("home");

// Model & look sheet.
await page.click('button:has-text("Change model")');
await page.waitForTimeout(1400);
await page.screenshot({ path: `${OUT}/c-look.png` });
console.log("look");
await page.click(".sanctuary-c-sheet__confirm");
await page.waitForTimeout(800);

// Explore chapter.
await page.click('button:has-text("Explore")');
await page.waitForTimeout(2200);
await page.screenshot({ path: `${OUT}/c-explore.png` });
console.log("explore");
await page.click('button:has-text("Back to your home")');
await page.waitForTimeout(1200);

// Chapter tabs.
for (const tab of ["Risk", "Readiness", "Recovery"]) {
  await page.click(`.gdc-nav__item[aria-label="${tab}"]`);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/c-${tab.toLowerCase()}.png` });
  console.log(tab.toLowerCase());
}

await browser.close();
