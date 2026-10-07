import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const root = fileURLToPath(new URL("../site/", import.meta.url));
const evidence =
  process.env.SITE_EVIDENCE_DIR ||
  fileURLToPath(new URL("../dist/site-evidence/", import.meta.url));
await mkdir(evidence, { recursive: true });
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".md": "text/plain",
  ".txt": "text/plain",
};
const server = createServer(async (req, res) => {
  try {
    const path = resolve(
      root,
      "." +
        decodeURIComponent(
          new URL(req.url, "http://localhost").pathname,
        ).replace(/\/$/, "/index.html"),
    );
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep))
      throw Error("Path outside site");
    const data = await readFile(path);
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ headless: true });
const reports = [];
try {
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(() => document.fonts.ready);
    assert(
      await page.evaluate(() => document.fonts.check("16px Inter")),
      "Font failed to load",
    );
    assert.equal(
      await page.evaluate(
        () =>
          Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          ) > innerWidth,
      ),
      false,
      `Overflow at ${width}`,
    );
    assert.equal(await page.locator(".principle").count(), 8);
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')]
        .filter((a) => !document.getElementById(a.hash.slice(1)))
        .map((a) => a.hash),
    );
    assert.deepEqual(missing, []);
    await page.locator("#interval").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("#interval-value").textContent(), "25");
    assert.equal(
      await page.locator('[data-point="0"]').getAttribute("cx"),
      "205",
    );
    await page.locator("#interval").fill("56");
    assert.equal(
      await page.locator('[data-point="6"]').getAttribute("cx"),
      "448",
    );
    await page.locator("#interval").fill("24");
    await page.addScriptTag({
      path:
        process.env.AXE_SCRIPT ||
        fileURLToPath(import.meta.resolve("axe-core/axe.min.js")),
    });
    const audit = await page.evaluate(() =>
      axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      }),
    );
    assert.deepEqual(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
      `Accessibility violations at ${width}`,
    );
    assert.deepEqual(errors, []);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: resolve(evidence, `page-${width}.png`),
      fullPage: true,
    });
    if (width === 1440) {
      await page.screenshot({ path: resolve(evidence, "hero.png") });
      await page
        .locator(".experiment")
        .screenshot({ path: resolve(evidence, "experiment.png") });
    }
    reports.push({
      width,
      overflow: false,
      localFont: true,
      principles: 8,
      keyboardInteraction: "pass",
      axeViolations: 0,
      axeIncomplete: audit.incomplete.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
    await page.close();
  }
  await writeFile(
    resolve(evidence, "report.json"),
    JSON.stringify({ checkedAt: new Date().toISOString(), reports }, null, 2),
  );
  console.log(JSON.stringify(reports, null, 2));
} finally {
  await browser.close();
  server.close();
}
