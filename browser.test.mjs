// Optional integration suite; host provides Playwright through GDC_PLAYWRIGHT_MODULE.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { capture } from "./html.mjs";
import { verify } from "./engine.mjs";
const { chromium } = await import(
  process.env.GDC_PLAYWRIGHT_MODULE || "playwright"
);
const plan = JSON.parse(
  await readFile(new URL("examples/plan.json", import.meta.url), "utf8"),
);
test("framework-neutral rendered observations detect actual pass, fail, and unsupported coverage", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
  try {
    const page = await browser.newPage();
    const snapshots = [];
    for (const env of plan.environments) {
      await page.setViewportSize({ width: env.width, height: env.height });
      await page.emulateMedia({ colorScheme: env.colorScheme });
      // A script-created tree represents the same rendered boundary used by frameworks.
      await page.setContent(
        '<main id="root"></main><script>(()=>{const h=document.createElement("h1"); h.textContent="GDC probe";h.style="color:#000;background:#fff";document.getElementById("root").append(h)})()</script>',
      );
      snapshots.push(await capture(page, plan, env.id));
    }
    assert.equal(
      verify(plan, snapshots).status,
      "pass",
      JSON.stringify(verify(plan, snapshots)),
    );
    await page.locator("h1").evaluate((el) => (el.style.color = "#eeeeee"));
    const bad = await capture(page, plan, "mobile");
    assert.equal(verify(plan, [snapshots[0], bad]).status, "fail");
    await page.locator("h1").evaluate((el) => {
      el.style.color = "#000";
      el.style.background = "linear-gradient(white,gray)";
    });
    assert.equal(
      verify(plan, [snapshots[0], await capture(page, plan, "mobile")]).status,
      "unknown",
    );
    await page.locator("h1").evaluate((el) => {
      el.style.background = "#fff";
      el.style.width = "2000px";
    });
    const overflow = verify(plan, [
      snapshots[0],
      await capture(page, plan, "mobile"),
    ]);
    assert.equal(
      overflow.results.find(
        (r) => r.environment === "mobile" && r.requirement === "overflow",
      ).status,
      "fail",
    );
    await page.setViewportSize({ width: 500, height: 844 });
    assert.equal(
      verify(plan, [snapshots[0], await capture(page, plan, "mobile")]).status,
      "unknown",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.setContent(
      '<h1 style="color:black;background:white;opacity:0">GDC probe</h1>',
    );
    assert.equal(
      verify(plan, [snapshots[0], await capture(page, plan, "mobile")]).status,
      "fail",
    );
  } finally {
    await browser.close();
  }
});
