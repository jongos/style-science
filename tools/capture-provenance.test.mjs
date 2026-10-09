import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {captureInventory} from './capture-provenance.mjs';
test('retrospective capture bindings reproduce without inventing capture times',async()=>{
  const actual=await captureInventory();
  assert.deepEqual(actual,JSON.parse(await readFile(new URL('../evaluation/capture-provenance.json',import.meta.url),'utf8')));
  assert.equal(actual.records.length,8);
  assert.equal(actual.records.filter(x=>x.requestPath).reduce((sum,x)=>sum+x.judgmentCount,0),96);
  assert.ok(actual.records.every(x=>x.capturedAt===null && x.binding.startsWith('retrospective')));
});
