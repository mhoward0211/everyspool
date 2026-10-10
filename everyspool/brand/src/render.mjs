// Renders the brand images that need the Bricolage Grotesque font.
// Runs in GitHub Actions (see .github/workflows/brand.yml), or locally:
//   npx playwright install chromium && node brand/src/render.mjs
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "..");
const page = (file, q = "") => pathToFileURL(path.join(here, file)).href + q;

const browser = await chromium.launch();
const tab = await browser.newPage({ deviceScaleFactor: 1 });

async function shot(url, selector, file, transparent) {
  await tab.goto(url, { waitUntil: "networkidle" });
  await tab.evaluate(() => document.fonts.ready);
  const ok = await tab.evaluate(() => document.fonts.check("700 100px 'Bricolage Grotesque'"));
  if (!ok) throw new Error("Bricolage Grotesque didn't load; refusing to render with a fallback font.");
  await tab.locator(selector).screenshot({ path: path.join(out, file), omitBackground: transparent });
  console.log("wrote", file);
}

await shot(page("wordmark.html"), "#wordmark", "wordmark.png", true);
await shot(page("wordmark.html", "?theme=dark"), "#wordmark", "wordmark-dark.png", true);
await tab.setViewportSize({ width: 1200, height: 630 });
await shot(page("og.html"), "#og", "og-image.png", false);
await browser.close();
