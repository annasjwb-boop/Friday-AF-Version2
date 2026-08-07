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
  localStorage.setItem("aidfinder:background", "sanctuary-b");
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
await page.screenshot({ path: `${OUT}/product-home.png` });
console.log("home");

// Open model & look sheet from Home.
await page.click('button:has-text("Change model")');
await page.waitForTimeout(1400);
await page.screenshot({ path: `${OUT}/product-look.png` });
console.log("look");

// Pick violet + crank brightness, then confirm.
await page.click('button[aria-label="Violet"]');
await page.locator(".sanctuary-b-sheet__bright input").fill("95");
await page.waitForTimeout(800);
await page.click(".sanctuary-b-sheet__confirm");
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/product-home-look.png` });
console.log("home-look");

// Explore still has Model & look ingress, no appearance block.
await page.click('button:has-text("Explore")');
await page.waitForTimeout(2200);
await page.screenshot({ path: `${OUT}/product-explore.png` });
console.log("explore");

await browser.close();
