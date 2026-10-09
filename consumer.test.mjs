import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {inspectDistribution,negotiate} from './consumer.mjs';
import {resolvePython} from './tools/python.mjs';

test('malformed capability inspections preserve fallback in both runtimes',()=>{
  const cases=[null,{}, {status:'verified'}, {status:'verified',contract:{schemas:{},modules:{bad:null},unsupported:[]}}];
  const expected=cases.map(x=>negotiate(x,{}));
  assert.ok(expected.every(x=>x.status==='unknown' && x.fallback==='retain-previous-pin-and-native-gates'));
  const run=spawnSync(resolvePython(),['-c','import json,sys; from consumer import negotiate; print(json.dumps([negotiate(x,{}) for x in json.load(sys.stdin)]))'],{encoding:'utf8',input:JSON.stringify(cases)});
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout),expected);
});

test('consumer fallback rejects malformed metadata and unavailable artifacts with parity',async()=>{
  const manifests=[null,{}, {sourceRevision:'a'.repeat(40),files:[]}, {sourceRevision:'main',files:{'consumer-contract.json':'b'.repeat(64)}}, {sourceRevision:'a'.repeat(40),files:{'consumer-contract.json':'b'.repeat(64)}}];
  const results=[];
  for(const expected of manifests) results.push(await inspectDistribution('./dist/nonexistent-consumer-artifact',expected));
  assert.deepEqual(results.map(x=>x.status),['unknown','unknown','unknown','unknown','invalid']);
  const inspection={status:'verified',contract:{schemas:{plan:1},modules:{},unsupported:[]}};
  const requests=[null,{contractVersion:'1.0.0',planSchema:1,checks:'wrong'},{contractVersion:'1.0.0',planSchema:1,modules:[4]},{contractVersion:'1.0.0',planSchema:true}];
  const negotiated=requests.map(x=>negotiate(inspection,x));
  assert.ok(negotiated.every(x=>x.status==='unsupported'));
  const run=spawnSync(resolvePython(),['-c',"import json,sys; from consumer import inspect_distribution,negotiate; x=json.load(sys.stdin); print(json.dumps([[inspect_distribution('./dist/nonexistent-consumer-artifact',m) for m in x['manifests']],[negotiate(x['inspection'],r) for r in x['requests']]]))"],{encoding:'utf8',input:JSON.stringify({manifests,inspection,requests})});
  assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),[results,negotiated]);
});
