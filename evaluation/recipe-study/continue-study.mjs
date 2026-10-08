import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {makeCandidates} from './generate.mjs';
import {contrast} from '../../engine.mjs';
import {classify,decodeVote} from './selection.mjs';
import {buildRequest} from './request.mjs';

const root=new URL('./',import.meta.url);
const load=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const base=makeCandidates();
const pairings=[
  ['Junicode','Aileron','humanist reading serif with economical sans text'],
  ['Archivo','Libre Baskerville','direct grotesque heading with measured reading serif'],
  ['Young Serif','Work Sans','warm expressive serif with open functional sans'],
  ['Oswald','Roboto','condensed heading with regular interface text'],
  ['Cooper Hewitt','Inter','architectural sans heading with neutral interface text'],
  ['EB Garamond','Cotham Sans','literary heading with understated sans text'],
  ['Libre Baskerville','Work Sans','traditional serif with flexible sans reading text'],
  ['Bagnard','Aileron','characterful display serif with quiet supporting text'],
  ['Poppins','Libre Baskerville','geometric heading with a contrasting reading serif'],
  ['League Gothic','Inter','narrow display hierarchy with neutral body text'],
];

function hsl(h,s,l) {
  s/=100;l/=100;
  const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};
  return '#'+[0,8,4].map(n=>Math.round(255*f(n)).toString(16).padStart(2,'0')).join('').toUpperCase();
}

export function expandedCandidate(index) {
  if(!Number.isInteger(index)||index<1000) throw Error('Expansion starts after original 1000');
  const phase=Math.floor(index/1000), local=index%1000;
  const c=structuredClone(base[local]);
  const p=c.factors.palette,f=c.factors.fontPair,a=c.factors.arrangement;
  const hue=(phase*137.507764+p*31.7)%360;
  const dark=(p+phase)%5===0;
  const background=hsl(hue,12,dark?10:98);
  const text=hsl((hue+30)%360,18,dark?96:15);
  const accent=hsl((hue+55+phase*13)%360,64,dark?72:32);
  const surface=hsl((hue+155)%360,20,dark?18:92);
  const accentText=contrast('#FFFFFF',accent)>=contrast('#111111',accent)?'#FFFFFF':'#111111';
  const name=`Spectrum ${phase}-${p+1}`;
  const [heading,body,fontCharacter]=pairings[(f+phase-1)%10];
  c.id=`R${String(index+1).padStart(4,'0')}`;
  c.factors={phase,palette:p,fontPair:f,arrangement:a};
  c.palette={name,background,text,accent,surface,accentText};
  c.fonts={heading,body,fontCharacter,licenseStatus:c.fonts.licenseStatus};
  c.numeric={...c.numeric,bodyPx:[14,16,18,20][(p+f+a+phase)%4],headingPx:[28,36,48,64,80][(p+2*f+a+phase)%5],lineHeight:[1.3,1.45,1.6,1.75][(p+f+2*a+phase)%4]};
  const n=c.numeric;
  const clauses=[`Build for this brief: ${c.brief}`,`Use ${name}: page ${background}, text ${text}, accent ${accent}, secondary surface ${surface}, text on accent ${accentText}.`,`Set headings in ${heading} and reading text in ${body}; ${fontCharacter}.`,`Composition: ${c.structure}`,`Use body ${n.bodyPx}px, heading ${n.headingPx}px, line height ${n.lineHeight}, reading measure at most ${n.measureCh}ch, gap ${n.gapPx}px, content width at most ${n.maxWidthPx}px and item radius ${n.radiusPx}px.`,`Keep letter spacing zero. At 390px use a single reading order, preserve required text and provide access to every control. Use real subject imagery when needed, not ornamental blobs. Check rendered text contrast and overflow; never call this recipe proven beautiful.`];
  c.promptVariant=['brief-first','composition-first','tokens-first'][index%3];
  const order=c.promptVariant==='brief-first'?[0,1,2,3,4,5]:c.promptVariant==='composition-first'?[3,0,2,1,4,5]:[1,4,2,0,3,5];
  c.prompt=order.map(i=>clauses[i]).join(' ');
  const ratios={body:contrast(text,background),surface:contrast(text,surface),accent:contrast(accent,background),onAccent:contrast(accentText,accent)};
  c.checks={kind:'Declared token arithmetic only; not rendered observations',ratios,bodyContrastPass:ratios.body>=4.5&&ratios.surface>=4.5,accentTextPass:ratios.onAccent>=4.5,accentAsSmallTextAllowed:ratios.accent>=4.5,renderedStatus:'not-run',fontLoading:'not-run'};
  return c;
}

