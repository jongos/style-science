// Read-only host comparison: no generation, provider calls or host installation changes.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {shortlist} from '../../retrieval.mjs';
import {resolvePython} from '../../tools/python.mjs';
const [host,output]=process.argv.slice(2);
if(!host||!output) throw Error('Usage: node evaluation/downstream/compare-host.mjs <Dazzler checkout> <new output directory>');
const script=resolve(host,'skills/dazzler-frontend/scripts/recipes.py');
const data=resolve(host,'skills/dazzler-frontend/references/recipes');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const source=await readFile(script),indexBytes=await readFile(join(data,'index.json'));
const records=JSON.parse(indexBytes).recipes;
const contexts=['editorial','commerce','culture','information','software'];
const requests=contexts.flatMap(context=>['available','unavailable'].map(mode=>({contexts:[context],brief:`Find a clear ${context} directory with useful navigation`,audience:'First-time visitors',content:'Find an item and compare descriptions',limit:3,mode})));
const python=`import importlib.util,json,sys,time
spec=importlib.util.spec_from_file_location('host_recipes',sys.argv[1]); m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rows=[]
for request in json.load(sys.stdin):
 request.pop('mode'); start=time.perf_counter(); result=m.shortlist(request,sys.argv[2]); rows.append(dict(result=result,latencyMs=(time.perf_counter()-start)*1000))
print(json.dumps(rows))`;
const run=spawnSync(resolvePython(),['-X','utf8','-c',python,script,data],{encoding:'utf8',input:JSON.stringify(requests),timeout:60000,maxBuffer:5_000_000,windowsHide:true});
if(run.status!==0) throw Error(run.stderr||String(run.error));
const baseline=JSON.parse(run.stdout);
const entries=records.map(r=>({id:r.id,contexts:[r.context],medium:'html',intent:'unspecified',interactions:null,text:[r.style,r.arrangement,r.affordance,r.fontCharacter].join(' '),fonts:{heading:r.fonts[0],body:r.fonts[1]},palette:r.palette,arrangement:r.arrangement,typography:r.fonts.join(' / '),colorRelationship:r.palette.name,agreement:r.winnerVotes}));
const rows=requests.map((request,i)=>{
  const availableFonts=request.mode==='unavailable'?[]:records.find(r=>r.context===request.contexts[0]).fonts;
  const fits=r=>Object.values(r.fonts).every(f=>availableFonts.includes(f));
  const base=baseline[i].result.candidates;
  const start=performance.now(), filtered=base.filter(fits), filterMs=performance.now()-start;
  const brief={schemaVersion:1,contexts:request.contexts,task:request.brief,audience:request.audience,content:request.content,medium:'html',intent:'unspecified',interactions:[],constraints:{availableFonts}};
  const begin=performance.now(),research=shortlist({schemaVersion:1,entries},brief,3), researchMs=performance.now()-begin;
  const chosen=research.shortlist.map(r=>entries.find(e=>e.id===r.id));
  return {id:request.contexts[0]+'-'+request.mode,request,availableFonts,baseline:{ids:base.map(r=>r.id),violations:base.filter(r=>!fits(r)).length,latencyMs:baseline[i].latencyMs},filter:{ids:filtered.map(r=>r.id),violations:filtered.filter(r=>!fits(r)).length,latencyMs:filterMs},research:{ids:chosen.map(r=>r.id),violations:chosen.filter(r=>!fits(r)).length,status:research.status,latencyMs:researchMs}};
});
const metrics=Object.fromEntries(['baseline','filter','research'].map(k=>[k,{violatingBriefs:rows.filter(r=>r[k].violations>0).length,emptyBriefs:rows.filter(r=>!r[k].ids.length).length,selected:rows.reduce((n,r)=>n+r[k].ids.length,0)}]));
const report={scope:'Actual host recipe helper only; not an agent, generation or aesthetic benchmark',sourceHashes:{hostHelper:hash(source),hostIndex:hash(indexBytes),researchRetrieval:hash(await readFile(new URL('../../retrieval.mjs',import.meta.url)))},criteria:'Retain constraint filtering only with zero hard violations. Do not promote duplicate ranking unless it supplies feasible candidates where filtering cannot; neither establishes aesthetic value.',rows,metrics,providerCalls:0,hostModified:false,decision:metrics.filter.violatingBriefs===0?'retain-explicit-constraint-filtering':'reject-filter',rankingDecision:rows.some(r=>!r.filter.ids.length&&r.research.ids.length)?'retain-for-targeted-research':'defer-duplicate-ranking',limitations:['Original synthetic smoke briefs, not a preregistered held-out study','Baseline helper does not accept structured available-font constraints; this compares an additional filter, not a baseline contract bug','HTML medium is an explicit benchmark assumption; interaction compatibility is unmeasured','Timing excludes generation and is not a production performance estimate']};
await mkdir(resolve(output),{recursive:false});
await writeFile(join(resolve(output),'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({metrics,decision:report.decision,rankingDecision:report.rankingDecision,output:resolve(output)},null,2));
