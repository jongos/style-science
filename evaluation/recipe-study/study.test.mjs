import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {contrast} from '../../engine.mjs';
import {makeCandidates} from './generate.mjs';
import {decodeVote,classify} from './selection.mjs';
import {expandedCandidate,signature,nextBatch} from './continue-study.mjs';
const root=new URL('./',import.meta.url);
const load=async p=>JSON.parse(await readFile(new URL(p,root)));
const inputHash=records=>createHash('sha256').update(JSON.stringify(records.map(c=>{
  const {ratios,...checks}=c.checks;
  return {...c,checks};
}),null,2)+'\n').digest('hex');
const sameComputedRatio=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=8*Number.EPSILON*Math.max(1,Math.abs(a),Math.abs(b));

test('published source preserves every historical downstream input hash',async()=>{
  const manifest=await load('source-manifest.json');
  assert.equal(Object.keys(manifest.files).length,10);
  assert.equal(manifest.datasetRevision,'sha256:'+manifest.files['evaluation/recipe-study/winners.json']);
  for(const [path,hash] of Object.entries(manifest.files)) {
    const bytes=await readFile(new URL('../../'+path,root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),hash,path);
  }
});

test('generator reproduces frozen inputs without requiring cross-platform pow bits',async()=>{
  const c=makeCandidates();
  assert.equal(c.length,1000);
  assert.equal(new Set(c.map(x=>JSON.stringify(x.factors))).size,1000);
  assert.equal(new Set(c.map(x=>x.id)).size,1000);
  assert.equal(inputHash(c),'64e739e437f22d5d02435807f0720016d9cde05fbe78aaa79a91d59846c6cbe3');
  const changed=structuredClone(c);changed[0].numeric.bodyPx++;
  assert.notEqual(inputHash(changed),inputHash(c));
  assert.ok(sameComputedRatio(5.956965681925274,5.956965681925276));
  assert.ok(!sameComputedRatio(5.956965681925274,5.956966));
  assert.ok(!sameComputedRatio(NaN,NaN));
});

test('majority selection never overrides technical failures or missing evidence',()=>{
  const c={checks:{bodyContrastPass:true,accentTextPass:true}};
  const w={meaning:'winner'}, l={meaning:'loser'};
  assert.equal(classify(c,[w,w,l]).winner,true);
  assert.equal(classify(c,[w,l,l]).winner,false);
  assert.equal(classify({...c,checks:{bodyContrastPass:false,accentTextPass:true}},[w,w,w]).winner,false);
  assert.throws(()=>classify(c,[w,w]));
  assert.throws(()=>decodeVote({type:'choice',choice:'Z'},{A:'winner',B:'loser'}));
  assert.throws(()=>decodeVote({type:'choice',choice:'A',confidence:0.7,probabilities:{A:0.9,B:0.9}},{A:'winner',B:'loser'}));
});

