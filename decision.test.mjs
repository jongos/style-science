import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assessChoice,decisionFingerprint,reviewCandidate} from './decision.mjs';
import {fingerprint} from './engine.mjs';

const contract={id:'layout',context:{task:'Compare three plans',viewport:'Desktop'},requiredContext:['task','viewport'],options:{aligned:'Aligned comparison',narrative:'Sequential narratives',unknown:'Insufficient evidence',equal:'No relevant difference'},abstainOptions:['unknown','equal']};
function observations(c=contract,choice='aligned') {
  return ['baseline','reordered','relabeled'].map((variant,i)=>{
    const ids=Object.keys(c.options);
    const optionMap=Object.fromEntries(ids.map((id,j)=>[i===2?`label${j}`:id,id]));
    const key=Object.keys(optionMap).find(k=>optionMap[k]===choice);
    return {variant,contractHash:decisionFingerprint(c),model:'jev-1.13.0',optionMap,answer:{choice:key,confidence:1,probabilities:Object.fromEntries(Object.keys(optionMap).map(k=>[k,k===key?1:0]))}};
  });
}
test('context, stale evidence, model identity and missing variants gate advice',()=>{
  assert.equal(assessChoice({...contract,context:{task:'Compare'}},[]).status,'needs-context');
  assert.equal(assessChoice(contract,observations().slice(0,1)).status,'needs-observations');
  const stale=observations(); stale[1].contractHash='old';
  assert.equal(assessChoice(contract,stale).status,'stale');
  const mixed=observations(); mixed[1].model='another-model';
  assert.equal(assessChoice(contract,mixed).status,'model-mismatch');
  assert.equal(assessChoice(contract,observations(contract,'unknown')).status,'abstain');
});
test('semantic relabeling is normalized; disagreement never becomes advice',()=>{
  const stable=assessChoice(contract,observations());
  assert.equal(stable.status,'advisory'); assert.equal(stable.automaticAction,false);
  assert.equal(stable.maxTotalVariation,0);
  const changed=observations(); changed[1]=observations(contract,'narrative')[1];
  const report=assessChoice(contract,changed);
  assert.equal(report.status,'unstable'); assert.equal(report.choice,null);
  assert.equal(report.maxTotalVariation,1);
});
test('malformed probabilities and ambiguous option mappings are rejected',()=>{
  for(const mutate of [x=>x[0].answer.probabilities.aligned=2,x=>x[0].answer.confidence=NaN,x=>x[2].optionMap.label1='aligned',x=>x[0].answer.choice='unknown']) {
    const input=observations(); mutate(input); assert.throws(()=>assessChoice(contract,input));
  }
});
test('a stable tie is not a recommendation',()=>{
  const tied=observations();
  for(const o of tied) {o.answer.confidence=0; for(const key of Object.keys(o.answer.probabilities)) o.answer.probabilities[key]=0.25;}
  const report=assessChoice(contract,tied);
  assert.equal(report.status,'ambiguous'); assert.equal(report.choice,null);
});
test('actual Jev order sensitivity is caught without calling the provider',async()=>{
  const root=new URL('./evaluation/jev-pass-2026-10-07/',import.meta.url);
  const records=[];
  const c={...contract,id:'density_lookup',options:{A:'Compact indexed rows',B:'Spacious entries',U:'Insufficient evidence',I:'No relevant difference'},abstainOptions:['U','I']};
  for(let i=0;i<3;i++) {
    const batch=JSON.parse(await readFile(new URL(`batch-0-${i}.json`,root),'utf8'));
    const response=JSON.parse(await readFile(new URL(`response-0-${i}.json`,root),'utf8'));
    const key=`density_lookup_v${i}`;
    records.push({variant:['baseline','reordered','relabeled'][i],contractHash:decisionFingerprint(c),model:response.model,answer:response.answers[key],optionMap:batch.mapping[key].decode});
  }
  assert.equal(assessChoice(c,records).status,'unstable');
});
test('advisory cannot override failed or missing rendered measurements',async()=>{
  const plan=JSON.parse(await readFile(new URL('./examples/plan.json',import.meta.url),'utf8'));
  const snapshots=plan.environments.map(environment=>({environment,planHash:fingerprint(plan),measurements:{overflow:{scrollWidth:environment.width,clientWidth:environment.width},title:{visible:true,text:'GDC probe'},contrast:{foreground:'#000000',background:'#ffffff'},lock:{value:'rgb(0, 0, 0)'}}}));
  assert.equal(reviewCandidate(plan,snapshots,contract,observations()).status,'advisory');
  snapshots[0].measurements.overflow.scrollWidth++;
  assert.equal(reviewCandidate(plan,snapshots,contract,observations()).status,'blocked');
  assert.equal(reviewCandidate(plan,[],contract,observations()).feasibility.status,'unknown');
});
test('Python and JavaScript agree on decision states and fingerprints',()=>{
  const altered=observations(); altered[1]=observations(contract,'narrative')[1];
  const tied=observations();
  for(const o of tied) {o.answer.confidence=0; for(const key of Object.keys(o.answer.probabilities)) o.answer.probabilities[key]=0.25;}
  const inputs=[{contract,observations:observations()},{contract,observations:altered},{contract,observations:tied},{contract,observations:observations(contract,'unknown')},{contract,observations:[]},{contract:{...contract,context:{}},observations:[]}];
  const source="import json,sys; from decision import assess_choice; print(json.dumps([assess_choice(x['contract'],x['observations']) for x in json.load(sys.stdin)]))";
  const run=spawnSync(process.env.GDC_PYTHON||'python',['-c',source],{cwd:fileURLToPath(new URL('.',import.meta.url)),input:JSON.stringify(inputs),encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||String(run.error));
  assert.deepEqual(JSON.parse(run.stdout),inputs.map(x=>assessChoice(x.contract,x.observations)));
});
