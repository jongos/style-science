import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { reviewConstraints } from './constraint-repair.mjs';
import { resolvePython } from './tools/python.mjs';
import { cases } from './evaluation/constraint-repair/fixtures.mjs';
import { compareCase, summarize } from './evaluation/constraint-repair/compare.mjs';

function parity(inputs) {
  const run = spawnSync(resolvePython(), ['-X', 'utf8', '-c', 'import json,sys; from constraint_repair import review_constraints; print(json.dumps([review_constraints(p) for p in json.load(sys.stdin)]))'], { encoding: 'utf8', input: JSON.stringify(inputs), timeout: 30000 });
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(JSON.parse(run.stdout), inputs.map(reviewConstraints));
}
const changed = fn => { const p = structuredClone(cases[1].problem); fn(p); return p; };

test('bounded repairs and minimal conflicts beat baselines on frozen synthetic splits', () => {
  const rows = cases.map(compareCase);
  for (const row of rows) {
    assert.ok(row.feasibilityCorrect && row.optimal && row.conflictCorrect, row.id);
    assert.ok(!row.candidate.lockViolation && (!row.candidate.proposal || row.candidate.valid), row.id);
    assert.equal(row.report.releaseEligible, false);
    assert.equal(row.report.automaticAction, false);
  }
  const summary = summarize(rows.filter(r => r.split === 'held-out'));
  assert.equal(summary.candidate.validRepairs, summary.repairable);
  assert.ok(summary.candidate.validRepairs > summary.local.validRepairs);
  assert.ok(summary.local.invalidProposals > 0);
  assert.ok(summary.irrelevantConstraintsRemoved > 0);
  parity(cases.map(c => c.problem));
});

test('invalid, unsupported, stale and over-budget inputs abstain in both runtimes', () => {
  const inputs = [null, [], {}, changed(p => p.version = true), changed(p => p.observedRevision = 'stale'),
    changed(p => p.requirements = []), changed(p => p.requirements.push(p.requirements[0])),
    changed(p => p.requirements[0].relation = 'lt'), changed(p => p.requirements[0].terms.z = 1),
    changed(p => p.requirements[0].terms.x = 0.5), changed(p => p.requirements[0].rhs = true),
    changed(p => p.variables.x.domain = [1, 1, 3]), changed(p => p.variables.x.value = 7),
    changed(p => delete p.variables.x.locked), changed(p => p.variables.x.locked = 1),
    changed(p => p.variables.x.unit = 'em'), changed(p => p.variables.x.value = null),
    changed(p => p.variables.x.domain = []), changed(p => p.variables.x.domain = [false, 3]),
    changed(p => p.extra = 'unsupported'), changed(p => p.variables.x.domain.push(1000001)),
    changed(p => { for (const n of ['x', 'y', 'z']) p.variables[n] = { value: 1, domain: Array.from({ length: 17 }, (_, i) => i), locked: false, unit: 'px' }; }),
  ];
  for (const p of inputs) { const r = reviewConstraints(p); assert.equal(r.status, 'unknown'); assert.equal(r.repair, null); assert.equal(r.conflict, null); }
  parity(inputs);
});

test('determinism, input binding, no mutation and exact search-budget boundary', () => {
  const p = structuredClone(cases[6].problem), before = JSON.stringify(p), r = reviewConstraints(p);
  assert.equal(JSON.stringify(p), before);
  assert.deepEqual(r.repair.values, { x: 2, y: 3 });
  const reordered = { ...p, variables: { y: p.variables.y, x: p.variables.x } };
  assert.deepEqual(reviewConstraints(reordered), r);
  const modified = structuredClone(p); modified.requirements[0].rhs = 4;
  assert.notEqual(reviewConstraints(modified).inputHash, r.inputHash);
  const boundary = changed(p => {
    for (const n of ['x', 'y', 'z']) p.variables[n] = { value: 15, domain: Array.from({ length: 16 }, (_, i) => i), locked: false, unit: 'px' };
    p.requirements = [{ id: 'sum', terms: { x: 1, y: 1, z: 1 }, relation: 'eq', rhs: 0 }];
  });
  assert.equal(reviewConstraints(boundary).evaluatedAssignments, 4096);
  assert.deepEqual(reviewConstraints(boundary).repair.values, { x: 0, y: 0, z: 0 });
  parity([reordered, modified, boundary]);
});

test('additional deterministic mixed-sign cases agree with independent enumeration', () => {
  let seed = 1031;
  const next = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed; };
  const fixtures = Array.from({ length: 120 }, (_, i) => ({ id: `supplement-${i}`, split: 'supplementary', family: 'mixed', problem: {
    version: 1, artifactRevision: 'synthetic', observedRevision: 'synthetic',
    variables: Object.fromEntries(['a', 'b', 'c'].map(n => [n, { value: next() % 2 ? -1 : 2, domain: [-1, 2], locked: next() % 5 === 0, unit: 'px' }])),
    requirements: Array.from({ length: 3 }, (_, j) => ({ id: `rule-${j}`, terms: { a: next() % 5 - 2, b: next() % 5 - 2, c: next() % 5 - 2 }, relation: ['le', 'ge', 'eq'][next() % 3], rhs: next() % 9 - 4 })),
  } }));
  for (const f of fixtures) { const r = compareCase(f); assert.ok(r.feasibilityCorrect && r.optimal && r.conflictCorrect, f.id); }
  parity(fixtures.map(f => f.problem));
});

test('saved comparison binds corpus and source bytes without treating timings as quality', async () => {
  const root = new URL('./', import.meta.url);
  const report = JSON.parse(await readFile(new URL('evaluation/constraint-repair/report.json', root)));
  const corpus = await readFile(new URL('evaluation/constraint-repair/cases.json', root));
  assert.deepEqual(JSON.parse(corpus), cases);
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash(corpus), report.corpusSha256);
  for (const [name, digest] of Object.entries(report.sources)) assert.equal(hash(await readFile(new URL(name, root))), digest, name);
  assert.deepEqual(report.rows, cases.map(compareCase));
  for (const split of ['development', 'held-out']) assert.deepEqual(report.summary[split], summarize(report.rows.filter(r => r.split === split)));
  assert.equal(report.releaseEligible, false);
});
