import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {verifyUpstreamManifest} from './upstream-drift.mjs';

test('upstream manifest has no local drift', async()=>{
  const manifest=JSON.parse(await readFile(new URL('../knowledge/upstream-manifest.json',import.meta.url),'utf8'));
  const report=await verifyUpstreamManifest(manifest);
  assert.equal(report.drift,false);
  assert.ok(report.results.some(r=>r.entry==='hue3-palettes' && r.status==='match'));
});