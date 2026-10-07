// Original host-supplied Playwright Page adapter. Apache-2.0.
// Does not launch browsers, navigate, click, install dependencies, or fetch content.
import { validatePlan, fingerprint } from "./engine.mjs";
export async function capture(page, plan, environmentId) {
  validatePlan(plan);
  const environment = plan.environments.find((e) => e.id === environmentId);
  if (!environment) throw Error("Undeclared environment");
  const payload = await page.evaluate(async (requirements) => {
    await document.fonts.ready;
    const measurements = {};
    const hex = (color) => {
      const m =
        /^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/.exec(
          color,
        );
      if (!m || (m[4] !== undefined && Number(m[4]) !== 1)) return null;
      const rgb = m.slice(1, 4).map(Number);
      if (rgb.some((c) => !Number.isInteger(c) || c < 0 || c > 255))
        return null;
      return "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
    };
    for (const r of requirements) {
      try {
        if (r.check === "viewport-overflow") {
          measurements[r.id] = {
            scrollWidth: Math.max(
              document.documentElement.scrollWidth,
              document.body?.scrollWidth || 0,
            ),
            clientWidth: document.documentElement.clientWidth,
          };
          continue;
        }
        const elements = document.querySelectorAll(r.selector);
        if (elements.length !== 1) {
          measurements[r.id] = {
            unknown:
              "Selector must identify exactly one element; matched " +
              elements.length,
          };
          continue;
        }
        const el = elements[0],
          style = getComputedStyle(el),
          rect = el.getBoundingClientRect();
        let visible =
          rect.width > 0 && rect.height > 0 && style.visibility === "visible";
        for (let p = el; p; p = p.parentElement)
          if (Number(getComputedStyle(p).opacity) === 0) visible = false;
        if (r.check === "visible-text") {
          measurements[r.id] = { visible, text: el.innerText ?? "" };
          continue;
        }
        if (r.check === "style-equals") {
          measurements[r.id] = { value: style.getPropertyValue(r.property) };
          continue;
        }
        // Intentionally narrow coverage: leaf text on its own opaque, effect-free fill.
        // Images, transparency, nested paint and occlusion require a richer verifier.
        let unsupported =
          !visible || !el.textContent.trim() || el.children.length > 0;
        for (let p = el; p; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (
            Number(s.opacity) !== 1 ||
            s.filter !== "none" ||
            s.backdropFilter !== "none" ||
            s.mixBlendMode !== "normal" ||
            s.transform !== "none"
          )
            unsupported = true;
          for (const pseudo of ["::before", "::after"])
            if (
              !["none", "normal", '""'].includes(
                getComputedStyle(p, pseudo).content,
              )
            )
              unsupported = true;
        }
        if (
          style.backgroundImage !== "none" ||
          style.textShadow !== "none" ||
          style.backgroundClip === "text"
        )
          unsupported = true;
        const foreground = hex(style.color),
          background = hex(style.backgroundColor);
        measurements[r.id] =
          unsupported || !foreground || !background
            ? {
                unknown:
                  "Contrast adapter supports only visible leaf text on its own opaque solid background without paint effects; inspect other cases separately",
              }
            : { foreground, background };
      } catch (error) {
        measurements[r.id] = { unknown: error.message };
      }
    }
    return {
      actual: {
        width: innerWidth,
        height: innerHeight,
        colorScheme: matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      },
      measurements,
    };
  }, plan.requirements);
  return {
    schemaVersion: 1,
    planHash: fingerprint(plan),
    environment: { id: environmentId, ...payload.actual },
    measurements: payload.measurements,
    adapter: "gdc-html/0.1.0",
    capturedAt: new Date().toISOString(),
  };
}
