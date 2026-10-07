import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assessChoice,decisionFingerprint,reviewCandidate} from './decision.mjs';
import {fingerprint} from './engine.mjs';
import {resolvePython} from './tools/python.mjs';

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
  const run=spawnSync(resolvePython(),['-X','utf8','-c',source],{cwd:fileURLToPath(new URL('.',import.meta.url)),input:JSON.stringify(inputs),encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||String(run.error));
  assert.deepEqual(JSON.parse(run.stdout),inputs.map(x=>assessChoice(x.contract,x.observations)));
});

test('release evidence requires the closed immutable model identity policy',()=>{
  for (const model of ['jev-latest','jev-preview','jev-1.13','jev-1.13.0-preview','jev-1.13.0-latest','jev-01.13.0','arbitrary-model','jev-1.13.0\n',' jev-1.13.0','sha256:abc']) {
    const input=observations().map(o=>({...o,model}));
    const report=assessChoice(contract,input);
    assert.equal(report.status,'advisory',model);
    assert.equal(report.modelIdentityStatus,'unpinned',model);
    assert.equal(report.evidenceScope,'exploratory');
    assert.equal(report.releaseEligible,false);
    assert.equal(report.automaticAction,false);
  }
  for (const model of ['jev-1.13.0',`sha256:${'a'.repeat(64)}`]) {
    const input=observations().map(o=>({...o,model}));
    const report=assessChoice(contract,input);
    assert.equal(report.releaseEligible,true);
    assert.equal(report.resolvedModel,model);
    assert.equal(report.modelIdentityStatus,'pinned');
    assert.equal(report.evidenceClass,'model-prediction');
    assert.equal(report.automaticAction,false);
  }
});

test('requested aliases remain distinct from provider resolutions and missing identities',()=>{
  const input=observations().map(o=>({...o,model:'jev-latest',requestedModel:'jev-latest',resolvedModel:'jev-1.13.0'}));
  const report=assessChoice(contract,input);
  assert.equal(report.releaseEligible,true);
  assert.equal(report.model,'jev-1.13.0');
  for (const identity of report.modelIdentities) {
    assert.equal(identity.requestedModel,'jev-latest');
    assert.equal(identity.resolvedModel,'jev-1.13.0');
  }
  for (const missing of [undefined,null,'',' ']) {
    const input=observations().map(o=>({...o,resolvedModel:missing,requestedModel:'jev-latest'}));
    assert.equal(assessChoice(contract,input).status,'needs-model');
    assert.equal(assessChoice(contract,input).releaseEligible,false);
  }
  const absent=observations(); for (const o of absent) delete o.model;
  assert.equal(assessChoice(contract,absent).status,'needs-model');
  const mixed=observations(); mixed[2].resolvedModel='jev-1.14.0';
  assert.equal(assessChoice(contract,mixed).status,'model-mismatch');
  assert.equal(assessChoice(contract,mixed).releaseEligible,false);
});

test('identity pinning does not bypass context, sensitivity, abstention or feasibility',async()=>{
  const inputs=[[],observations().slice(0,2),observations(contract,'unknown')];
  const stale=observations(); stale[0].contractHash='stale'; inputs.push(stale);
  const unstable=observations(); unstable[1]=observations(contract,'narrative')[1]; inputs.push(unstable);
  const tied=observations();
  for(const o of tied) for(const key of Object.keys(o.answer.probabilities)) o.answer.probabilities[key]=0.25;
  inputs.push(tied);
  for(const input of inputs) assert.equal(assessChoice(contract,input).releaseEligible,false);
  assert.equal(assessChoice({...contract,context:{}},observations()).releaseEligible,false);
  const plan=JSON.parse(await readFile(new URL('./examples/plan.json',import.meta.url),'utf8'));
  assert.equal(reviewCandidate(plan,[],contract,observations()).releaseEligible,false);
});

test('JS/Python pinning parity covers pinned, aliases, missing, mixed and malformed identities',()=>{
  const inputs=[];
  for(const model of ['jev-1.13.0',`sha256:${'f'.repeat(64)}`,'jev-latest','jev-preview','jev-1.13.0\n','jev-01.13.0',null,'',42]) {
    inputs.push(observations().map(o=>({...o,model})));
  }
  inputs.push(observations().map(o=>({...o,requestedModel:'jev-latest',resolvedModel:'jev-1.13.0'})));
  inputs.push(observations().map(o=>({...o,requestedModel:'jev-preview',resolvedModel:null})));
  const absent=observations(); for (const o of absent) delete o.model; inputs.push(absent);
  const mixed=observations(); mixed[0].resolvedModel='jev-1.14.0'; inputs.push(mixed);
  const aliasMix=observations(); aliasMix[0].model='jev-latest'; inputs.push(aliasMix);
  const malformed=observations(); malformed[0].requestedModel={alias:'jev-latest'}; inputs.push(malformed);
  const source="import json,sys\nfrom decision import assess_choice\ndef attempt(x):\n try: return assess_choice(x['contract'],x['observations'])\n except ValueError as e: return {'error':str(e)}\nprint(json.dumps([attempt(x) for x in json.load(sys.stdin)]))";
  const run=spawnSync(resolvePython(),['-X','utf8','-c',source],{cwd:fileURLToPath(new URL('.',import.meta.url)),input:JSON.stringify(inputs.map(observations=>({contract,observations}))),encoding:'utf8'});
  assert.equal(run.status,0,run.stderr||String(run.error));
  assert.deepEqual(JSON.parse(run.stdout),inputs.map(input=>{
    try {return assessChoice(contract,input);} catch(error) {return {error:error.message};}
  }));
});
