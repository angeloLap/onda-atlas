import { chromium } from "playwright-core";
import path from "node:path";

const url = "http://localhost:4174/onda-atlas/";
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "it-IT" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector(".pin");
const pins = await page.locator(".pin").count();
if (pins !== 6) throw new Error(`pin: ${pins}`);

const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
if (manifestHref !== "/onda-atlas/manifest.webmanifest") {
  throw new Error(`manifest href: ${manifestHref}`);
}

const manifest = await page.evaluate(async () => (await fetch("/onda-atlas/manifest.webmanifest")).json());
if (manifest.start_url !== "./" || manifest.scope !== "./") {
  throw new Error(`manifest scope: ${JSON.stringify(manifest)}`);
}

const sw = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
  ]);
  if (!registration) return null;
  return {
    scope: registration.scope,
    active: Boolean(registration.active),
  };
});
if (!sw || !sw.active || !sw.scope.endsWith("/onda-atlas/")) {
  throw new Error(`service worker: ${JSON.stringify(sw)}`);
}

await page.reload({ waitUntil: "networkidle" });
await context.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".pin", { timeout: 12000 });
await context.setOffline(false);

await page.screenshot({ path: path.join("test-artifacts", "onda-pages.png") });
if (errors.length) throw new Error(`errori: ${errors.join(" | ")}`);
console.log("PAGES OK", JSON.stringify(sw));
await browser.close();
