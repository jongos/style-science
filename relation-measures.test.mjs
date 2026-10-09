import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolvePython } from './tools/python.mjs';
import { design, makePlan, cases } from './evaluation/relation-study/fixtures.mjs';
import { validateRelationPlan, relationPlanFingerprint, evaluateRelationMeasure, verifyRelationMeasures } from './relation-measures.mjs';
import { captureRelationMeasures } from './relation-html.mjs';

const box = (left, top, width = 10, height = 10) => ({ left, top, width, height });
const plan = makePlan();
const snapshot = () => ({ schemaVersion: 1, planHash: relationPlanFingerprint(design, plan), designHash: plan.designHash,
  artifactRevision: design.revision, environment: plan.environments[0], adapter: 'synthetic', renderer: 'fixture-only',
  measurements: Object.fromEntries(plan.requirements.map(r => [r.id, r.instrument.startsWith('dom-') ? { value: true }
    : r.instrument === 'box-contains' ? { from: box(0, 0, 100, 100), to: box(10, 10) } : { from: box(0, 0), to: box(0, 20) }])) });
const snapshots = () => plan.environments.map(environment => ({ ...snapshot(), environment }));

test('relation plans bind declarations, selectors and environments and reject unsupported proxies', () => {
  assert.equal(validateRelationPlan(design, plan), plan);
  const changes = [p => { p.designHash = 'old'; }, p => { p.requirements = []; }, p => { p.bindings.pop(); },
    p => { p.bindings[0] = p.bindings[1]; }, p => { p.environments[0].width = true; },
    p => { p.requirements[0].instrument = 'font-size-proves-emphasis'; }, p => { p.requirements[0].relation = 'hierarchy'; },
    p => { p.requirements.push({ ...p.requirements[0], id: 'duplicate' }); }];
  for (const change of changes) { const p = structuredClone(plan); change(p); assert.throws(() => validateRelationPlan(design, p)); }
  const rebound = structuredClone(plan); rebound.bindings[0].selector = '.changed';
  assert.notEqual(relationPlanFingerprint(design, rebound), relationPlanFingerprint(design, plan));
});

test('signed geometry has exact boundary semantics and translation/positive-scale invariance', () => {
  for (const instrument of ['box-contains', 'y-before', 'x-before', 'x-after']) {
    for (const to of [box(5, 5), box(20, 20), box(-20, -20), box(0, 0)]) {
      const measurement = { from: box(0, 0, 20, 20), to };
      const a = evaluateRelationMeasure(instrument, measurement);
      for (const scale of [0.25, 1, 2, 4]) for (const offset of [-100, 0, 64]) {
        const transform = b => box(b.left*scale+offset, b.top*scale+offset, b.width*scale, b.height*scale);
        const b = evaluateRelationMeasure(instrument, { from: transform(measurement.from), to: transform(measurement.to) });
        assert.equal(b.status, a.status); assert.equal(b.value, a.value * scale);
      }
    }
  }
  assert.equal(evaluateRelationMeasure('y-before', { from: box(0, 0), to: box(0, 10) }).status, 'pass');
  assert.equal(evaluateRelationMeasure('y-before', { from: box(0, 0), to: box(0, 9.99999) }).status, 'fail');
  for (const malformed of [null, {}, { value: 'true' }, { value: true, confidence: 1 }, { unknown: '' }]) {
    assert.equal(evaluateRelationMeasure('dom-before', malformed).status, 'unknown');
  }
  for (const malformed of [box(0, 0, 0), box(NaN, 0), box(0, 0, true), box(1e308, 0, 1e308)]) {
    assert.equal(evaluateRelationMeasure('box-contains', { from: malformed, to: box(0, 0) }).status, 'unknown');
  }
});

test('measurement passes never become semantic verdicts or cover unprobed relationships', () => {
  const report = verifyRelationMeasures(design, plan, snapshots());
  assert.equal(report.status, 'pass'); assert.equal(report.semanticStatus, 'not-assessed');
  assert.equal(report.automaticSelection, false); assert.deepEqual(report.unprobedRelations, ['hierarchy', 'grouped']);
  assert.equal(verifyRelationMeasures(design, plan, []).status, 'unknown');
  for (const [key, value] of [['planHash', 'old'], ['designHash', 'old'], ['artifactRevision', 'old'], ['adapter', ''], ['schemaVersion', true]]) {
    const changed = snapshots(); changed[0][key] = value;
    assert.equal(verifyRelationMeasures(design, plan, changed).status, 'unknown');
  }
  const missing = snapshots(); delete missing[0].measurements['dom-order'];
  assert.equal(verifyRelationMeasures(design, plan, missing).status, 'unknown');
  missing[0].measurements['parent-title'].value = false;
  assert.equal(verifyRelationMeasures(design, plan, missing).status, 'fail');
  const wrongEnv = snapshots(); wrongEnv[0].environment = { ...wrongEnv[0].environment, width: 1 };
  assert.equal(verifyRelationMeasures(design, plan, wrongEnv).status, 'unknown');
  assert.throws(() => verifyRelationMeasures(design, plan, [snapshot(), snapshot()]));
});

