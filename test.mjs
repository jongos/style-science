import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, cp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolvePython } from "./tools/python.mjs";
import {
  contrast,
  fingerprint,
  verify,
  validatePlan,
  filterCandidates,
} from "./engine.mjs";
const root = fileURLToPath(new URL(".", import.meta.url));
const plan = JSON.parse(
  await readFile(new URL("examples/plan.json", import.meta.url), "utf8"),
);
test("portable knowledge retains hashes, resolved graph edges and untested research status", async () => {
  const inventory = JSON.parse(
    await readFile(
      new URL("knowledge/inventory.json", import.meta.url),
      "utf8",
    ),
  );
  for (const e of inventory.entries)
    assert.equal(
      createHash("sha256")
        .update(await readFile(new URL("knowledge/" + e.file, import.meta.url)))
        .digest("hex"),
      e.sha256,
    );
  const graph = JSON.parse(
    await readFile(new URL("knowledge/graph.json", import.meta.url), "utf8"),
  );
  const ids = new Set(graph.nodes.map((n) => n.id));
  assert.equal(ids.size, inventory.entries.length);
  for (const edge of graph.edges)
    assert.ok(ids.has(edge.from) && ids.has(edge.to));
  const protocol = JSON.parse(
    await readFile(
      new URL("evaluation/protocol.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(protocol.status, "design-only-not-preregistered");
  assert.equal(protocol.results, null);
});
function snapshots(p = plan) {
  return p.environments.map((environment) => ({
    environment,
    planHash: fingerprint(p),
    measurements: {
      overflow: {
        scrollWidth: environment.width,
        clientWidth: environment.width,
      },
      title: { visible: true, text: "GDC probe" },
      contrast: { foreground: "#000000", background: "#ffffff" },
      lock: { value: "rgb(0, 0, 0)" },
    },
  }));
}
test("exact numerical constraints, no rounding and no vacuous pass", () => {
  assert.equal(contrast("#000000", "#ffffff"), 21);
  assert.equal(contrast("#808080", "#808080"), 1);
  assert.equal(verify(plan, snapshots()).status, "pass");
  assert.equal(verify(plan, []).status, "unknown");
  const missing = snapshots();
  delete missing[0].measurements.title;
  assert.equal(verify(plan, missing).status, "unknown");
  const overflow = snapshots();
  overflow[0].measurements.overflow.scrollWidth += 0.1;
  assert.equal(verify(plan, overflow).status, "fail");
  const p = structuredClone(plan);
  const ratio = contrast("#777777", "#ffffff");
  p.requirements.find((r) => r.id === "contrast").minRatio = ratio + 0.000001;
  const s = snapshots(p);
  s[0].measurements.contrast.foreground = "#777777";
  assert.equal(verify(p, s).status, "fail");
  for (const mutate of [
    (p) => (p.requirements = []),
    (p) => (p.environments = []),
    (p) => (p.requirements[0].check = "beauty"),
    (p) => (p.requirements[0].minRatio = 4.5),
    (p) => (p.environments[0].width = true),
    (p) => p.requirements.push(p.requirements[0]),
  ]) {
    const invalid = structuredClone(plan);
    mutate(invalid);
    assert.throws(() => validatePlan(invalid));
  }
});
test("stale evidence, unsupported observations and failing constraints cannot become eligible", () => {
  const stale = snapshots();
  stale[0].planHash = "old";
  assert.equal(verify(plan, stale).status, "unknown");
  const wrong = snapshots();
  wrong[0].environment = { ...wrong[0].environment, width: 20 };
  assert.equal(verify(plan, wrong).status, "unknown");
  const bad = snapshots();
  bad[0].measurements.contrast = { unknown: "gradient" };
  assert.equal(verify(plan, bad).status, "unknown");
  bad[0].measurements.title.visible = false;
  assert.equal(verify(plan, bad).status, "fail");
  assert.deepEqual(
    filterCandidates(plan, [
      { id: "good", snapshots: snapshots() },
      { id: "bad", snapshots: bad },
      { id: "missing", snapshots: [] },
    ]).eligible,
    ["good"],
  );
  assert.throws(() => verify(plan, [...snapshots(), snapshots()[0]]));
});
test("Python and JavaScript consumers agree on portable fixture outcomes", async () => {
  const pythonCommand = resolvePython();
  const temp = await mkdtemp(path.join(tmpdir(), "gdc-conformance-"));
  try {
    // Run from a copied package outside Dazzler, without node_modules or skill prompts.
    await cp(root, path.join(temp, "gdc"), {
      recursive: true,
      filter: (p) =>
        !path
          .relative(root, p)
          .split(path.sep)
          .some((x) =>
            ["__pycache__", ".git", "node_modules", "dist"].includes(x),
          ),
    });
    const cases = [snapshots(), [], snapshots(), snapshots(), snapshots()];
    cases[2][0].measurements.contrast = {
      foreground: "#777777",
      background: "#ffffff",
    };
    cases[3][0].measurements.title.visible = false;
    cases[4][0].planHash = "wrong";
    for (let i = 0; i < cases.length; i++) {
      const input = path.join(temp, "snapshots.json");
      await writeFile(input, JSON.stringify(cases[i]));
      const python = spawnSync(
        pythonCommand,
        [
          "-X",
          "utf8",
          path.join(temp, "gdc", "gdc.py"),
          path.join(temp, "gdc", "examples", "plan.json"),
          input,
        ],
        { encoding: "utf8" },
      );
      assert.ok([0, 2].includes(python.status), python.stderr);
      const js = spawnSync(
        process.execPath,
        [
          path.join(temp, "gdc", "engine.mjs"),
          path.join(temp, "gdc", "examples", "plan.json"),
          input,
        ],
        { encoding: "utf8" },
      );
      assert.equal(js.status, python.status);
      const a = JSON.parse(js.stdout),
        b = JSON.parse(python.stdout);
      assert.equal(a.planHash, b.planHash);
      assert.equal(a.status, b.status);
      assert.deepEqual(
        a.results.map((r) => [r.requirement, r.environment, r.status]),
        b.results.map((r) => [r.requirement, r.environment, r.status]),
      );
      a.results.forEach((r, j) => {
        if (typeof r.value === "number")
          assert.ok(Math.abs(r.value - b.results[j].value) < 1e-12);
      });
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
