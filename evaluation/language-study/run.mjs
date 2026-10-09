// Read-only diagnostics over retained winners. Only the aggregate report is saved.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { describeTokens, auditCorpus } from '../../language.mjs';

const sha256 = value => createHash('sha256').update(value).digest('hex');
export async function runStudy() {
  const bytes = (await readFile(new URL('../recipe-study/winners.json', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
  const winners = JSON.parse(bytes);
  if (winners.length !== 1000 || winners.some(w => w.selection.label !== 'winner')) throw Error('Expected 1000 retained winners');
  const descriptors = winners.map(w => describeTokens({ foreground: w.palette.text, background: w.palette.background,
    bodyPx: w.numeric.bodyPx, headingPx: w.numeric.headingPx, lineHeightPx: w.numeric.bodyPx * w.numeric.lineHeight, gapPx: w.numeric.gapPx }));
  const ranges = {};
  for (const key of ['contrastRatio', 'typeRatio', 'lineHeightRatio', 'gapRatio', 'colorDistance']) {
    const values = descriptors.map(d => d[key]);
    ranges[key] = { minimum: Math.min(...values), maximum: Math.max(...values) };
  }
  // This projection intentionally omits font identity, arrangement, accent and content.
  const profiles = descriptors.map(d => JSON.stringify([
    ...['L', 'a', 'b'].map(k => d.foreground[k]), ...['L', 'a', 'b'].map(k => d.background[k]),
    d.typeRatio, d.lineHeightRatio, d.gapRatio,
  ].map(x => Number(x.toFixed(9)))));
  const counts = new Map();
  for (const profile of profiles) counts.set(profile, (counts.get(profile) ?? 0) + 1);
  const collisions = [...counts.values()].filter(n => n > 1);
  const records = winners.map(w => ({ id: w.id, split: 'train', sourceGroup: 'jev-recipe-study-2026-10-07',
    brandGroup: null, templateGroup: w.arrangement,
    contentHash: sha256(JSON.stringify({ palette: w.palette, fonts: w.fonts, structure: w.structure, numeric: w.numeric, context: w.context })),
    rights: { training: 'unknown', license: null, source: 'evaluation/recipe-study/README.md' }, evidenceKind: 'model-prediction' }));
  const corpus = auditCorpus(records);
  const issueCounts = {};
  for (const issue of corpus.issues) {
    const key = [issue.reason, issue.field ?? issue.split].filter(Boolean).join(':');
    issueCounts[key] = (issueCounts[key] ?? 0) + 1;
  }
  return {
    study: 'design-language-foundations-0.1.0', evidenceKind: 'computed',
    input: { path: 'evaluation/recipe-study/winners.json', sha256: sha256(bytes), hashNormalization: 'UTF-8 with CRLF normalized to LF', count: winners.length },
    descriptors: { ranges, distinctProjectedProfiles: counts.size, collisionGroups: collisions.length,
      recipesInCollisionGroups: collisions.reduce((sum, n) => sum + n, 0), roundingDecimals: 9 },
    corpus: { status: corpus.status, splits: corpus.splits, issueCounts, trainingAuthorized: false },
    decisions: [
      { feature: 'numerical-descriptors', action: 'retain', reason: 'All retained recipes are representable; numerical parity and invariance are checked by language.test.mjs.' },
      { feature: 'universal-style-distance', action: 'reject', reason: 'The projection omits font identity, arrangement, accents and content. Its collisions are not evidence of perceptual equivalence.' },
      { feature: 'winner-library-as-independent-benchmark', action: 'reject', reason: 'One model-selected source with no independent validation or test set cannot establish generalization.' },
    ],
    limitations: ['No renders, participants, new Jev calls, model training, causal estimates, or aesthetic accuracy measurements.',
      'Ranges describe a selected winner-only corpus, not the population of good designs.',
      'Rights marked unknown means not reviewed for a training use, not a finding that use is prohibited.',
      'Original URLs, winners, judgments and frozen study files are unchanged. No losing recipes are reconstructed or saved.'],
  };
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runStudy();
  const output = new URL('./report.json', import.meta.url);
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ count: report.input.count, profiles: report.descriptors.distinctProjectedProfiles,
    corpusStatus: report.corpus.status, report: output.pathname }, null, 2));
}
