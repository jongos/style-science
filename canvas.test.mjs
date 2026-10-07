import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {boundedEffect,compareCanvas,assessExperiment} from './canvas.mjs';
import {canvasExample} from './examples/canvas.mjs';
import {resolvePython} from './tools/python.mjs';

test('bounded effects handle direction, meaningful thresholds and unresolved intervals',()=>{
  assert.deepEqual(boundedEffect({lower:10,upper:12},{lower:7,upper:8},'minimize',1),{lower:2,upper:5,status:'improved'});
  assert.equal(boundedEffect({lower:10,upper:12},{lower:7,upper:8},'maximize',1).status,'worsened');
  assert.equal(boundedEffect({lower:10,upper:12},{lower:9,upper:11},'minimize',1).status,'inconclusive');
  assert.equal(boundedEffect({lower:10,upper:10},{lower:9,upper:9},'minimize',1).status,'negligible');
  assert.equal(boundedEffect({lower:10,upper:12},{lower:7,upper:9},'minimize',1).status,'inconclusive');
  assert.throws(()=>boundedEffect({lower:2,upper:1},{lower:0,upper:1},'minimize',0));
  assert.throws(()=>boundedEffect({lower:0,upper:Infinity},{lower:0,upper:1},'minimize',0));
  assert.throws(()=>boundedEffect({lower:0,upper:1},{lower:0,upper:1},'minimize',true));
});
test('bounds contain all endpoint effects and reverse sign when designs are swapped',()=>{
  for(let i=0;i<100;i++) {
    const a={lower:i-50,upper:i-43},b={lower:30-i,upper:39-i};
    for(const direction of ['minimize','maximize']) {
      const result=boundedEffect(a,b,direction,2),reverse=boundedEffect(b,a,direction,2);
      assert.equal(result.lower,-reverse.upper); assert.equal(result.upper,-reverse.lower);
      for(const x of [a.lower,a.upper]) for(const y of [b.lower,b.upper]) {
        const effect=direction==='minimize'?x-y:y-x;
        assert.ok(effect>=result.lower && effect<=result.upper);
      }
    }
  }
});
test('canvas preserves conflicting outcomes and blocks infeasible candidates',async()=>{
  const x=await canvasExample();
  const report=compareCanvas(x.plan,x.baseline,x.candidate,x.spec);
  assert.equal(report.status,'comparison'); assert.equal(report.automaticSelection,false);
  assert.deepEqual(report.results.map(r=>r.status),['improved','worsened','improved','worsened']);
  x.candidate.snapshots[0].measurements.overflow.scrollWidth++;
  assert.equal(compareCanvas(x.plan,x.baseline,x.candidate,x.spec).status,'blocked');
});
test('missing, stale, incompatible and predicted outcomes remain unknown',async()=>{
  const original=await canvasExample();
  const mutations=[
    [x=>x.candidate.outcomes.shift(),'missing-observation'],
    [x=>x.candidate.outcomes[0].context='other','context-mismatch'],
    [x=>x.candidate.outcomes[0].artifactRevision='old','stale-observation'],
    [x=>x.candidate.outcomes[0].unit='milliseconds','instrument-or-unit-mismatch'],
    [x=>x.candidate.outcomes[0].instrument='other-test','instrument-or-unit-mismatch'],
    [x=>x.candidate.outcomes[0].source='model-prediction','not-measured'],
  ];
  for(const [mutate,reason] of mutations) {
    const x=structuredClone(original);mutate(x);
    const report=compareCanvas(x.plan,x.baseline,x.candidate,x.spec);
    assert.equal(report.status,'incomplete');assert.equal(report.results[0].reason,reason);
  }
  const duplicate=structuredClone(original);duplicate.candidate.outcomes.push(duplicate.candidate.outcomes[0]);
  assert.throws(()=>compareCanvas(duplicate.plan,duplicate.baseline,duplicate.candidate,duplicate.spec),/Duplicate/);
});
test('experiments need a possible feature decision; admission never authorizes collection',()=>{
  const plan={feature:'spacing',hypothesis:'Spacing reduces lookup errors',baseline:'current spacing',intervention:'compact rows',metric:'selection errors',budget:'declared pilot budget',ifSupported:{action:'improve',change:'adopt compact spacing'},ifRefuted:{action:'reject',change:'reject compact spacing'}};
  assert.deepEqual(assessExperiment(plan),{status:'ready-for-review',collectionAuthorized:false});
  assert.equal(assessExperiment({...plan,ifRefuted:plan.ifSupported}).status,'no-feature-decision');
  assert.equal(assessExperiment({...plan,ifSupported:{action:'retain',change:'keep current'},ifRefuted:{action:'retain',change:'leave current'}}).status,'no-feature-decision');
  assert.equal(assessExperiment({...plan,metric:''}).status,'incomplete');
});
test('Python and JavaScript agree on outcome comparisons and experiment admission',async()=>{
  const original=await canvasExample();const missing=structuredClone(original);missing.candidate.outcomes=[];
  const blocked=structuredClone(original);blocked.candidate.snapshots=[];
  const stale=structuredClone(original);stale.candidate.outcomes[0].artifactRevision='old';
  const prediction=structuredClone(original);prediction.candidate.outcomes[0].source='model-prediction';
  const cases=[original,missing,blocked,stale,prediction];
  const plan={feature:'spacing',hypothesis:'reduce errors',baseline:'current',intervention:'compact',metric:'errors',budget:'pilot',ifSupported:{action:'improve',change:'compact'},ifRefuted:{action:'reject',change:'compact'}};
  const experiments=[{},plan,{...plan,ifRefuted:plan.ifSupported}];
  const source="import json,sys; from canvas import compare_canvas,assess_experiment; data=json.load(sys.stdin); print(json.dumps({'comparisons':[compare_canvas(x['plan'],x['baseline'],x['candidate'],x['spec']) for x in data['cases']], 'experiments':[assess_experiment(x) for x in data['experiments']]}))";
  const result=spawnSync(resolvePython(),['-X','utf8','-c',source],{cwd:fileURLToPath(new URL('.',import.meta.url)),input:JSON.stringify({cases,experiments}),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||String(result.error));
  assert.deepEqual(JSON.parse(result.stdout),{comparisons:cases.map(x=>compareCanvas(x.plan,x.baseline,x.candidate,x.spec)),experiments:experiments.map(assessExperiment)});
});
