// Explicit input only. Never scans the research workspace or revisits rejected recipes.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const [input,output,medium]=process.argv.slice(2);
if(!input || !output || medium!=='html') throw Error('Usage: node tools/build_recipe_index.mjs <winner-json> <new-output-directory> html');
const bytes=await readFile(resolve(input)),records=JSON.parse(bytes),entries=[],details=[];
const sha=x=>createHash('sha256').update(x).digest('hex');
if(!Array.isArray(records)) throw Error('Expected recipe array');
const ids=new Set();
for(const r of records) {
  if(r.selection?.winner!==true) continue;
  if(!/^[A-Za-z0-9_-]+$/.test(r.id) || ids.has(r.id) || !r.fonts || !r.palette) throw Error('Invalid or duplicate winner');
  ids.add(r.id);
  const detail=JSON.stringify(r)+'\n',path=r.id+'.json';
  details.push({path,detail});
  entries.push({id:r.id,contexts:[r.context],intent:r.intent??'unspecified',medium,interactions:r.interactions??null,
    text:[r.brief,r.style,r.affordance].join(' '),fonts:{heading:r.fonts.heading,body:r.fonts.body},palette:r.palette,
    arrangement:r.arrangement,typography:[r.fonts.heading,r.fonts.body].join(' / '),colorRelationship:r.palette.name,
    agreement:r.selection.winnerVotes??0,detail:{path,sha256:sha(detail)}});
}
await mkdir(resolve(output),{recursive:false});
for(const d of details) await writeFile(join(resolve(output),d.path),d.detail,{flag:'wx'});
await writeFile(join(resolve(output),'index.json'),JSON.stringify({schemaVersion:1,sourceSha256:sha(bytes),scope:'explicit winner-only input; unmeasured capability data stays unknown',entries},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({entries:entries.length,sourceSha256:sha(bytes),output:resolve(output)}));
