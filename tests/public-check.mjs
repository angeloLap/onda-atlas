import { chromium } from "playwright-core";
import path from "node:path";

const url = process.argv[2];
if (!url) throw new Error("Uso: node tests/public-check.mjs <url>");
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  locale: "it-IT",
});
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
const manifestResponse = await page.evaluate(async (href) => {
  const response = await fetch(href);
  return { status: response.status, body: await response.json() };
}, manifestHref);
if (!manifestResponse.body.name.includes("Onda Atlas")) {
  throw new Error(`manifest: ${JSON.stringify(manifestResponse)}`);
}

const sw = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
  ]);
  if (!registration) return null;
  return { scope: registration.scope, active: Boolean(registration.active) };
});
if (!sw || !sw.active) throw new Error(`service worker: ${JSON.stringify(sw)}`);

await page.reload({ waitUntil: "networkidle" });
await context.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".pin", { timeout: 15000 });
await context.setOffline(false);

await page.screenshot({
  path: path.join("test-artifacts", "onda-public.png"),
});
if (errors.length) throw new Error(`errori: ${errors.join(" | ")}`);
console.log("PUBLIC OK", JSON.stringify({ url, manifest: manifestHref, sw }));
await browser.close();
