import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5174";
const THEME = process.env.THEME ?? "";
const TAG = THEME ? `-${THEME}` : "";
const OUT = ".sanctuary-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

await page
  .goto(BASE, { waitUntil: "domcontentloaded" })
  .catch(() => page.goto(BASE, { waitUntil: "domcontentloaded" }));
await page.evaluate((theme) => {
  localStorage.setItem("aidfinder:background", "sanctuary-b");
  if (theme) localStorage.setItem("aidfinder:sanctuary-b-theme", theme);
}, THEME);
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/core-risk${TAG}.png`, animations: "disabled" });
console.log("risk");

await page.click('.sbc-tabs__tab[aria-label="Readiness"]');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/core-readiness${TAG}.png`, animations: "disabled" });
console.log("readiness");

// Expand one readiness section.
await page.click('.sbc-task:has-text("Property ownership")');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/core-readiness-open${TAG}.png`, animations: "disabled" });

// Asset library drill-in (light appearance).
await page.click('.sbc-task:has-text("Asset library")');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/core-assets${TAG}.png`, animations: "disabled" });
console.log("assets");
await page.click(".asset-sheet__back");
await page.waitForTimeout(700);

await page.click('.sbc-tabs__tab[aria-label="Recovery"]');
await page.waitForTimeout(1100);
await page.screenshot({ path: `${OUT}/core-recovery${TAG}.png`, animations: "disabled" });
console.log("recovery");

await browser.close();
