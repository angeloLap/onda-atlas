import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "icons");
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="38%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#0d2733"/>
      <stop offset="100%" stop-color="#050d13"/>
    </radialGradient>
    <radialGradient id="planet" cx="36%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#2c7a86"/>
      <stop offset="55%" stop-color="#123f52"/>
      <stop offset="100%" stop-color="#081a24"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="168" fill="none" stroke="#5eead4" stroke-opacity="0.18" stroke-width="2"/>
  <circle cx="256" cy="256" r="146" fill="url(#planet)"/>
  <g fill="none" stroke-linecap="round">
    <circle cx="256" cy="256" r="146" stroke="#8ff5e4" stroke-opacity="0.32" stroke-width="2"/>
    <path d="M110 256h292M256 110c66 62 96 146 96 146s-30 84-96 146c-66-62-96-146-96-146s30-84 96-146Z" stroke="#8ff5e4" stroke-opacity="0.2" stroke-width="2"/>
    <path d="M118 304c58-64 104 28 158-20s76 4 118-38" stroke="#5eead4" stroke-width="13"/>
    <path d="M118 336c58-64 104 28 158-20s76 4 118-38" stroke="#ff8a6b" stroke-opacity="0.85" stroke-width="8"/>
  </g>
  <circle cx="256" cy="256" r="7" fill="#ffffff"/>
  <circle cx="256" cy="256" r="16" fill="#5eead4" fill-opacity="0.22"/>
</svg>`;

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
});

const page = await browser.newPage({
  viewport: { width: 512, height: 512 },
  deviceScaleFactor: 1,
});

async function renderIcon(size, filename, padding = 0) {
  await page.setViewportSize({ width: size, height: size });
  const inner = padding
    ? `<g transform="translate(${padding} ${padding}) scale(${(512 - padding * 2) / 512})">${svg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>[\s\S]*$/g, "")}</g>`
    : null;
  await page.setContent(
    `<!doctype html><style>
      html, body { margin: 0; width: 100%; height: 100%; background: #050d13; overflow: hidden; }
      svg { width: 100%; height: 100%; display: block; }
    </style>${
      inner
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#050d13"/>${inner}</svg>`
        : svg
    }`,
    { waitUntil: "load" },
  );
  await page.screenshot({
    path: path.join(outDir, filename),
    omitBackground: false,
  });
}

await renderIcon(180, "icon-180.png");
await renderIcon(192, "icon-192.png");
await renderIcon(512, "icon-512.png");
await renderIcon(512, "icon-maskable-512.png", 56);

await browser.close();
console.log("Icone generate in public/icons");