export function signature(c) {
  return JSON.stringify({context:c.context,palette:[c.palette.background,c.palette.text,c.palette.accent,c.palette.surface,c.palette.accentText],fonts:[c.fonts.heading,c.fonts.body],arrangement:c.arrangement,numeric:c.numeric});
}

export async function initialize() {
  const summary=await load('summary.json');
  if(summary.expansion) return summary;
  const protocolHash=hash(await readFile(new URL('CONTINUATION.md',root)));
  const generatorHash=hash(await readFile(new URL('continue-study.mjs',root)));
  const requestHash=hash(await readFile(new URL('request.mjs',root)));
  summary.expansion={targetWinners:1000,initialTested:summary.tested,initialWinners:summary.winners,initialJudgments:summary.judgments,protocolHash,generatorHash,requestHash,batches:[]};
  summary.limitations.push('Continuation stops at 1000 winners; acceptance fractions are descriptive of a winner-targeted search, not unbiased aesthetic success estimates.');
  await writeFile(new URL('summary.json',root),JSON.stringify(summary,null,2)+'\n');
  return summary;
}

export async function nextBatch() {
  const summary=await initialize();
  if(summary.winners>=1000) return null;
  for(const [file,key] of [['CONTINUATION.md','protocolHash'],['continue-study.mjs','generatorHash'],['request.mjs','requestHash']]) {
    if(hash(await readFile(new URL(file,root)))!==summary.expansion[key]) throw Error('Frozen expansion contract changed: '+file);
  }
  const count=Math.min(50,1000-summary.winners);
  const batch=Array.from({length:count},(_,i)=>expandedCandidate(summary.tested+i));
  const corpus=await load('corpus.json');
  const request=buildRequest(batch,corpus,summary.batches);
  return {batchIndex:summary.batches,start:summary.tested,batch,request,inputHash:hash(JSON.stringify(request))};
}

export async function ingest(payload,response) {
  const summary=await load('summary.json'),winners=await load('winners.json');
  if(summary.tested!==payload.start||summary.batches!==payload.batchIndex||winners.length!==summary.winners) throw Error('Stale batch or inconsistent store');
  if(response.model!==summary.model) throw Error('Judge model drift');
  if(Object.keys(response.answers??{}).length!==payload.batch.length*3) throw Error('Incomplete response');
  const observed=new Map(),known=new Set([...base,...winners].map(signature));
  for(const [key,m] of Object.entries(payload.request.mapping)) {
    const vote=decodeVote(response.answers[key],m.decode);
    if(!observed.has(m.id)) observed.set(m.id,[]);
    observed.get(m.id).push({...vote,variant:m.variant,model:response.model,decode:m.decode});
  }
  let added=0;
  for(const c of payload.batch) {
    const sig=signature(c);
    if(known.has(sig)) throw Error('Duplicate design combination');
    known.add(sig);
    const judgments=observed.get(c.id),result=classify(c,judgments);
    const outcome=result.winner?'winners':'losers';
    summary.tested++;summary[outcome]++;
    summary.byContext[c.context].tested++;summary.byContext[c.context][outcome]++;
    summary[(result.stable?'unanimous':'split')+(result.winner?'Winners':'Losers')]++;
    if(!c.checks.bodyContrastPass||!c.checks.accentTextPass) summary.technicalFailures++;
    if(result.winner) {
      added++;
      winners.push({...c,selection:{label:'winner',evidenceClass:'text-only-model-heuristic',...result,judgments,referenceIds:payload.request.state.references.map(r=>r.id),referenceMeaning:'Directory URL clues; no verified visual comparison'}});
    }
  }
  summary.judgments+=payload.batch.length*3;summary.batches++;
  for(const key of ['input_tokens','output_tokens']) summary.usage[key]+=response.usage[key];
  summary.expansion.batches.push({batch:payload.batchIndex,attempts:payload.batch.length,winners:added,inputHash:payload.inputHash,judgments:payload.batch.length*3});
  // Only winners cross the persistence boundary; losing records stay in this call's memory.
  await writeFile(new URL('winners.json',root),JSON.stringify(winners,null,2)+'\n');
  await writeFile(new URL('summary.json',root),JSON.stringify(summary,null,2)+'\n');
  return {batch:payload.batchIndex,attempts:payload.batch.length,added,totalWinners:summary.winners,totalTested:summary.tested,remaining:1000-summary.winners};
}
