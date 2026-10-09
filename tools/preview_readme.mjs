import { execFileSync } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, basename } from 'node:path';

// Optional review using GitHub's Markdown renderer and styles. No publication.
const root = fileURLToPath(new URL('../', import.meta.url));
const html = execFileSync('gh', ['api', 'markdown', '-F', 'text=@README.md', '-f', 'mode=gfm', '-f', 'context=jongos/style-science'], { cwd: root, encoding: 'utf8' });
if (!process.env.PLAYWRIGHT_MODULE || !process.env.PLAYWRIGHT_EXECUTABLE_PATH) throw new Error('Supply existing host Playwright and Chrome.');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
const out = resolve(root, 'dist/readme-review');
await mkdir(out, { recursive: true });
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.route('https://raw.githubusercontent.com/jongos/style-science/main/docs/assets/**', async route => {
      const name = basename(new URL(route.request().url()).pathname);
      if (!['readme-desktop.png', 'readme-mobile.png', 'design-study.png'].includes(name)) throw new Error('Unexpected preview asset');
      await route.fulfill({ contentType: 'image/png', body: await readFile(resolve(root, 'docs/assets', name)) });
    });
    await page.goto('https://github.com/jongos/style-science', { waitUntil: 'domcontentloaded' });
    await page.locator('article.markdown-body').first().waitFor();
    const shell = await page.evaluate(() => {
      const clone = document.documentElement.cloneNode(true);
      for (const script of clone.querySelectorAll('script')) script.remove();
      return '<!doctype html>' + clone.outerHTML;
    });
    // Freeze the public page shell so GitHub hydration cannot replace the draft.
    await page.goto('about:blank');
    await page.setContent(shell, { waitUntil: 'load' });
    const article = page.locator('article.markdown-body').first();
    await article.waitFor();
    await article.evaluate((element, content) => {
      element.innerHTML = content;
      for (const img of element.querySelectorAll('img')) img.src = `https://raw.githubusercontent.com/jongos/style-science/main/docs/assets/${img.getAttribute('src').split('/').pop()}`;
      for (const source of element.querySelectorAll('source')) source.srcset = `https://raw.githubusercontent.com/jongos/style-science/main/docs/assets/${source.getAttribute('srcset').split('/').pop()}`;
    }, html);
    await page.waitForFunction(() => [...document.querySelectorAll('article.markdown-body img')].every(img => img.complete && img.naturalWidth > 0));
    const state = await article.evaluate(element => ({
      overflow: element.scrollWidth > element.clientWidth,
      selectedMasthead: element.querySelector('picture img').currentSrc,
      commitments: [...element.querySelectorAll('strong')].filter(x => /^0[1-8] \/ /.test(x.textContent)).length,
      pictures: element.querySelectorAll('picture source').length,
    }));
    if (state.overflow || state.commitments !== 8 || state.pictures !== 1 || !state.selectedMasthead.includes(width < 600 ? 'mobile' : 'desktop')) throw new Error(JSON.stringify(state));
    await article.evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.evaluate(() => window.scrollBy({ top: -64, behavior: 'instant' }));
    await page.screenshot({ path: resolve(out, `readme-${width}.png`) });
    console.log(JSON.stringify({ width, ...state }));
    await page.close();
  }
} finally { await browser.close(); }
