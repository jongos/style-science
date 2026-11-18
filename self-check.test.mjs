import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {runDesignSelfCheck, collectFontSizesPx, collectSpacingPx} from './self-check.mjs';
import {verifyUpstreamManifest} from './tools/upstream-drift.mjs';
import {resolvePython} from './tools/python.mjs';

test('design self-check passes declared contrast and CSS accessibility hints', async()=>{
  const input=JSON.parse(await readFile(new URL('./examples/self-check-input.json',import.meta.url),'utf8'));
  const report=runDesignSelfCheck(input);
  assert.equal(report.status,'pass');
  assert.equal(report.qualityClaim,false);
  const body=report.results.find(r=>r.id==='body-on-surface');
  assert.ok(body.ratio>=4.5);
  assert.equal(report.results.find(r=>r.id==='css-focus').status,'pass');
  assert.equal(report.results.find(r=>r.id==='css-reduced-motion').status,'pass');
  assert.ok(report.candidates.some(c=>c.id==='css-type-scale' && c.status==='pass'));
});

test('low contrast fails; unknown without pairs', ()=>{
  const fail=runDesignSelfCheck({contrastPairs:[{foreground:'#777777',background:'#888888'}],css:''});
  assert.equal(fail.results.find(r=>r.check==='contrast').status,'fail');
  const failCss=runDesignSelfCheck({css:'body{margin:0}'});
  assert.equal(failCss.status,'fail');
  assert.equal(runDesignSelfCheck({}).status,'unknown');
});

test('collectors normalize font-size and spacing lists', ()=>{
  assert.deepEqual(collectFontSizesPx('a{font-size:1rem}b{font-size:18px}'),[16,18]);
  assert.deepEqual(collectSpacingPx('.x{padding:8px 12px;margin-top:4px}'),[8,12,4]);
});

test('upstream manifest local pins match repository bytes', async()=>{
  const manifest=JSON.parse(await readFile(new URL('./knowledge/upstream-manifest.json',import.meta.url),'utf8'));
  const report=await verifyUpstreamManifest(manifest,{remote:false});
  assert.equal(report.drift,false,JSON.stringify(report.results.filter(r=>r.status!=='match'&&r.status!=='recorded'&&r.status!=='not-checked'),null,2));
});

test('python self-check matches javascript on fixture', async()=>{
  const input=JSON.parse(await readFile(new URL('./examples/self-check-input.json',import.meta.url),'utf8'));
  const expected=runDesignSelfCheck(input);
  const py=spawnSync(resolvePython(),['self-check.py','examples/self-check-input.json'],{encoding:'utf8'});
  assert.equal(py.status,0,py.stderr);
  assert.deepEqual(JSON.parse(py.stdout),expected);
});