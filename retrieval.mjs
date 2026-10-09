// Optional research interface. Scores are declared heuristics, never beauty.
import {createHash} from 'node:crypto';
import {contrast} from './engine.mjs';
const words=x=>new Set(x.toLowerCase().match(/[a-z0-9]+/g)??[]);
const stamp=x=>createHash('sha256').update(x).digest('hex');

export function shortlist(index, brief, limit=3) {
  if(index.schemaVersion!==1 || !Array.isArray(index.entries) || brief.schemaVersion!==1 ||
    !Array.isArray(brief.contexts) || !brief.contexts.length || !brief.contexts.every(x=>typeof x==='string') ||
    !['task','audience','content','medium','intent'].every(k=>typeof brief[k]==='string' && brief[k].trim()) ||
    !Array.isArray(brief.interactions) || !Number.isInteger(limit) || limit<1 || limit>5) throw Error('Invalid retrieval contract');
  const constraints=brief.constraints??{}, query=words([brief.task,brief.audience,brief.content].join(' '));
  const candidates=[], excluded=[], ids=new Set();
  for(const r of index.entries) {
    if(typeof r.id!=='string' || ids.has(r.id) || !Array.isArray(r.contexts) || (r.interactions!==null && !Array.isArray(r.interactions)) ||
      !r.fonts || !r.palette || !['arrangement','typography','colorRelationship','intent','medium','text'].every(k=>typeof r[k]==='string')) throw Error('Invalid recipe index');
    ids.add(r.id);
    const conflicts=[],unknown=[];
    if(r.medium!==brief.medium) conflicts.push('medium');
    if(r.interactions===null && brief.interactions.length) unknown.push('interaction-capabilities');
    else if(brief.interactions.some(x=>!r.interactions?.includes(x))) conflicts.push('interaction');
    for(const [k,v] of Object.entries(constraints.palette??{})) if(r.palette[k]!==v) conflicts.push(`palette:${k}`);
    for(const [k,v] of Object.entries(constraints.fonts??{})) if(r.fonts[k]!==v) conflicts.push(`font-lock:${k}`);
    if(!Array.isArray(constraints.availableFonts)) unknown.push('font-availability');
    else if(Object.values(r.fonts).some(f=>!constraints.availableFonts.includes(f))) conflicts.push('font-unavailable');
    if(constraints.minimumContrast!==undefined) {
      if(typeof constraints.minimumContrast!=='number' || !Number.isFinite(constraints.minimumContrast) || constraints.minimumContrast<1 || constraints.minimumContrast>21) throw Error('Invalid contrast threshold');
      if(!/^#[a-f0-9]{6}$/i.test(r.palette.text??'') || !/^#[a-f0-9]{6}$/i.test(r.palette.background??'')) unknown.push('token-contrast');
      else if(contrast(r.palette.text,r.palette.background)<constraints.minimumContrast) conflicts.push('token-contrast');
    }
    if(conflicts.length || unknown.length) {excluded.push({id:r.id,status:conflicts.length?'incompatible':'unknown',conflicts,unknown});continue;}
    const matched=brief.contexts.filter(x=>r.contexts.includes(x)), terms=words(r.text);
    const overlap=[...query].filter(x=>terms.has(x)).length/Math.max(1,query.size);
    const score=4*matched.length/brief.contexts.length+2*Number(r.intent===brief.intent)+overlap;
    candidates.push({id:r.id,score,agreement:Number.isFinite(r.agreement)?r.agreement:0,
      reasons:[`contexts:${matched.length}/${brief.contexts.length}`,r.intent===brief.intent?'intent-match':'intent-differs'],
      arrangement:r.arrangement,typography:r.typography,colorRelationship:r.colorRelationship,
      tie:stamp([brief.task,brief.audience,brief.content,r.id].join('\n')),detail:r.detail??null});
  }
  const chosen=[];
  while(candidates.length && chosen.length<limit) {
    for(const c of candidates) c.diversity=chosen.length?Math.min(...chosen.map(s=>['arrangement','typography','colorRelationship'].filter(k=>c[k]!==s[k]).length)):0;
    candidates.sort((a,b)=>b.score-a.score || b.diversity-a.diversity || b.agreement-a.agreement || (a.tie<b.tie?-1:a.tie>b.tie?1:0));
    const item=candidates.shift(); delete item.tie;
    chosen.push({...item,renderedStatus:'untested',adaptationsRequired:['Verify fonts, responsive layout, states and native delivery constraints'],conflicts:[]});
  }
  return {schemaVersion:1,status:chosen.length?'shortlist':excluded.some(x=>x.status==='unknown')?'unknown':'no-fit',
    evidenceClass:'heuristic-retrieval',qualityClaim:false,shortlist:chosen,excluded};
}

export async function loadDetail(reference, read) {
  if(!reference || !/^[A-Za-z0-9_-]+\.json$/.test(reference.path) || !/^[a-f0-9]{64}$/.test(reference.sha256)) throw Error('Invalid detail reference');
  const bytes=await read(reference.path);
  if(stamp(bytes)!==reference.sha256) throw Error('Recipe detail hash mismatch');
  return JSON.parse(bytes.toString());
}
