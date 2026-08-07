import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5273";
const OUT = ".vault-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  localStorage.setItem("aidfinder:background", "vault");
});
await page.goto(BASE, { waitUntil: "load" });
await page.waitForTimeout(2500);

// Home, top of sheet
await page.screenshot({ path: `${OUT}/1-home-top.png` });

// Scroll to rooms + activity
await page.evaluate(() => {
  document.querySelector(".vault-rooms")?.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/2-home-rooms.png` });

// Open the documents sheet
await page.evaluate(() => {
  document.querySelector(".vault__sheet")?.scrollIntoView({ block: "start" });
  window.scrollTo(0, 0);
});
await page.waitForTimeout(400);
await page.click(".vault-link");
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/3-docs-sheet.png` });

// Start an upload → source picker
await page.click(".vault-doc__add");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/4-upload-source.png` });

// Choose a source → uploading
await page.click(".vault-upload__option");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/5-upload-progress.png` });

// AI verification checks
await page.waitForSelector(".vault-upload__checks", { timeout: 8000 });
await page.waitForTimeout(1700);
await page.screenshot({ path: `${OUT}/6-upload-verifying.png` });

// Done state, then auto-close back to docs
await page.waitForSelector(".vault-upload__done-check", { timeout: 8000 });
await page.screenshot({ path: `${OUT}/7-upload-done.png` });
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/8-docs-after.png` });

// Back home, open a room
await page.click(".vault-docs-sheet__back");
await page.waitForTimeout(600);
await page.evaluate(() => {
  document.querySelector(".vault-rooms")?.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(300);
await page.click(".vault-room");
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/9-room-detail.png` });

// Expand an unfinished item to reveal actions
await page.click(".vault-item__row:has(.vault-item__dot:not(.is-done))");
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/10-room-item-expanded.png` });

// Open the camera from the photo strip
await page.click(".vault-photos__add");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/11-capture-photo.png` });

// Take two photos
await page.click(".vault-capture__shutter");
await page.waitForTimeout(500);
await page.click(".vault-capture__shutter");
await page.waitForTimeout(500);

// Switch to video, record for 2s
await page.click(".vault-capture__mode:nth-child(2)");
await page.waitForTimeout(300);
await page.click(".vault-capture__shutter");
await page.waitForTimeout(2200);
await page.screenshot({ path: `${OUT}/12-capture-recording.png` });
await page.click(".vault-capture__shutter");
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/13-capture-strip.png` });

// Done → back to room with new tiles
await page.click(".vault-capture__done");
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/14-room-after-capture.png` });

await browser.close();
console.log("done");
