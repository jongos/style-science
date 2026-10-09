import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('offline comparison retains failures, scope, source bindings and disjoint brief IDs',async()=>{
  const report=JSON.parse(await readFile(new URL('./results.json',import.meta.url),'utf8'));
  for(const [path,stamp] of Object.entries(report.sourceHashes)) assert.equal(createHash('sha256').update(await readFile(new URL('../../'+path,import.meta.url))).digest('hex'),stamp,path);
  assert.ok(report.developmentIds.every(id=>!report.heldoutIds.includes(id)));
  assert.equal(new Set(report.rows.flatMap(x=>x.brief.contexts)).size,5);
  assert.equal(report.rows.length,10);assert.equal(report.metrics.baselineConstraintViolations,5);
  assert.equal(report.metrics.retrievalConstraintViolations,0);assert.equal(report.metrics.noFit,5);
  assert.equal(report.metrics.injectedDefects,12);assert.equal(report.metrics.detectedDefects,12);
  assert.equal(report.metrics.missedDefects,0);assert.equal(report.metrics.falseAlarms,0);
  assert.equal(report.metrics.unsupportedMeasurements,12);assert.equal(report.native.length,7);
  assert.ok(report.comparison.every(x=>x.expected===x.result.status));
  assert.ok(report.rendered.rows.every(x=>x.screenshot));
  assert.ok(report.native.every(x=>x.renderedEvidence===null));assert.equal(report.model,null);
  assert.equal(report.metrics.providerCost,0);assert.ok(report.unmeasured.includes('full Dazzler baseline'));
});
