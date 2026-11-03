import { existsSync } from "node:fs";
import puppeteer, { type Browser } from "puppeteer-core";
import type { StageDoc } from "@stageplot/shared";

/**
 * Headless-Chrome renderer for the rider PDF.
 *
 * The layout itself lives in the web app's `/print` route, so the PDF is
 * produced from exactly the same components as the on-screen print view. We
 * only need to hand the doc to the page (via localStorage, before it boots),
 * wait for it to signal readiness, and print.
 */

const PRINT_URL = process.env.PRINT_URL ?? "http://localhost:5173/print";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].filter((path): path is string => Boolean(path));

function findChrome(): string {
  const found = CHROME_CANDIDATES.find((path) => existsSync(path));
  if (!found) {
    throw new Error(
      "No Chrome/Chromium found. Set CHROME_PATH to a Chrome binary, or use the " +
        "print view in the browser instead.",
    );
  }
  return found;
}

let browserPromise: Promise<Browser> | null = null;

/** Warm singleton browser; relaunch if Chrome died between requests. */
async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        executablePath: findChrome(),
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      })
      .then((browser) => {
        browser.once("disconnected", () => {
          browserPromise = null;
        });
        return browser;
      })
      .catch((err) => {
        browserPromise = null;
        throw err;
      });
  }
  return browserPromise;
}

// One render at a time keeps memory predictable and avoids Chrome thrash.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export function renderPdf(doc: StageDoc): Promise<Buffer> {
  return enqueue(async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
      await page.evaluateOnNewDocument((printDoc) => {
        localStorage.setItem("stageplot:print-doc", JSON.stringify(printDoc));
      }, doc);

      await page.goto(PRINT_URL, { waitUntil: "networkidle0", timeout: 30_000 });
      await page.waitForSelector('[data-print-ready="1"]', { timeout: 15_000 });

      // Orientation and margins come from the print sheet's @page rule.
      const pdf = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  });
}

/** Close the browser on shutdown (best effort). */
export async function closePdfRenderer(): Promise<void> {
  const current = browserPromise;
  browserPromise = null;
  if (!current) return;
  try {
    const browser = await current;
    await browser.close();
  } catch {
    /* already gone */
  }
}
