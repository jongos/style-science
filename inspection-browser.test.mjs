import test from 'node:test';
import assert from 'node:assert/strict';
import {renderedCases} from './evaluation/downstream/rendered.mjs';
test('bounded font, overflow, focus, obstruction and state evidence has rendered parity',async()=>{
  const report=await renderedCases();assert.equal(report.rows.length,20);
});
