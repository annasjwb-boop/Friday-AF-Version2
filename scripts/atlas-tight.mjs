// One-off: extra-tight close-up to inspect shadows and grain.
import { chromium } from "playwright-core";

const label = process.argv[2] ?? "Castle";
const port = process.argv[3] ?? "5273";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await page.emulateMedia({ reducedMotion: "reduce" });
page.on("pageerror", (err) => console.log("[pageerror]", err.message));
await page.addInitScript((id) => {
  localStorage.setItem("aidfinder:background", "atlas");
  localStorage.setItem("aidfinder:theme", "dark");
  localStorage.setItem("aidfinder:atlas-model", id);
}, label.toLowerCase());
await page.goto(`http://localhost:${port}/`, { waitUntil: "load" });
await page.waitForTimeout(15000);

await page.mouse.move(236, 470);
await page.mouse.wheel(0, -2400);
await page.waitForTimeout(2500);
await page.mouse.wheel(0, -2400);
await page.waitForTimeout(3500);

const path = `/tmp/atlas-tight-${label.toLowerCase()}.png`;
await page.screenshot({ path });
console.log("saved", path);
await browser.close();
