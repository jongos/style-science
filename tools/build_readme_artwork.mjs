import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Rasterize our own typography with the existing host browser; never download one.
if (!process.env.PLAYWRIGHT_MODULE || !process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
  throw new Error('Set PLAYWRIGHT_MODULE and PLAYWRIGHT_EXECUTABLE_PATH to existing host tools.');
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const root = fileURLToPath(new URL('../', import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
try {
  for (const [name, width] of [['desktop', 960], ['mobile', 400]]) {
    const page = await browser.newPage({ viewport: { width, height: 600 }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(resolve(root, 'docs/readme-artwork.html')).href);
    await page.evaluate(() => document.fonts.ready);
    const valid = await page.evaluate(() => document.fonts.check('580 42px Inter') && document.documentElement.scrollWidth === innerWidth);
    if (!valid) throw new Error(`Font or overflow failure: ${name}`);
    await page.locator('main').screenshot({ path: resolve(root, `docs/assets/readme-${name}.png`) });
    console.log(`Rendered ${name}: Inter loaded, no horizontal overflow.`);
    await page.close();
  }
} finally {
  await browser.close();
}