test('collector freezes caller-owned declarations before its asynchronous boundary', async () => {
  const d = structuredClone(design), p = makePlan(), originalHash = relationPlanFingerprint(d, p);
  const fakePage = { evaluate: async () => {
    d.revision = 'changed'; p.bindings[0].selector = '.changed';
    return { environment: { width: 390, height: 844, colorScheme: 'light' }, measurements: {} };
  }, context: () => ({ browser: () => ({ version: () => 'fake-for-contract-test' }) }) };
  const captured = await captureRelationMeasures(fakePage, d, p, plan.environments[0].id);
  assert.equal(captured.planHash, originalHash); assert.equal(captured.artifactRevision, '1');
});

test('Python and JavaScript agree on plan hashes, geometry, malformed evidence and verification', () => {
  const wrongEnv = snapshots(); wrongEnv[0].environment = { ...wrongEnv[0].environment, width: true };
  const stale = snapshots(); stale[0].schemaVersion = true;
  const invalidPlan = structuredClone(plan); invalidPlan.environments[0].width = true;
  const calls = [ ['relation_plan_fingerprint', [design, plan]], ['validate_relation_plan', [design, invalidPlan]],
    ...[snapshots(), [], wrongEnv, stale].map(s => ['verify_relation_measures', [design, plan, s]]) ];
  for (const instrument of ['box-contains', 'y-before', 'x-before', 'x-after', 'dom-parent', 'dom-before']) {
    for (const m of [null, {}, { value: false }, { value: 1 }, { from: box(0, 0, 100, 100), to: box(10, 10) }, { from: box(0, 0, 100, 100), to: box(-0, -0) }, { from: box(0, 0, true), to: box(0, 0) }, { unknown: 'unsupported' }]) calls.push(['evaluate_relation_measure', [instrument, m]]);
  }
  const functions = { validate_relation_plan: validateRelationPlan, relation_plan_fingerprint: relationPlanFingerprint,
    evaluate_relation_measure: evaluateRelationMeasure, verify_relation_measures: verifyRelationMeasures };
  const expected = calls.map(([name, args]) => { try { return { result: functions[name](...args) }; } catch { return { error: true }; } });
  const source = `import json,sys,relation_measures\nresult=[]\nfor name,args in json.load(sys.stdin):\n try: result.append({'result':getattr(relation_measures,name)(*args)})\n except (ValueError,TypeError,OverflowError): result.append({'error':True})\nprint(json.dumps(result,allow_nan=False))`;
  const output = spawnSync(resolvePython(), ['-X', 'utf8', '-c', source], { cwd: fileURLToPath(new URL('.', import.meta.url)), input: JSON.stringify(calls), encoding: 'utf8', maxBuffer: 2**22 });
  assert.equal(output.status, 0, output.stderr || String(output.error));
  assert.deepEqual(JSON.parse(output.stdout), expected);
});

test('saved rendered evidence remains bound to its implementation and original fixtures', async () => {
  const report = JSON.parse(await readFile(new URL('./evaluation/relation-study/report.json', import.meta.url), 'utf8'));
  const paths = ['relation-measures.mjs', 'relation_measures.py', 'relation-html.mjs', 'language.mjs', 'language.py', 'engine.mjs', 'gdc.py', 'evaluation/relation-study/PROTOCOL.md', 'evaluation/relation-study/fixtures.mjs', 'evaluation/relation-study/run.mjs'];
  assert.deepEqual(Object.keys(report.sourceHashes), paths);
  for (const path of paths) {
    const source = (await readFile(new URL(path, import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
    assert.equal(createHash('sha256').update(source).digest('hex'), report.sourceHashes[path], path);
  }
  assert.equal(report.evidenceKind, 'synthetic-rendered-conformance');
  assert.equal(report.summary.length, cases.length);
  for (const fixture of cases) assert.deepEqual(report.summary.find(r => r.fixture === fixture.id).observedStatuses, fixture.expected);
  const escaped = report.summary.find(r => r.fixture === 'escaped-child').sampleValues;
  assert.equal(escaped['parent-title'].value, true); assert.ok(escaped['box-title'].value < 0);
  const reversed = report.summary.find(r => r.fixture === 'reversed-column').sampleValues;
  assert.equal(reversed['dom-order'].value, true); assert.ok(reversed['y-order'].value < 0);
});
