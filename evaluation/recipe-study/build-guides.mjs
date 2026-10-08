import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
const winners=JSON.parse(await readFile(new URL('winners.json',root),'utf8'));
const summary=JSON.parse(await readFile(new URL('summary.json',root),'utf8'));
if(winners.length!==1000||summary.winners!==1000) throw Error('The requested 1000-winner target is not complete');
const output=new URL('../../guides/recipes/',root);
await mkdir(output,{recursive:true});
const title=s=>s[0].toUpperCase()+s.slice(1);
for(const [context,counts] of Object.entries(summary.byContext)) {
  const rows=winners.filter(c=>c.context===context);
  if(rows.length!==counts.winners) throw Error('Context count mismatch');
  const lines=[
    `# ${title(context)} Recipe Starting Points`,
    '',
    `${rows.length} heuristic winners from ${counts.tested} tested combinations. These are ideas to try, not validated finished designs. Jev reviewed text and numbers; it did not see rendered candidates or inspect the reference websites.`,
    '',
    'Use the recipe as a starting point, adapt it to actual content, then verify fonts, licensing, contrast, responsive layout and interaction. Split decisions are flagged. Never let this library override the brief or accessibility requirements.',
    '',
    'Full machine-readable recipes and winning judgments: [winners.json](../../evaluation/recipe-study/winners.json). Reference URL collection: [urls.txt](../../evaluation/recipe-study/urls.txt).',
    '',
    '## Recipes',
  ];
  for(const c of rows) lines.push(
    '',`### ${c.id}`,'',
    `**Recipe:** ${c.palette.name} / ${c.fonts.heading} / ${c.arrangement}`,
    '',
    `**Vote:** ${c.selection.winnerVotes}/3 winner${c.selection.stable?' (unanimous).':' (split; exercise extra judgment).'}`,
    `**Character:** ${c.style}. ${c.fonts.fontCharacter}.`,
    `**Declared Contrast:** body ${c.checks.ratios.body.toFixed(2)}:1; surface ${c.checks.ratios.surface.toFixed(2)}:1; on accent ${c.checks.ratios.onAccent.toFixed(2)}:1. ${c.checks.accentAsSmallTextAllowed?'Accent passes 4.5:1 against the declared page color.':'Do not use the accent as small text on the page color; its contrast is below 4.5:1.'}`,
    '', '```text',c.prompt,'```',
  );
  await writeFile(new URL(context+'.md',output),lines.join('\n')+'\n');
}
const lines=[
  '# Design Recipe Winners','',
  `**1,000 starting points**, selected from ${summary.tested.toLocaleString('en-US')} distinct combinations through ${summary.judgments.toLocaleString('en-US')} binary Jev judgments. Each retained recipe passes the declared body/surface and on-accent token contrast checks and receives at least two winner votes across three option presentations.`,
  '', '## Choose a Context','',
  ...Object.entries(summary.byContext).map(([k,v])=>`- [${title(k)}](${k}.md): ${v.winners} recipes`),
  '', '## What Winner Means','',
  `A best-guess recommendation to try, not a claim of measured beauty. ${summary.unanimousWinners} winners were unanimous; ${summary.splitWinners} had split votes. The brief takes precedence over a recipe. Repeated model judgments are not three human reviewers.`,
  '',
  'The first screen produced 413 winners. At the user\'s request, the search continued with new color values and font pairings until exactly 1,000 winners were retained. No rejected recipe was rerun to obtain a pass, and no judging threshold was relaxed. This winner-targeted search does not estimate a general aesthetic success rate.',
  '',
  'The 300 website URLs are reference clues collected from Siiimple categories after the original recipe set was frozen. The expansion reuses that corpus. No sites were archived. Jev cannot browse these links or see screenshots; directory inclusion does not establish that a recipe resembles a current website. The collection is biased toward minimalist gallery selections.',
  '', '## Use a Recipe','',
  '1. Choose a context and read the full recipe, including its vote and contrast restrictions.',
  '2. Adapt colors, typography and arrangement to the real subject and content. These are starting points, not brand rules.',
  '3. Verify actual font files, weights, glyph coverage and notices. Catalog membership alone is not licensing or loading evidence.',
  '4. Render the design, exercise its interactions and test desktop/mobile behavior. Token arithmetic does not establish rendered accessibility.',
  '',
  'Machine consumers should read [winners.json](../../evaluation/recipe-study/winners.json), filter by context, then inspect numeric settings and selection stability. The records contain complete prompts; no network call is needed.',
  '', '## Research Record','',
  '- [Original protocol](../../evaluation/recipe-study/PROTOCOL.md)',
  '- [Expansion and stopping rule](../../evaluation/recipe-study/CONTINUATION.md)',
  '- [Aggregate results](../../evaluation/recipe-study/summary.json)',
  '- [Reference URLs](../../evaluation/recipe-study/urls.txt)',
  '',
  `Only winners are retained. ${summary.losers.toLocaleString('en-US')} losing recipes are omitted rather than archived. No rendered aesthetic test or human survey was performed.`,
];
await writeFile(new URL('README.md',output),lines.join('\n')+'\n');
console.log(JSON.stringify({guides:6,winners:winners.length,tested:summary.tested,judgments:summary.judgments}));
