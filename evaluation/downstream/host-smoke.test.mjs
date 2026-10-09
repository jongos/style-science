import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('actual-host smoke record preserves all cases and conservative feature decisions',async()=>{
  const r=JSON.parse(await readFile(new URL('../host-smoke-20261008/report.json',import.meta.url),'utf8'));
  const bytes=await readFile(new URL('../../retrieval.mjs',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sourceHashes.researchRetrieval);
  assert.equal(r.rows.length,10);
  assert.equal(new Set(r.rows.flatMap(x=>x.request.contexts)).size,5);
  for(const row of r.rows) for(const key of ['baseline','filter','research']) assert.ok(row[key].ids.length<=3);
  assert.equal(r.metrics.filter.violatingBriefs,0);
  assert.equal(r.metrics.research.violatingBriefs,0);
  assert.equal(r.providerCalls,0);assert.equal(r.hostModified,false);
  assert.equal(r.rankingDecision,'retain-for-targeted-research');
  assert.ok(r.limitations.some(x=>x.includes('not a preregistered')));
});
