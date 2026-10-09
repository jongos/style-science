import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {spawnSync} from 'node:child_process';
import {shortlist} from '../../retrieval.mjs';
import {boundedEffect} from '../../canvas.mjs';
import {contexts,index,brief} from '../retrieval-fixtures.mjs';
import {renderedCases} from './rendered.mjs';
import {resolvePython} from '../../tools/python.mjs';
if(!process.argv.includes('--allow-working-tree')) throw Error('Explicit --allow-working-tree required; no implicit research imports');
const root=new URL('../../',import.meta.url),start=performance.now(),hash=x=>createHash('sha256').update(x).digest('hex');
const sourceFiles=['retrieval.mjs','retrieval.py','canvas.mjs','engine.mjs','inspection.mjs','inspection.py','inspection-html.mjs','docx_adapter.py','evaluation/native_fixtures.py','evaluation/retrieval-fixtures.mjs','evaluation/downstream/PROTOCOL.md','evaluation/downstream/rendered.mjs','evaluation/downstream/run.mjs'];
const sourceHashes={};for(const p of sourceFiles) sourceHashes[p]=hash(await readFile(new URL(p,root)));
const development=contexts.map(c=>({id:`dev-${c}`,brief:brief(c)}));
const heldout=contexts.flatMap((c,i)=>[0,1].map(v=>({id:`heldout-${c}-${v}`,brief:{...brief(c,v?'expressive':'restrained'),
  task:`Locate ${c} material for a first visit ${v}`,audience:v?'Returning contributors':'New readers',content:v?'Detailed public descriptions':'Short original notes',
  constraints:{availableFonts:v?[]:['Inter'],minimumContrast:4.5}},expected:v?'no-fit':'shortlist'})));
const lexical=b=>{
  const terms=new Set((b.task+' '+b.content).toLowerCase().match(/[a-z0-9]+/g));
  return [...index.entries].map(r=>({r,score:r.text.toLowerCase().split(/\W+/).filter(w=>terms.has(w)).length})).sort((a,b)=>b.score-a.score || a.r.id.localeCompare(b.r.id)).slice(0,3).map(x=>x.r);
};
const rows=[];
for(const item of heldout) {
  const t=performance.now(),base=lexical(item.brief),baselineMs=performance.now()-t;
  const s=performance.now(),result=shortlist(index,item.brief),retrievalMs=performance.now()-s;
  const violates=r=>Object.values(r.fonts).some(f=>!item.brief.constraints.availableFonts.includes(f));
  const chosen=result.shortlist.map(x=>index.entries.find(r=>r.id===x.id));
  rows.push({id:item.id,brief:item.brief,expected:item.expected,baseline:{ids:base.map(x=>x.id),constraintViolations:Number(base.some(violates)),latencyMs:baselineMs},
    retrieval:{...result,constraintViolations:Number(chosen.some(violates)),latencyMs:retrievalMs},providerCost:0,inferenceTokens:0});
}
const comparison=[['improved',{lower:10,upper:12},{lower:5,upper:7}],['worsened',{lower:5,upper:7},{lower:10,upper:12}],['inconclusive',{lower:5,upper:12},{lower:7,upper:10}]].map(([expected,a,b])=>({expected,result:boundedEffect(a,b,'minimize',1)}));
const output=new URL(`../../dist/downstream-${Date.now()}/`,import.meta.url);await mkdir(output,{recursive:true});
const rendered=await renderedCases({output:new URL('screenshots/',output)});
const nativeCode="import json,sys,hashlib\nfrom pathlib import Path\nfrom evaluation.native_fixtures import native_fixture\nfrom docx_adapter import capture_docx\nfrom inspection import verify_inspection\nroot=Path(sys.argv[1]);root.mkdir()\nrows=[]\nfor v in ['normal','missing-title','heading-jump','missing-font','wide-table','bad-page','long-content']:\n d=native_fixture(v);(root/(v+'.docx')).write_bytes(d)\n p=dict(schemaVersion=1,artifactSha256=hashlib.sha256(d).hexdigest(),environment=dict(medium='docx',width=816,height=1056,theme='light',state='saved'),renderer=dict(name='ooxml-package',version='1'),checks=[dict(id=k,kind=k) for k in ['native-title','native-headings','native-fonts','native-page-geometry','native-table-bounds','native-pagination']])\n s=capture_docx(d,p,['Inter']);rows.append(dict(id=v,artifactSha256=p['artifactSha256'],report=verify_inspection(p,s),renderedEvidence=None))\nprint(json.dumps(rows))";
const native=spawnSync(resolvePython(),['-X','utf8','-c',nativeCode,fileURLToPath(new URL('native/',output))],{cwd:fileURLToPath(root),encoding:'utf8'});
if(native.status!==0) throw Error(native.stderr);
const flat=rendered.rows.flatMap(r=>r.report.results.map(x=>({expected:r.expected[x.id],actual:x.status})));
const baselineViolations=rows.reduce((s,r)=>s+r.baseline.constraintViolations,0),retrievalViolations=rows.reduce((s,r)=>s+r.retrieval.constraintViolations,0);
const report={schemaVersion:1,scope:'offline synthetic implementation comparison; not measured Dazzler user value',sourceStatus:'explicit-working-tree',sourceHashes,
  fixtureHash:hash(JSON.stringify({development,heldout,index})),host:'synthetic-offline-v1',model:null,generationPrompt:null,budget:{sharedIndexEntries:10,maximumShortlist:3,generationCalls:0,revisionCalls:0},
  developmentIds:development.map(x=>x.id),heldoutIds:heldout.map(x=>x.id),rows,comparison,rendered,native:JSON.parse(native.stdout),
  metrics:{baselineConstraintViolations:baselineViolations,retrievalConstraintViolations:retrievalViolations,noFit:rows.filter(r=>r.retrieval.status==='no-fit').length,
    unknown:rows.filter(r=>r.retrieval.status==='unknown').length,distinctArrangements:new Set(rows.flatMap(r=>r.retrieval.shortlist.map(s=>s.arrangement))).size,
    distinctTypographyCategories:new Set(rows.flatMap(r=>r.retrieval.shortlist.map(s=>s.typography))).size,distinctColorCategories:new Set(rows.flatMap(r=>r.retrieval.shortlist.map(s=>s.colorRelationship))).size,
    injectedDefects:flat.filter(x=>x.expected==='fail').length,detectedDefects:flat.filter(x=>x.expected==='fail' && x.actual==='fail').length,
    missedDefects:flat.filter(x=>x.expected==='fail' && x.actual!=='fail').length,falseAlarms:flat.filter(x=>x.expected==='pass' && x.actual==='fail').length,
    unsupportedMeasurements:flat.filter(x=>x.actual==='unknown').length,endToEndMs:performance.now()-start,providerCost:0},
  decisions:[{feature:'optional-retrieval',action:retrievalViolations===0 && baselineViolations>0?'retain-for-research':'change',productionDefaultChanged:false},
    {feature:'bounded-instruments',action:flat.every(x=>x.expected===x.actual)?'retain-for-research':'change'},
    {feature:'automatic-overall-ranking',action:'reject'}],
  unmeasured:['full Dazzler baseline','human preference and task outcomes','native rendered pages','real generation cost and latency'],evidenceDirectory:fileURLToPath(output)};
await writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('./results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({metrics:report.metrics,decisions:report.decisions,evidenceDirectory:report.evidenceDirectory},null,2));
