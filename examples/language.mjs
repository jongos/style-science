import { readFile } from 'node:fs/promises';
import { validateDesign, designFingerprint, describeTokens, matchContexts, assessEvidence } from '../language.mjs';

const design = JSON.parse(await readFile(new URL('./language.json', import.meta.url), 'utf8'));
validateDesign(design);
const request = design.context;
const candidates = [
  { id: 'reference', context: request },
  { id: 'poster', context: { ...request, task: 'exhibition-discovery', intent: 'expressive' } },
];
console.log(JSON.stringify({
  evidenceKind: 'synthetic',
  declarationHash: designFingerprint(design),
  tokens: describeTokens({ foreground: '#202020', background: '#ffffff', bodyPx: 16, headingPx: 32, lineHeightPx: 24, gapPx: 8 }),
  context: matchContexts(request, candidates),
  unmeasuredClaim: assessEvidence({ id: 'faster-lookups', kind: 'causal', context: 'reference', artifactRevision: '1', instrument: 'task-time' }, null),
}, null, 2));
