import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolvePython } from '../../tools/python.mjs';
import { captureRelationMeasures } from '../../relation-html.mjs';
import { verifyRelationMeasures } from '../../relation-measures.mjs';
import { design, makePlan, cases, html } from './fixtures.mjs';

export async function runRenderedStudy({ screenshots = false } = {}) {
  const { chromium } = await import(process.env.GDC_PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({ headless: true });
  const root = new URL('../../', import.meta.url);
  const conditionReports = [], parityCases = [], summary = [], screenshotPaths = [];
  let assertions = 0, generatedPages = 0;
  const check = (actual, expected) => { assert.deepEqual(actual, expected); assertions++; };
  const renderer = `Chromium ${browser.version()}`;
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    for (const fixture of cases) {
      const plan = makePlan();
      if (fixture.selector) plan.bindings.find(b => b.node === 'title').selector = fixture.selector;
      const snapshots = [];
      for (const environment of plan.environments) {
        await page.setViewportSize({ width: environment.width, height: environment.height });
        await page.emulateMedia({ colorScheme: environment.colorScheme });
        await page.setContent(html(fixture)); generatedPages++;
        snapshots.push(await captureRelationMeasures(page, design, plan, environment.id));
        if (screenshots && environment.colorScheme === 'light' && ['normal', 'escaped-child', 'reversed-column'].includes(fixture.id)) {
          const relative = `dist/relation-evidence/${fixture.id}-${environment.width}.png`;
          await mkdir(new URL('dist/relation-evidence/', root), { recursive: true });
          await page.screenshot({ path: fileURLToPath(new URL(relative, root)), fullPage: false });
          screenshotPaths.push(relative);
        }
      }
      const report = verifyRelationMeasures(design, plan, snapshots);
      for (const result of report.results) check(result.status, fixture.expected[result.requirement]);
      check(report.semanticStatus, 'not-assessed'); check(report.automaticSelection, false);
      check(report.unprobedRelations, ['hierarchy', 'grouped']);
      summary.push({ fixture: fixture.id, environments: plan.environments.length,
        observedStatuses: Object.fromEntries(report.results.filter(r => r.environment === plan.environments[0].id).map(r => [r.requirement, r.status])),
        sampleEnvironment: plan.environments[0].id,
        sampleValues: Object.fromEntries(report.results.filter(r => r.environment === plan.environments[0].id && Object.hasOwn(r, 'value')).map(r => [r.requirement, { value: r.value, unit: r.unit }])) });
      parityCases.push({ design, plan, snapshots }); conditionReports.push(report);
    }
    const single = makePlan(); single.environments = [single.environments[2]];
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'light' });
    let reference = null, invarianceConditions = 0;
    for (const scale of [1, 2]) for (const offset of [0, 24, 64]) {
      await page.setContent(html(cases[0], { scale, offset })); generatedPages++;
      const snapshot = await captureRelationMeasures(page, design, single, single.environments[0].id);
      const report = verifyRelationMeasures(design, single, [snapshot]);
      check(report.status, 'pass');
      const values = report.results.filter(r => r.unit === 'css-px').map(r => r.value / scale);
      if (reference === null) reference = values;
      check(values, reference); invarianceConditions++;
      parityCases.push({ design, plan: single, snapshots: [snapshot] }); conditionReports.push(report);
    }
    const scopeChecks = [];
    const expectUnknown = async (id, mutatedPlan, viewport = { width: 1280, height: 900 }, mutate = () => {}) => {
      await page.setViewportSize(viewport); await page.setContent(html()); generatedPages++;
      const snapshot = await captureRelationMeasures(page, design, mutatedPlan, mutatedPlan.environments[0].id);
      mutate(snapshot);
      const report = verifyRelationMeasures(design, mutatedPlan, [snapshot]);
      check(report.status, 'unknown'); scopeChecks.push({ id, status: report.status });
      parityCases.push({ design, plan: mutatedPlan, snapshots: [snapshot] }); conditionReports.push(report);
    };
    await expectUnknown('actual-viewport', single, { width: 1200, height: 900 });
    await expectUnknown('actual-theme', { ...single, environments: [{ ...single.environments[0], colorScheme: 'dark' }] });
    await expectUnknown('stale-artifact', single, undefined, snapshot => { snapshot.artifactRevision = 'old'; });
    await expectUnknown('stale-plan', single, undefined, snapshot => { snapshot.planHash = 'old'; });
    await expectUnknown('stale-design', single, undefined, snapshot => { snapshot.designHash = 'old'; });
    // Explicitly exercise the two horizontal predicates independently of text direction.
    const horizontalChecks = [];
    for (const instrument of ['x-before', 'x-after']) {
      const plan = structuredClone(single);
      plan.requirements = [{ id: 'horizontal', relation: 'reading-order', instrument }];
      const reverse = instrument === 'x-after';
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.setContent(html({ css: `#entry{display:flex;flex-direction:${reverse ? 'row-reverse' : 'row'};gap:8px}#title,#description{width:100px;flex:none}#description{margin-top:0}` })); generatedPages++;
      const snapshot = await captureRelationMeasures(page, design, plan, plan.environments[0].id);
      const report = verifyRelationMeasures(design, plan, [snapshot]);
      check(report.status, 'pass'); check(report.results[0].value, 8);
      horizontalChecks.push({ instrument, value: report.results[0].value, unit: 'css-px' });
      parityCases.push({ design, plan, snapshots: [snapshot] }); conditionReports.push(report);
    }
    const python = resolvePython();
    const code = 'import json,sys; from relation_measures import verify_relation_measures; print(json.dumps([verify_relation_measures(x["design"],x["plan"],x["snapshots"]) for x in json.load(sys.stdin)],allow_nan=False))';
    const output = spawnSync(python, ['-X', 'utf8', '-c', code], { cwd: fileURLToPath(root), input: JSON.stringify(parityCases), encoding: 'utf8', maxBuffer: 2**23 });
    assert.equal(output.status, 0, output.stderr || String(output.error));
    check(JSON.parse(output.stdout), conditionReports);
    const hashes = {};
    for (const path of ['relation-measures.mjs', 'relation_measures.py', 'relation-html.mjs', 'language.mjs', 'language.py', 'engine.mjs', 'gdc.py', 'evaluation/relation-study/PROTOCOL.md', 'evaluation/relation-study/fixtures.mjs', 'evaluation/relation-study/run.mjs']) {
      hashes[path] = createHash('sha256').update((await readFile(new URL(path, root), 'utf8')).replaceAll('\r\n', '\n')).digest('hex');
    }
    return { study: 'rendered-relationships-0.1.0', evidenceKind: 'synthetic-rendered-conformance', renderer,
      node: process.version, platform: process.platform,
      python: spawnSync(python, ['--version'], { encoding: 'utf8' }).stdout.trim(),
      generatedPages, fixtures: cases.length, conditionCount: cases.length * makePlan().environments.length,
      assertions, parityComparisons: parityCases.length, invarianceConditions,
      summary, scopeChecks, horizontalChecks, screenshotPaths, sourceHashes: hashes,
      decisions: [
        { feature: 'DOM-parent-as-visual-containment', action: 'reject', counterexample: 'escaped-child' },
        { feature: 'DOM-order-as-visual-order', action: 'reject', counterexample: 'reversed-column' },
        { feature: 'separate-DOM-and-border-box-instruments', action: 'retain', reason: 'The authored interventions distinguish these predicates and both consumers agree.' },
        { feature: 'automatic-perceived-grouping-or-emphasis', action: 'reject', reason: 'No validated perceptual instrument is supplied; these relationships remain unprobed.' },
      ],
      limitations: ['Authored regression cases, not independent research holdouts or human preference evidence.',
        'DOM order is not a meaningful-reading-order or accessibility verdict. Bounds are border boxes, not painted or occlusion-free regions.',
        'One installed Chromium runtime, not multi-browser or native-medium validation.',
        'No external website archive, corpus download, Jev calls, human study, model training or downstream upgrade.'] };
  } finally { await browser.close(); }
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runRenderedStudy({ screenshots: true });
  await writeFile(new URL('./report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ generatedPages: report.generatedPages, assertions: report.assertions, parityComparisons: report.parityComparisons, decisions: report.decisions }, null, 2));
}
