import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5273";
const OUT = ".casita-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  localStorage.setItem("aidfinder:background", "casita");
  localStorage.removeItem("aidfinder:casita-metaphor");
});
await page.goto(BASE, { waitUntil: "load" });
await page.waitForTimeout(3500);

// Tap the diorama to open the picker
await page.click(".casita__stage", { position: { x: 215, y: 150 } });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/picker-open.png` });

// Cycle forward twice (sanctuary -> castle -> cabin)
await page.click(".home-picker__arrow--next");
await page.waitForTimeout(1800);
await page.click(".home-picker__arrow--next");
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/picker-cabin.png` });

// Commit the choice
await page.click(".home-picker__cta");
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/picker-selected.png` });

// Reload to prove persistence
await page.goto(BASE, { waitUntil: "load" });
await page.waitForTimeout(3500);
await page.screenshot({ path: `${OUT}/picker-persisted.png` });

const stored = await page.evaluate(() =>
  localStorage.getItem("aidfinder:casita-metaphor"),
);
console.log("stored metaphor:", stored);

await browser.close();
