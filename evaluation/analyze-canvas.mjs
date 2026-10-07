import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('./canvas-pass-2026-10-07/',import.meta.url);
const scenarios=new Map();const models=new Set();
for(let i=0;i<3;i++) {
  const batch=JSON.parse(await readFile(new URL(`batch-${i}.json`,root),'utf8'));
  const response=JSON.parse(await readFile(new URL(`response-${i}.json`,root),'utf8'));
  models.add(response.model);
  if(Object.keys(response.answers).length!==Object.keys(batch.questions).length) throw Error('Incomplete model response');
  for(const [key,meta] of Object.entries(batch.mapping)) {
    const answer=response.answers[key],id=key.replace(/_v\d+$/,'');
    if(!answer || !Object.hasOwn(meta.decode,answer.choice)) throw Error('Unknown answer label');
    if(!scenarios.has(id)) scenarios.set(id,{id,hypothesis:meta.hypothesis,analystPrediction:meta.prediction,meanings:[],confidences:[]});
    scenarios.get(id).meanings.push(meta.decode[answer.choice]);scenarios.get(id).confidences.push(answer.confidence);
  }
}
const results=[...scenarios.values()].map(r=>({...r,stable:new Set(r.meanings).size===1}));
const summary={evidenceClass:'exploratory-semantic-contract-review',models:[...models],judgments:36,scenarios:results.length,stable:results.filter(r=>r.stable).length,unstable:results.filter(r=>!r.stable).map(r=>r.id),results,limitations:['Authored synthetic cases, not independent accuracy labels.','Model agreement is not a proof of interval arithmetic or a design-effect estimate.','No rendered artifacts or human outcomes were evaluated.'],featureDecisions:[{feature:'bounded outcome comparison',decision:'add',basis:'Stable semantic boundary responses; mathematical behavior independently tested with deterministic fixtures.'},{feature:'measurement identity',decision:'add',basis:'Context/unit/instrument and prediction distinctions retained as explicit unknown states.'},{feature:'automatic combined tradeoff ranking',decision:'reject',basis:'No authorized weights or validated ranking instrument; semantic tradeoff response is unstable.'},{feature:'experiment admission',decision:'add',basis:'Distinct feature actions required; readiness for review never authorizes human collection.'}]};
await writeFile(new URL('analysis.json',root),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({judgments:summary.judgments,stable:summary.stable,unstable:summary.unstable}));
