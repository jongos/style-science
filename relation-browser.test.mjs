import test from 'node:test';
import assert from 'node:assert/strict';
import { runRenderedStudy } from './evaluation/relation-study/run.mjs';

test('rendered relation counterexamples, scope gates and Python parity', async () => {
  const report = await runRenderedStudy();
  assert.equal(report.fixtures, 11);
  assert.equal(report.conditionCount, 44);
  assert.equal(report.parityComparisons, 24);
  assert.equal(report.generatedPages, 57);
  assert.ok(report.decisions.filter(x => x.action === 'reject').length >= 3);
  assert.deepEqual(report.screenshotPaths, []);
});
