import test from 'node:test';
import assert from 'node:assert/strict';
import {shortlist,loadDetail} from './retrieval.mjs';
import {contexts,index,brief} from './evaluation/retrieval-fixtures.mjs';
import {spawnSync} from 'node:child_process';
import {resolvePython} from './tools/python.mjs';
import {createHash} from 'node:crypto';

test('all contexts and mixed intents respect hard locks, absent fonts and no-fit',()=>{
  for(const c of contexts) for(const intent of ['expressive','restrained']) assert.equal(shortlist(index,brief(c,intent)).shortlist[0].id,`synthetic-${c}-${intent}`);
  const b=brief('editorial'); b.constraints.palette={accent:'#0000ff'};
  assert.equal(shortlist(index,b).status,'no-fit');
  b.constraints={availableFonts:null}; assert.equal(shortlist(index,b).status,'unknown');
  b.constraints={availableFonts:[]}; assert.equal(shortlist(index,b).status,'no-fit');
  b.constraints={availableFonts:['Inter'],fonts:{body:'Unavailable'}}; assert.equal(shortlist(index,b).status,'no-fit');
  const mixed={...brief('culture'),contexts:['culture','editorial']};
  assert.deepEqual(shortlist(index,mixed),shortlist({...index,entries:[...index.entries].reverse()},mixed));
});
test('portable retrieval reports agree and details load lazily with integrity',async()=>{
  const briefs=contexts.flatMap(c=>[brief(c),{...brief(c),constraints:{availableFonts:null}},{...brief(c),medium:'docx'}]);
  const run=spawnSync(resolvePython(),['-X','utf8','-c',"import json,sys; from retrieval import shortlist; x=json.load(sys.stdin); print(json.dumps([shortlist(x['index'],b) for b in x['briefs']]))"],{input:JSON.stringify({index,briefs}),encoding:'utf8'});
  assert.equal(run.status,0,run.stderr); assert.deepEqual(JSON.parse(run.stdout),briefs.map(b=>shortlist(index,b)));
  let reads=0; const bytes=Buffer.from('{"synthetic":true}');
  const ref={path:'synthetic.json',sha256:createHash('sha256').update(bytes).digest('hex')};
  assert.deepEqual(await loadDetail(ref,async()=>{reads++; return bytes;}),{synthetic:true}); assert.equal(reads,1);
  await assert.rejects(loadDetail({...ref,sha256:'0'.repeat(64)},async()=>bytes),/hash mismatch/);
});