test('all retained records are evidenced winners and match aggregate counts',async()=>{
  const winners=await load('winners.json'), summary=await load('summary.json');
  assert.equal(winners.length,1000);
  assert.equal(winners.length,summary.winners);
  assert.equal(summary.tested,summary.winners+summary.losers);
  assert.equal(summary.judgments,summary.tested*3);
  assert.equal(new Set(winners.map(c=>c.id)).size,winners.length);
  for(const c of winners) {
    const s=c.selection;
    assert.deepEqual(s.judgments.map(v=>v.variant),[0,1,2]);
    for(const v of s.judgments) {
      assert.equal(decodeVote(v.answer,v.decode).meaning,v.meaning);
      assert.equal(v.model,summary.model);
    }
    const result=classify(c,s.judgments);
    assert.equal(result.winner,true);
    assert.equal(result.winnerVotes,s.winnerVotes);
    assert.equal(result.stable,s.stable);
    assert.equal(c.checks.renderedStatus,'not-run');
    const computed={body:contrast(c.palette.text,c.palette.background),surface:contrast(c.palette.text,c.palette.surface),onAccent:contrast(c.palette.accentText,c.palette.accent),accent:contrast(c.palette.accent,c.palette.background)};
    for(const [key,value] of Object.entries(computed)) assert.ok(sameComputedRatio(c.checks.ratios[key],value),`${c.id}: ${key} recomputation drift`);
    assert.equal(c.checks.bodyContrastPass,computed.body>=4.5&&computed.surface>=4.5);
    assert.equal(c.checks.accentTextPass,computed.onAccent>=4.5);
    assert.equal(c.checks.accentAsSmallTextAllowed,computed.accent>=4.5);
    assert.ok(computed.body>=4.5&&computed.surface>=4.5&&computed.onAccent>=4.5);
    assert.ok(c.checks.ratios.body>=4.5&&c.checks.ratios.surface>=4.5&&c.checks.ratios.onAccent>=4.5);
    assert.equal(s.referenceIds.length,50);
    assert.ok(c.prompt.length>100);
  }
  assert.equal(winners.filter(c=>c.selection.stable).length,summary.unanimousWinners);
  for(const [context,counts] of Object.entries(summary.byContext)) assert.equal(winners.filter(c=>c.context===context).length,counts.winners);
});

test('verification engine can be imported without a global process in a Node-compatible host',()=>{
  const engineUrl=new URL('../../engine.mjs',import.meta.url).href;
  const result=spawnSync(process.execPath,['--input-type=module','-e',`globalThis.process=undefined; const {contrast}=await import(${JSON.stringify(engineUrl)}); if(contrast('#000000','#ffffff')!==21) throw Error('Changed arithmetic');`],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});

test('expansion reaches exactly 1000 winners without duplicate designs or extra runs',async()=>{
  const winners=await load('winners.json'), summary=await load('summary.json');
  assert.equal(new Set(winners.map(signature)).size,1000);
  assert.equal(summary.tested,2318);
  assert.equal(summary.judgments,6954);
  const initial=makeCandidates();
  const expanded=Array.from({length:summary.tested-1000},(_,i)=>expandedCandidate(i+1000));
  assert.equal(new Set([...initial,...expanded].map(signature)).size,summary.tested);
  assert.equal(summary.expansion.initialWinners+summary.expansion.batches.reduce((n,b)=>n+b.winners,0),1000);
  assert.equal(1000+summary.expansion.batches.reduce((n,b)=>n+b.attempts,0),summary.tested);
  assert.equal(await nextBatch(),null);
  for(const c of winners.filter(c=>Number(c.id.slice(1))>1000)) {
    const original=expandedCandidate(Number(c.id.slice(1))-1);
    assert.equal(signature(c),signature(original));
    assert.equal(c.prompt,original.prompt);
  }
  for(const [file,key] of [['CONTINUATION.md','protocolHash'],['continue-study.mjs','generatorHash'],['request.mjs','requestHash']]) {
    assert.equal(createHash('sha256').update(await readFile(new URL(file,root))).digest('hex'),summary.expansion[key]);
  }
});

test('corpus retains 300 distinct website URLs and no site archives',async()=>{
  const corpus=await load('corpus.json');
  assert.equal(corpus.length,300);
  assert.equal(new Set(corpus.map(x=>new URL(x.url).hostname.replace(/^www\./,''))).size,300);
  assert.equal(new Set(corpus.map(x=>x.id)).size,300);
  for(const row of corpus) assert.deepEqual(Object.keys(row).sort(),['collectionDate','context','evidence','id','sourceUrl','url']);
  const urls=(await readFile(new URL('urls.txt',root),'utf8')).trim().split(/\r?\n/);
  assert.deepEqual(urls,corpus.map(r=>r.url));
});

test('winner-only retention removes all temporary mixed-batch data',async()=>{
  const entries=await readdir(root);
  for(const name of ['candidates.json','requests','responses']) assert.ok(!entries.includes(name),`Temporary data remains: ${name}`);
});
