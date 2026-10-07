import {readFile,writeFile} from 'node:fs/promises';
import {assessChoice,decisionFingerprint} from '../decision.mjs';
import {cases} from './jev-probes.mjs';

const root=new URL('./jev-pass-2026-10-07/',import.meta.url);
const data=[];
for(const [group,variant] of [[0,0],[0,1],[0,2],[1,0]]) {
  const batch=JSON.parse(await readFile(new URL(`batch-${group}-${variant}.json`,root),'utf8'));
  const response=JSON.parse(await readFile(new URL(`response-${group}-${variant}.json`,root),'utf8'));
  if(Object.keys(response.answers).length!==Object.keys(batch.questions).length) throw Error('Incomplete response');
  for(const [key,meta] of Object.entries(batch.mapping)) {
    const answer=response.answers[key];
    if(!answer || !Object.hasOwn(meta.decode,answer.choice)) throw Error('Unmapped answer');
    data.push({...meta,model:response.model,answer,meaning:meta.decode[answer.choice]});
  }
}
const results=cases.map(([id,family,scenario,a,b,prediction])=>{
  const observed=data.filter(x=>x.id===id);
  const contract={id,context:{scenario},requiredContext:['scenario'],options:{A:a,B:b,U:'Insufficient evidence',I:'No relevant difference'},abstainOptions:['U','I']};
  // This fingerprint binds the local analytical contract, not a provider attestation.
  const report=assessChoice(contract,observed.map(o=>({variant:['baseline','reordered','relabeled'][o.variant],contractHash:decisionFingerprint(contract),model:o.model,answer:o.answer,optionMap:o.decode})));
  return {id,family,analystPrediction:prediction,meanings:observed.map(x=>x.meaning),confidences:observed.map(x=>x.answer.confidence),report};
});
const summary={date:'2026-10-07',evidenceClass:'exploratory-model-probes',model:[...new Set(data.map(x=>x.model))],judgments:data.length,scenarios:cases.length,threeVariantScenarios:results.filter(x=>x.meanings.length===3).length,unstable:results.filter(x=>x.report.status==='unstable').map(x=>x.id),consistentAbstentions:results.filter(x=>x.report.status==='abstain').map(x=>x.id),limitations:['Synthetic text descriptions, not rendered perception or human outcomes.','Analyst-authored options and predictions are not independent ground truth.','Variants are correlated observations of the same model, not independent samples.','No latency comparison or quality-effect estimate.','The final 15 scenarios have only one variant and cannot pass the advisory gate.'],results};
await writeFile(new URL('analysis.json',root),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({judgments:summary.judgments,scenarios:summary.scenarios,unstable:summary.unstable,consistentAbstentions:summary.consistentAbstentions},null,2));
