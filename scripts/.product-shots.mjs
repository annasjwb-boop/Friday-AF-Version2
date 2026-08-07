import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5174";
const OUT = ".sanctuary-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page
  .goto(BASE, { waitUntil: "domcontentloaded" })
  .catch(() => page.goto(BASE, { waitUntil: "domcontentloaded" }));
await page.evaluate(() => {
  localStorage.setItem("aidfinder:background", "sanctuary-b");
});
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(3200);
await page.screenshot({ path: `${OUT}/product-home.png` });
console.log("home");

await page.click('.gd-nav__item[aria-label="Risk"]');
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/product-risk.png` });
console.log("risk");

await page.click('.gd-nav__item[aria-label="Readiness"]');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/product-readiness.png` });
console.log("readiness");

await page.click('.gd-nav__item[aria-label="Recovery"]');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/product-recovery.png` });
console.log("recovery");

await browser.close();
