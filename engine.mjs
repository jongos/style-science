// Original GDC-0 feasibility engine. Apache-2.0. No learned quality model.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const version = "0.1.0";
const checks = [
  "viewport-overflow",
  "visible-text",
  "text-contrast",
  "style-equals",
];
const object = (v, keys) => {
  if (
    !v ||
    typeof v !== "object" ||
    Array.isArray(v) ||
    Object.keys(v).some((k) => !keys.includes(k))
  )
    throw Error("Invalid or unknown fields");
};
const text = (v) => {
  if (typeof v !== "string" || !v.trim() || v.length > 4000)
    throw Error("Expected bounded nonempty string");
};
const unique = (values) => {
  if (new Set(values).size !== values.length) throw Error("Duplicate ID");
};
export function validatePlan(p) {
  object(p, [
    "schemaVersion",
    "id",
    "revision",
    "medium",
    "environments",
    "requirements",
  ]);
  if (p.schemaVersion !== 1 || p.medium !== "html")
    throw Error("Unsupported plan schema or medium");
  text(p.id);
  text(p.revision);
  if (
    !Array.isArray(p.environments) ||
    !p.environments.length ||
    p.environments.length > 32
  )
    throw Error("Declare 1–32 environments");
  if (
    !Array.isArray(p.requirements) ||
    !p.requirements.length ||
    p.requirements.length > 128
  )
    throw Error("Declare 1–128 requirements");
  for (const e of p.environments) {
    object(e, ["id", "width", "height", "colorScheme"]);
    text(e.id);
    for (const k of ["width", "height"])
      if (!Number.isInteger(e[k]) || e[k] < 1 || e[k] > 16384)
        throw Error("Invalid viewport");
    if (!["light", "dark"].includes(e.colorScheme))
      throw Error("Invalid color scheme");
  }
  unique(p.environments.map((e) => e.id));
  unique(p.requirements.map((r) => r.id));
  for (const r of p.requirements) {
    object(r, [
      "id",
      "check",
      "selector",
      "text",
      "minRatio",
      "property",
      "expected",
    ]);
    text(r.id);
    if (!checks.includes(r.check)) throw Error("Unsupported check: " + r.check);
    const required = r.check === "viewport-overflow" ? [] : ["selector"];
    if (r.check === "visible-text") required.push("text");
    if (r.check === "text-contrast") required.push("minRatio");
    if (r.check === "style-equals") required.push("property", "expected");
    for (const key of [
      "selector",
      "text",
      "minRatio",
      "property",
      "expected",
    ]) {
      if (required.includes(key)) {
        if (key === "minRatio") {
          if (!Number.isFinite(r[key]) || r[key] < 1 || r[key] > 21)
            throw Error("Contrast must be 1–21");
        } else text(r[key]);
      } else if (r[key] !== undefined)
        throw Error("Irrelevant requirement field: " + key);
    }
    if (
      r.property &&
      !/^(color|background-color|font-family|font-size|font-weight|line-height|letter-spacing|text-align)$/.test(
        r.property,
      )
    )
      throw Error("Unsupported computed style property");
  }
  return p;
}
function canonical(v) {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.keys(v)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(v[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}
export const fingerprint = (p) =>
  createHash("sha256")
    .update(canonical(validatePlan(p)))
    .digest("hex");
export function contrast(a, b) {
  const luminance = (hex) => {
    if (typeof hex !== "string" || !/^#[\da-f]{6}$/i.test(hex))
      throw Error("Opaque sRGB hex required");
    const c = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function measure(r, m) {
  if (!m || m.unknown)
    return { status: "unknown", detail: m?.unknown || "Measurement absent" };
  let pass, value;
  if (r.check === "viewport-overflow") {
    if (
      !Number.isFinite(m.scrollWidth) ||
      !Number.isFinite(m.clientWidth) ||
      m.clientWidth <= 0 ||
      m.scrollWidth < 0
    )
      throw Error("Invalid dimensions");
    value = Math.max(0, m.scrollWidth - m.clientWidth);
    pass = value === 0;
  } else if (r.check === "visible-text") {
    if (typeof m.visible !== "boolean" || typeof m.text !== "string")
      throw Error("Invalid visible text");
    value =
      m.visible &&
      m.text.replace(/\s+/g, " ").includes(r.text.replace(/\s+/g, " "));
    pass = value;
  } else if (r.check === "text-contrast") {
    value = contrast(m.foreground, m.background);
    pass = value >= r.minRatio;
  } else {
    if (typeof m.value !== "string") throw Error("Invalid computed style");
    value = m.value;
    pass = value === r.expected;
  }
  return { status: pass ? "pass" : "fail", value };
}
export function verify(plan, snapshots) {
  validatePlan(plan);
  if (!Array.isArray(snapshots)) throw Error("Snapshots must be an array");
  const hash = fingerprint(plan),
    ids = new Set(plan.environments.map((e) => e.id));
  unique(snapshots.map((s) => s.environment?.id));
  for (const s of snapshots)
    if (!ids.has(s.environment?.id)) throw Error("Undeclared environment");
  const results = [];
  for (const e of plan.environments) {
    const s = snapshots.find((s) => s.environment?.id === e.id);
    const compatible =
      s && s.planHash === hash && canonical(s.environment) === canonical(e);
    for (const r of plan.requirements) {
      let result;
      try {
        result = compatible
          ? measure(r, s.measurements?.[r.id])
          : {
              status: "unknown",
              detail: "Missing snapshot or mismatched plan/environment",
            };
      } catch (error) {
        result = { status: "unknown", detail: error.message };
      }
      results.push({
        environment: e.id,
        requirement: r.id,
        check: r.check,
        ...result,
      });
    }
  }
  const status = results.some((r) => r.status === "fail")
    ? "fail"
    : results.some((r) => r.status === "unknown")
      ? "unknown"
      : "pass";
  return {
    schemaVersion: 1,
    engineVersion: version,
    planHash: hash,
    status,
    results,
    scope:
      "Declared checks and captured states only; not accessibility certification or design quality. Supplied observations are not authenticated.",
  };
}
export function filterCandidates(plan, candidates) {
  if (!Array.isArray(candidates)) throw Error("Candidates must be an array");
  candidates.forEach((c) => text(c.id));
  unique(candidates.map((c) => c.id));
  const reports = candidates.map((c) => ({
    id: c.id,
    report: verify(plan, c.snapshots),
  }));
  return {
    eligible: reports
      .filter((c) => c.report.status === "pass")
      .map((c) => c.id),
    reports,
    selection:
      "No automatic aesthetic ranking. Compare feasible candidates using the brief and rendered review.",
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (process.argv.length !== 4)
      throw Error("Usage: node engine.mjs plan.json snapshots.json");
    const report = verify(
      JSON.parse(await readFile(process.argv[2], "utf8")),
      JSON.parse(await readFile(process.argv[3], "utf8")),
    );
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.status === "pass" ? 0 : 2;
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
