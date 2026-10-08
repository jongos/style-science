import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {decodeVote,classify} from './selection.mjs';
const root=new URL('./',import.meta.url);
const load=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const candidates=await load('candidates.json'), corpus=await load('corpus.json'), manifest=await load('manifest.json'), contract=await load('run-contract.json');
const sha=x=>createHash('sha256').update(x).digest('hex');
if(sha(await readFile(new URL('candidates.json',root)))!==manifest.candidateSha256) throw Error('Candidate manifest changed');
if(sha(await readFile(new URL('PROTOCOL.md',root)))!==contract.protocolSha256) throw Error('Protocol changed after requests');
const votes=new Map(), models=new Set(), usage={input_tokens:0,output_tokens:0};
for(let b=0;b<20;b++) {
  const file=`batch-${String(b).padStart(2,'0')}.json`,request=await load('requests/'+file),response=await load('responses/'+file);
  if(!response.model || Object.keys(response.answers??{}).length!==150) throw Error('Incomplete batch '+b);
  models.add(response.model);
  for(const key of ['input_tokens','output_tokens']) usage[key]+=response.usage[key];
  for(const [key,m] of Object.entries(request.mapping)) {
    const vote=decodeVote(response.answers[key],m.decode);
    if(!votes.has(m.id)) votes.set(m.id,[]);
    if(votes.get(m.id).some(v=>v.variant===m.variant)) throw Error('Duplicate vote');
    votes.get(m.id).push({...vote,variant:m.variant,model:response.model,decode:m.decode});
  }
}
if(candidates.length!==1000||votes.size!==1000||models.size!==1) throw Error('Unexpected coverage/model drift');
const winners=[],byContext={},counts={tested:1000,winners:0,losers:0,unanimousWinners:0,splitWinners:0,unanimousLosers:0,splitLosers:0,technicalFailures:0};
for(const c of candidates) {
  const judgments=votes.get(c.id), result=classify(c,judgments);
  byContext[c.context]??={tested:0,winners:0,losers:0}; byContext[c.context].tested++;
  const outcome=result.winner?'winners':'losers'; counts[outcome]++;byContext[c.context][outcome]++;
  counts[(result.stable?'unanimous':'split')+(result.winner?'Winners':'Losers')]++;
  if(!c.checks.bodyContrastPass||!c.checks.accentTextPass) counts.technicalFailures++;
  if(result.winner) {
    const b=Math.floor((Number(c.id.slice(1))-1)/50);
    winners.push({...c,selection:{label:'winner',evidenceClass:'text-only-model-heuristic',...result,judgments,referenceIds:corpus.slice(b%6*50,b%6*50+50).map(r=>r.id),referenceMeaning:'Directory URL clues; no verified visual comparison'}});
  }
}
const summary={study:manifest.study,model:[...models][0],...counts,judgments:3000,batches:20,usage,byContext,referenceUrls:300,distinctReferenceDomains:new Set(corpus.map(x=>new URL(x.url).hostname.replace(/^www\./,''))).size,sourceDirectory:'https://siiimple.com/',websiteArchivesSaved:0,renderedCandidatesTested:0,humanParticipants:0,limitations:['Winners and losers are speculative recipe recommendations, not measured beauty.','Jev is text-only; no screenshot judgment or live target-site comparison occurred.','Reference evidence is gallery inclusion, category and URL only; current appearance and availability are unverified.','Single minimalist directory, nonrandom sample, unequal category coverage and unknown shared design families.','Three presentations of one model are correlated; majority voting is a chosen heuristic.','Context, numerical settings and prompt ordering are confounded; factor-level effects are not causal.','Losers and mixed-batch data are discarded per user instruction; full outcome audit is deliberately unavailable.'],transportNotes:['Initial verbose batch rejected with max_tokens_exceeded; no judgments returned. Requests compacted without changing recipes or rubric.','One clipboard timeout recovered from the completed response, not rerun.'],retention:'Winning recipes and their three judgments only; aggregate loser counts, no loser catalog'};
await writeFile(new URL('winners.json',root),JSON.stringify(winners,null,2)+'\n');
await writeFile(new URL('summary.json',root),JSON.stringify(summary,null,2)+'\n');
await mkdir(new URL('../../guides/recipes/',root),{recursive:true});
for(const context of Object.keys(byContext)) {
  const rows=winners.filter(c=>c.context===context);
  const title=context[0].toUpperCase()+context.slice(1);
  const text=[`# ${title} Recipe Starting Points`,'',`${rows.length} heuristic winners from ${byContext[context].tested} tested combinations. These are ideas to try, not validated finished designs. Jev reviewed text and numbers; it did not see rendered candidates or inspect the reference websites.`,'','Use the recipe as a starting point, adapt it to actual content, then verify fonts, licensing, contrast, responsive layout and interaction. Split decisions are flagged. Never let this library override the brief or accessibility requirements.','','Full machine-readable recipes and winning judgments: [winners.json](../../evaluation/recipe-study/winners.json). Reference URL collection: [urls.txt](../../evaluation/recipe-study/urls.txt).','','## Recipes','',...rows.flatMap(c=>[`### ${c.id}: ${c.palette.name} / ${c.fonts.heading} / ${c.arrangement}`,'',`**Vote:** ${c.selection.winnerVotes}/3 winner${c.selection.stable?' (unanimous).':' (split; exercise extra judgment).'}`,`**Character:** ${c.style}. ${c.fonts.fontCharacter}.`,`**Declared Contrast:** body ${c.checks.ratios.body.toFixed(2)}:1; surface ${c.checks.ratios.surface.toFixed(2)}:1; on accent ${c.checks.ratios.onAccent.toFixed(2)}:1. ${c.checks.accentAsSmallTextAllowed?'Accent passes 4.5:1 against the declared page color.':'Do not use the accent as small text on the page color; its contrast is below 4.5:1.'}`,'','```text',c.prompt,'```',''])].join('\n');
  await writeFile(new URL(`../../guides/recipes/${context}.md`,root),text.replace(/^### (R\d+): (.+)$/gm,'### $1\n\n**Recipe:** $2')+'\n');
}
const readme=`# Design Recipe Winners\n\n${counts.winners} starting points selected from 1,000 combinations using 3,000 binary Jev judgments. Every retained recipe passes the declared body/surface and on-accent token contrast checks and receives at least two winner votes across three option presentations.\n\n## Choose a Context\n\n${Object.entries(byContext).map(([k,v])=>`- [${k[0].toUpperCase()+k.slice(1)}](${k}.md): ${v.winners} recipes`).join('\n')}\n\n## What Winner Means\n\nA best-guess recommendation to try, not a claim of measured beauty. ${counts.unanimousWinners} winners were unanimous; ${counts.splitWinners} had a split vote. The brief takes precedence over a recipe. Do not mistake repeated model judgments for three human reviewers.\n\nThe 300 website URLs are reference clues collected from Siiimple categories after the recipe set was frozen. No sites were archived. Jev cannot browse these links or see screenshots; their inclusion does not establish that a recipe resembles a current website. This collection is biased toward minimalist gallery selections.\n\n## Use a Recipe\n\n1. Choose a context and read the full recipe, including its vote and contrast restrictions.\n2. Adapt colors, typography and arrangement to the real subject and content. These are starting points, not brand rules.\n3. Verify actual font files, weights, glyph coverage and notices. Catalog membership alone is not licensing or loading evidence.\n4. Render the design, exercise its interactions and test desktop/mobile behavior. Token arithmetic does not establish rendered accessibility.\n\nMachine consumers should read [winners.json](../../evaluation/recipe-study/winners.json), filter by context, then inspect numeric settings and selection stability. The records contain complete prompts; no network call is needed.\n\n## Research Record\n\n- [Protocol](../../evaluation/recipe-study/PROTOCOL.md)\n- [Aggregate results](../../evaluation/recipe-study/summary.json)\n- [Reference URLs](../../evaluation/recipe-study/urls.txt)\n\nOnly winners are retained. ${counts.losers} losing recipes are omitted rather than archived. No rendered aesthetic test or human survey was performed.\n`;
await writeFile(new URL('../../guides/recipes/README.md',root),readme);
console.log(JSON.stringify(summary,null,2));
