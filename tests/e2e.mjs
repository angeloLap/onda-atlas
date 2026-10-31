import { chromium } from "playwright-core";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "test-artifacts");
const url = "http://localhost:4173";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function waitForServer(target, timeout = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(target);
      if (response.ok) return;
    } catch {
      // not ready
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Server di anteprima non avviato");
}

await rm(artifacts, { recursive: true, force: true });
await mkdir(artifacts, { recursive: true });

const server = spawn(
  "cmd",
  ["/c", "npm", "run", "preview", "--", "--port", "4173", "--strictPort"],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
);

let serverLog = "";
server.stdout.on("data", (data) => {
  serverLog += data.toString();
});
server.stderr.on("data", (data) => {
  serverLog += data.toString();
});

let browser;

async function state(page) {
  return page.evaluate(() => window.__onda?.getState());
}

try {
  await waitForServer(url);
  browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "it-IT",
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);

  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="globe"]');
  await page.waitForSelector(".pin");

  const pins = await page.locator(".pin").count();
  assert(pins === 6, `devono esserci 6 pin, trovati ${pins}`);

  // Rotazione del globo con drag
  const before = await page.evaluate(
    () => window.__ondaGlobe.getRotation().lambda,
  );
  const box = await page.locator('[data-testid="globe"]').boundingBox();
  assert(box, "il canvas del globo deve avere dimensioni");
  await page.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.72);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width * 0.55,
    box.y + box.height * 0.72,
    { steps: 12 },
  );
  await page.mouse.up();
  const after = await page.evaluate(
    () => window.__ondaGlobe.getRotation().lambda,
  );
  assert(
    Math.abs(after - before) > 1,
    `il drag deve ruotare il globo (${before} -> ${after})`,
  );

  // Pinch-to-zoom sintetico (due dita)
  const zoomBefore = await page.evaluate(
    () => window.__ondaGlobe.getRotation().zoom,
  );
  await page.evaluate(() => {
    const element = document.querySelector(".globe");
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const fire = (type, id, x, y) =>
      element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: id,
          pointerType: "touch",
          isPrimary: id === 1,
          clientX: x,
          clientY: y,
        }),
      );
    fire("pointerdown", 1, cx - 40, cy);
    fire("pointerdown", 2, cx + 40, cy);
    fire("pointermove", 2, cx + 150, cy);
    fire("pointerup", 2, cx + 150, cy);
    fire("pointerup", 1, cx - 40, cy);
  });
  await page.waitForTimeout(350);
  const zoomAfter = await page.evaluate(
    () => window.__ondaGlobe.getRotation().zoom,
  );
  assert(
    zoomAfter > zoomBefore + 0.1,
    `il pinch deve aumentare lo zoom (${zoomBefore} -> ${zoomAfter})`,
  );

  // Ripristina uno zoom ragionevole per gli screenshot
  await page.evaluate(() => {
    const element = document.querySelector(".globe");
    element.dispatchEvent(
      new WheelEvent("wheel", { deltaY: 2000, bubbles: true, cancelable: true }),
    );
    element.dispatchEvent(
      new WheelEvent("wheel", { deltaY: -150, bubbles: true, cancelable: true }),
    );
  });
  await page.waitForTimeout(200);

  // PWA
  const manifest = await page.evaluate(async () => {
    const response = await fetch("/manifest.webmanifest");
    return response.json();
  });
  assert(
    typeof manifest.name === "string" && manifest.name.includes("Onda Atlas"),
    "il manifest PWA deve essere disponibile",
  );
  const serviceWorkerReady = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    return Promise.race([
      navigator.serviceWorker.ready.then((registration) =>
        Boolean(registration.active),
      ),
      new Promise((resolve) => setTimeout(() => resolve(false), 8000)),
    ]);
  });
  assert(serviceWorkerReady === true, "il service worker deve essere attivo");

  await page.screenshot({
    path: path.join(artifacts, "onda-home.png"),
    fullPage: false,
  });

  // Seleziona l'Amazzonia dal pannello esplora
  await page
    .locator('.explore-row', { hasText: "Amazzonia" })
    .click();
  await page.waitForSelector('.place-panel[aria-label="Dettagli di Amazzonia"]');
  assert(
    (await page.locator(".panel-heading h2").innerText()) === "Amazzonia",
    "il pannello deve mostrare l'Amazzonia",
  );

  // Avvia il paesaggio sonoro
  await page.getByRole("button", { name: /Ascolta questo luogo/ }).click();
  await page.waitForTimeout(1800);
  const audioState = await state(page);
  assert(audioState.playing === true, "lo stato deve essere in riproduzione");
  assert(
    audioState.placeId === "amazzonia",
    `il luogo in ascolto deve essere amazzonia, trovato ${audioState.placeId}`,
  );
  assert(
    audioState.context === "running",
    `AudioContext deve essere running, trovato ${audioState.context}`,
  );
  assert(audioState.elapsed >= 1, "il timer di sessione deve avanzare");
  console.log("AUDIO:", JSON.stringify(audioState.context));

  // Stagione
  await page.locator('select[aria-label="Stagione"]').selectOption("inverno");
  await page.waitForTimeout(200);
  const winterState = await state(page);
  assert(winterState.season === "inverno", "la stagione deve cambiare");

  // Livello audio
  const airSlider = page.locator('input[aria-label="Livello Aria"]');
  await airSlider.evaluate((element) => {
    const input = element;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(input, "20");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(200);
  const layerState = await state(page);
  assert(
    Math.abs(layerState.layers.air - 0.2) < 0.02,
    `il livello Aria deve essere 0.2, trovato ${layerState.layers.air}`,
  );

  // Luogo successivo
  await page.locator(".panel-footer .text-button").click();
  await page.waitForTimeout(500);
  const nextState = await state(page);
  assert(
    nextState.currentId !== "amazzonia",
    "il luogo successivo deve cambiare",
  );
  assert(nextState.playing === true, "il nuovo luogo deve continuare a suonare");

  // Diario
  await page.getByRole("button", { name: "Diario" }).first().click();
  await page.waitForSelector(".journal-card");
  const journalCards = await page.locator(".journal-card").count();
  assert(journalCards >= 1, "il diario deve contenere almeno una visita");

  const amazonCard = page.locator(".journal-card", { hasText: "Amazzonia" });
  assert(
    (await amazonCard.count()) === 1,
    "il diario deve contenere l'Amazzonia",
  );
  await amazonCard.locator("textarea").fill("Prima nota di viaggio");
  await page.waitForTimeout(250);
  const notedState = await state(page);
  assert(
    notedState.visits.some(
      (visit) =>
        visit.placeId === "amazzonia" &&
        visit.note === "Prima nota di viaggio",
    ),
    "la nota deve essere salvata",
  );

  await page.screenshot({
    path: path.join(artifacts, "onda-diario.png"),
    fullPage: false,
  });

  // Persistenza dopo reload
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".pin");
  await page.getByRole("button", { name: "Diario" }).first().click();
  await page.waitForSelector(".journal-card");
  const restoredNote = await page
    .locator(".journal-card", { hasText: "Amazzonia" })
    .locator("textarea")
    .inputValue();
  assert(
    restoredNote === "Prima nota di viaggio",
    `la nota deve persistere, trovata "${restoredNote}"`,
  );

  // Luoghi
  await page.getByRole("button", { name: "Luoghi" }).first().click();
  await page.waitForSelector(".place-card");
  const cards = await page.locator(".place-card").count();
  assert(cards === 6, `devono esserci 6 schede luogo, trovate ${cards}`);

  await page.screenshot({
    path: path.join(artifacts, "onda-luoghi.png"),
    fullPage: false,
  });

  // Informazioni
  await page.locator(".sidebar-foot button").click();
  await page.waitForSelector(".about-view");
  assert(
    (await page.locator(".about-view h1").innerText()).includes(
      "Un atlante",
    ),
    "la vista Informazioni deve essere renderizzata",
  );

  // Torna all'atlante e riapri l'Amazzonia per lo screenshot
  await page
    .getByRole("button", { name: "Atlante" })
    .first()
    .click();
  await page
    .locator('.explore-row', { hasText: "Amazzonia" })
    .click();
  await page.getByRole("button", { name: /Ascolta questo luogo/ }).click();
  await page.waitForTimeout(1400);

  await page.screenshot({
    path: path.join(artifacts, "onda-desktop.png"),
    fullPage: false,
  });

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  const sidebarVisible = await page.locator(".sidebar").isVisible();
  const mobileNavVisible = await page.locator(".mobile-nav").isVisible();
  const playVisible = await page.locator(".play-button").isVisible();
  assert(!sidebarVisible, "la sidebar deve essere nascosta su mobile");
  assert(mobileNavVisible, "la navigazione mobile deve essere visibile");
  assert(playVisible, "il controllo play deve restare visibile su mobile");

  await page.screenshot({
    path: path.join(artifacts, "onda-mobile.png"),
    fullPage: false,
  });

  await page.locator(".panel-close").click();
  await page.waitForTimeout(450);
  await page.screenshot({
    path: path.join(artifacts, "onda-mobile-home.png"),
    fullPage: false,
  });

  // Landscape
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(artifacts, "onda-landscape.png"),
    fullPage: false,
  });
  const landscapeGlobe = await page.locator(".globe").boundingBox();
  assert(
    Boolean(landscapeGlobe && landscapeGlobe.height > 120),
    "il globo deve restare visibile in landscape",
  );

  assert(errors.length === 0, `errori nel browser: ${errors.join(" | ")}`);

  // Offline: prima ricarica online per far controllare gli asset dal service worker
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".pin");
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".pin", { timeout: 12000 });
  assert(
    await page.locator(".topbar").isVisible(),
    "la shell PWA deve caricare offline",
  );
  await context.setOffline(false);

  console.log("E2E OK");
  console.log(`Screenshot: ${artifacts}`);
} catch (error) {
  console.error(serverLog);
  throw error;
} finally {
  if (browser) await browser.close();
  spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
    stdio: "ignore",
  });
}
