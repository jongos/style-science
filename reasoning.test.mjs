import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verifyDependencyBindings,reviewWithDependencies} from './reasoning.mjs';
import {decisionFingerprint} from './decision.mjs';
import {fingerprint} from './engine.mjs';
import {resolvePython} from './tools/python.mjs';
import {request,cases,flat,expected} from './evaluation/reasoning-screen/prepare.mjs';

test('dependency-aware candidate review preserves feasibility and decision gates in both runtimes',async()=>{
  const plan=JSON.parse(await readFile(new URL('./examples/plan.json',import.meta.url)));
  const snapshots=plan.environments.map(environment=>({environment,planHash:fingerprint(plan),measurements:{overflow:{scrollWidth:environment.width,clientWidth:environment.width},title:{visible:true,text:'GDC probe'},contrast:{foreground:'#000000',background:'#ffffff'},lock:{value:'rgb(0, 0, 0)'}}}));
  const contract={id:'dependency-review',context:{task:'Compare'},requiredContext:['task'],options:{a:'First',b:'Second',u:'Unknown'},abstainOptions:['u']};
  const observations=['baseline','reordered','relabeled'].map(variant=>({variant,contractHash:decisionFingerprint(contract),model:'jev-1.13.0',optionMap:{A:'a',B:'b',U:'u'},answer:{choice:'A',confidence:1,probabilities:{A:1,B:0,U:0}}}));
  const input=(current={source:'d2'},observed={source:'d2'},s=snapshots,o=observations)=>[plan,s,contract,o,current,observed];
  const unstable=structuredClone(observations);unstable[1].answer={choice:'B',confidence:1,probabilities:{A:0,B:1,U:0}};
  const failed=structuredClone(snapshots);failed[0].measurements.overflow.scrollWidth++;
  const fixtures=[input(),input({source:'d2'},{source:'d1'}),input({source:'d2'},{}),input({},{}),input(null,{}),input(undefined,undefined,[]),input(undefined,undefined,failed),input(undefined,undefined,snapshots,[]),input(undefined,undefined,snapshots,unstable),input(undefined,undefined,snapshots,observations.map(o=>({...o,model:'jev-latest'})))];
  const reports=fixtures.map(x=>reviewWithDependencies(...x));
  assert.deepEqual(reports.map(x=>x.status),['advisory','blocked','blocked','blocked','blocked','blocked','blocked','needs-observations','unstable','advisory']);
  assert.equal(reports[1].dependencies.status,'unknown');assert.equal(reports[1].choice,null);
  assert.equal(reports[5].feasibility.status,'unknown');assert.equal(reports[6].feasibility.status,'fail');
  assert.ok(reports.every(x=>!x.releaseEligible && !x.automaticAction && x.experimental && x.evidenceScope==='exploratory'));
  const run=spawnSync(resolvePython(),['-X','utf8','-c',"import sys,json; from reasoning import review_with_dependencies; print(json.dumps([review_with_dependencies(*x) for x in json.load(sys.stdin)]))"],{encoding:'utf8',input:JSON.stringify(fixtures)});
  assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),reports);
});

test('winner-derived dependency bindings preserve unknown and cross-runtime parity',()=>{
  const fixtures=[[{source:'d2'},{source:'d1'}],[{source:'d2'},{source:'d2'}],[{source:'d2'},{}],[{},{}],[null,{}],[{source:1},{source:1}],[{a:'2',b:'1'},{a:'2',b:'1',unrelated:'changed'}]];
  const reports=fixtures.map(x=>verifyDependencyBindings(...x));
  assert.deepEqual(reports.map(x=>x.status),['unknown','pass','unknown','unknown','unknown','unknown','pass']);
  assert.ok(reports.every(x=>!x.qualityClaim && x.scope==='dependency-revisions-only'));
  const run=spawnSync(resolvePython(),['-X','utf8','-c',"import sys,json; from reasoning import verify_dependency_bindings; print(json.dumps([verify_dependency_bindings(*x) for x in json.load(sys.stdin)]))"],{encoding:'utf8',input:JSON.stringify(fixtures)});
  assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),reports);
});

test('screen preserves paired input identity, request hashes and winner-only accounting',async()=>{
  const root=new URL('./evaluation/reasoning-screen/',import.meta.url);
  const summary=JSON.parse(await readFile(new URL('summary.json',root)));
  const winners=JSON.parse(await readFile(new URL('winners.json',root)));
  assert.equal(cases.length,10);
  for(const format of ['structured','flat']) assert.equal(createHash('sha256').update(JSON.stringify(request(format))).digest('hex'),summary[format].requestSha256);
  for(const [i,c] of cases.entries()) {
    const reconstructed={};
    for(const line of flat(c.record)) {
      const split=line.indexOf(' = '),parts=line.slice(0,split).split('.');let node=reconstructed;
      for(let j=0;j<parts.length-1;j++) node=node[parts[j]]??=(/^\d+$/.test(parts[j+1])?[]:{});
      node[parts.at(-1)]=JSON.parse(line.slice(split+3));
    }
    assert.deepEqual(reconstructed,c.record);
    const r=c.record, observations=r.observations.filter(o=>r.required.includes(o.check));
    const oracle=observations.some(o=>o.status==='fail')?'fail':r.required.length && r.required.every(id=>{
      const matches=observations.filter(o=>o.check===id);
      return matches.length && matches.every(o=>o.status==='pass' && ['artifact','rule','context'].every(k=>o[k]===r[k]) && (!r.dependencyRevision||o.dependencyRevision===r.dependencyRevision));
    })?'pass':'unknown';
    assert.equal(oracle,expected[i]);
  }
  assert.equal(winners.length,1);assert.equal(winners[0].id,'case10');
  assert.deepEqual(winners[0].record,cases[9].record);
  assert.equal(verifyDependencyBindings({derived:winners[0].record.dependencyRevision},{derived:winners[0].record.observations[0].dependencyRevision}).status,'unknown');
  assert.equal(summary.structuredWins+summary.flatWins+summary.bothCorrect+summary.bothIncorrect+summary.unscorable,10);
  assert.equal(summary.structuredCorrect,summary.structuredWins+summary.bothCorrect);
  assert.equal(summary.flatCorrect,summary.flatWins+summary.bothCorrect);
  assert.equal(summary.releaseEligible,false);
});
