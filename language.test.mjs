import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { resolvePython } from './tools/python.mjs';
import { validateDesign, designFingerprint, assessRelations, oklab, describeTokens, matchContexts, assessEvidence, auditCorpus } from './language.mjs';
import { runStudy } from './evaluation/language-study/run.mjs';

const design = JSON.parse(await readFile(new URL('./examples/language.json', import.meta.url), 'utf8'));
const tokens = { foreground: '#202020', background: '#ffffff', bodyPx: 16, headingPx: 32, lineHeightPx: 24, gapPx: 8 };
const claim = { id: 'synthetic-claim', kind: 'causal', context: 'lookup', artifactRevision: '1', instrument: 'declared-test' };
const evidence = { id: 'synthetic-record', kind: 'synthetic', context: 'lookup', artifactRevision: '1', instrument: 'declared-test',
  source: 'fixture-only', limitations: ['Synthetic metadata for contract tests; no participants or measurements.'], protocol: null };
const capture = () => ({ designHash: designFingerprint(design), environment: 'synthetic-web', artifactRevision: '1',
  observations: design.relations.map(r => ({ relation: r.id, status: 'pass', instrument: 'synthetic-annotation', source: 'fixture-only' })) });
const corpus = () => ['train', 'validation', 'test'].map((split, i) => ({ id: String(i), split,
  sourceGroup: `source-${i}`, brandGroup: `brand-${i}`, templateGroup: `template-${i}`,
  contentHash: createHash('sha256').update(`fixture-${i}`).digest('hex'),
  rights: { training: 'cleared', license: 'synthetic-license-declaration', source: 'fixture-only' }, evidenceKind: 'rendered' }));
function close(a, b, tolerance = 1e-12) {
  if (typeof a === 'number') { assert.equal(typeof b, 'number'); assert.ok(Math.abs(a-b) <= tolerance * Math.max(1, Math.abs(a)), `${a} != ${b}`); }
  else if (Array.isArray(a)) { assert.ok(Array.isArray(b)); assert.equal(a.length, b.length); a.forEach((x, i) => close(x, b[i], tolerance)); }
  else if (a && typeof a === 'object') { assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort()); for (const k of Object.keys(a)) close(a[k], b[k], tolerance); }
  else assert.equal(a, b);
}
const invalidDesigns = () => [
  d => { d.quality = 0.99; }, d => { d.languageVersion = 'future'; }, d => { d.context.task = null; },
  d => { d.id = '\ud800'; }, d => { d.nodes = []; }, d => { d.context.intent = ' '; },
  d => { d.nodes[0].kind = 'unknown'; }, d => { d.nodes[0].role = ''; }, d => { d.nodes.push(d.nodes[0]); },
  d => { d.nodes[1].tokenRefs = ['x', 'x']; }, d => { d.relations[0].to = 'missing'; },
  d => { d.relations[0].from = 'title'; }, d => { d.relations[0].kind = 'beautiful'; },
  d => { d.relations.push({ id: 'reverse', kind: 'precedes', from: 'description', to: 'title' }); },
  d => { d.relations.push({ id: 'duplicate', kind: 'contains', from: 'entry', to: 'title' }); },
  d => { d.relations.push({ id: 'self', kind: 'groups-with', from: 'title', to: 'title' }); },
  d => { d.relations.push({ id: 'group1', kind: 'groups-with', from: 'title', to: 'description' }, { id: 'group2', kind: 'groups-with', from: 'description', to: 'title' }); },
  d => { d.relations.push({ id: 'reverse', kind: 'emphasizes', from: 'description', to: 'title' }); },
  d => { d.nodes.push({ id: 'other-group', kind: 'group', role: 'other', tokenRefs: [] }); d.relations.push({ id: 'other-parent', kind: 'contains', from: 'other-group', to: 'title' }); },
].map(mutate => { const d = structuredClone(design); mutate(d); return d; });

test('design grammar validates declared intent without depending on a medium or renderer', () => {
  for (const medium of ['web', 'slides', 'document']) {
    const d = structuredClone(design); d.context.medium = medium;
    assert.equal(validateDesign(d), d); assert.deepEqual(d.relations, design.relations);
  }
  const reversedFields = Object.fromEntries(Object.entries(design).reverse());
  assert.equal(designFingerprint(design), designFingerprint(reversedFields));
  assert.notEqual(designFingerprint(design), designFingerprint({ ...design, revision: '2' }));
  for (const d of invalidDesigns()) assert.throws(() => validateDesign(d));
});

test('all directed relation kinds reject long cycles and accept long chains', () => {
  for (const kind of ['contains', 'precedes', 'emphasizes']) {
    const d = structuredClone(design);
    d.nodes = Array.from({length: 100}, (_, i) => ({ id: String(i), kind: 'group', role: 'fixture', tokenRefs: [] }));
    d.relations = d.nodes.slice(1).map((n, i) => ({ id: `e${i}`, kind, from: String(i), to: n.id }));
    validateDesign(d);
    d.relations.push({ id: 'cycle', kind, from: '99', to: '0' });
    assert.throws(() => validateDesign(d), /Cyclic/);
  }
});

test('relation evidence never upgrades absent, stale or empty checks to pass', () => {
  assert.equal(assessRelations(design, capture()).status, 'pass');
  assert.equal(assessRelations(design, null).status, 'unknown');
  const missing = capture(); missing.observations.pop();
  assert.equal(assessRelations(design, missing).status, 'unknown');
  missing.observations[0].status = 'fail';
  assert.equal(assessRelations(design, missing).status, 'fail');
  for (const key of ['designHash', 'artifactRevision']) {
    const stale = capture(); stale[key] = 'old';
    assert.equal(assessRelations(design, stale).reason, 'stale-capture');
  }
  const empty = { ...design, relations: [] };
  assert.equal(assessRelations(empty, { ...capture(), designHash: designFingerprint(empty), observations: [] }).reason, 'no-relations');
  const duplicate = capture(); duplicate.observations.push(duplicate.observations[0]);
  assert.throws(() => assessRelations(design, duplicate), /Duplicate/);
  const unsupported = capture(); unsupported.observations[0].status = 'probably';
  assert.throws(() => assessRelations(design, unsupported));
});

test('Oklab agrees with reference values and declared ratios are scale invariant', () => {
  close(oklab('#000000'), { L: 0, a: 0, b: 0 });
  close(oklab('#ffffff'), { L: 1, a: 0, b: 0 }, 1e-7);
  close(oklab('#ff0000'), { L: 0.6279553606, a: 0.2248630611, b: 0.1258462985 }, 1e-9);
  const a = describeTokens(tokens);
  for (const factor of [0.25, 0.5, 2, 3, 10]) {
    const b = describeTokens({ ...tokens, ...Object.fromEntries(['bodyPx', 'headingPx', 'lineHeightPx', 'gapPx'].map(k => [k, tokens[k] * factor])) });
    close(a, b);
  }
  assert.equal(describeTokens({ ...tokens, foreground: '#ffffff', background: '#000000' }).contrastRatio, 21);
  assert.equal(describeTokens({ ...tokens, foreground: '#ffffff' }).colorDistance, 0);
  assert.equal(describeTokens({ ...tokens, gapPx: 0 }).gapRatio, 0);
  for (const invalid of ['#fff', '#ffffffff', 'red', null, '#ffffff\n']) assert.throws(() => oklab(invalid));
  for (const invalid of [0, -1, NaN, Infinity, true, '16', 20000]) assert.throws(() => describeTokens({ ...tokens, bodyPx: invalid }));
  assert.throws(() => describeTokens({ ...tokens, bodyPx: Number.MIN_VALUE }), /range/);
});

test('context matching preserves order and cannot infer missing audience or intent', () => {
  const candidates = [
    { id: 'a', context: design.context },
    { id: 'b', context: { ...design.context, task: 'different' } },
    { id: 'c', context: { ...design.context, audience: null } },
    { id: 'd', context: design.context },
  ];
  const result = matchContexts(design.context, candidates);
  assert.deepEqual(result.eligible, ['a', 'd']);
  assert.deepEqual(result.results.map(r => r.status), ['matching', 'out-of-scope', 'unknown', 'matching']);
  assert.deepEqual(matchContexts({ ...design.context, intent: null }, candidates).eligible, []);
  assert.equal(matchContexts({ ...design.context, audience: null }, candidates).status, 'needs-context');
  assert.throws(() => matchContexts(design.context, [candidates[0], candidates[0]]));
  assert.equal(result.automaticSelection, false);
});

test('evidence gates distinguish model advice, computations, observations and causal claims', () => {
  for (const kind of ['synthetic', 'model-prediction', 'computed', 'rendered', 'observational']) {
    assert.equal(assessEvidence(claim, { ...evidence, kind, protocol: 'fixture-protocol' }).status, 'unknown');
  }
  assert.equal(assessEvidence(claim, { ...evidence, kind: 'randomized' }).reason, 'missing-protocol');
  const reviewed = assessEvidence(claim, { ...evidence, kind: 'randomized', protocol: 'fixture-protocol' });
  assert.equal(reviewed.status, 'ready-for-review'); assert.equal(reviewed.establishesClaim, false);
  for (const [kind, evidenceKind] of [['numerical', 'computed'], ['rendered', 'rendered'], ['association', 'observational'], ['model-advice', 'model-prediction']]) {
    assert.equal(assessEvidence({ ...claim, kind }, { ...evidence, kind: evidenceKind }).status, 'ready-for-review');
  }
  assert.equal(assessEvidence(claim, null).reason, 'missing-evidence');
  for (const key of ['context', 'artifactRevision', 'instrument']) {
    assert.equal(assessEvidence(claim, { ...evidence, [key]: 'other' }).reason, `${key}-mismatch`);
  }
  assert.throws(() => assessEvidence(claim, { ...evidence, limitations: [] }));
});

test('corpus audit blocks leakage across every declared grouping dimension', () => {
  assert.equal(auditCorpus(corpus()).status, 'ready-for-review');
  assert.equal(auditCorpus(corpus()).trainingAuthorized, false);
  for (const field of ['sourceGroup', 'brandGroup', 'templateGroup', 'contentHash']) {
    const records = corpus(); records[2][field] = records[0][field];
    assert.ok(auditCorpus(records).issues.some(x => x.reason === 'split-leakage' && x.field === field));
    records[2][field] = null;
    assert.ok(auditCorpus(records).issues.some(x => x.reason === 'missing-group' && x.field === field));
  }
  const transitive = corpus(); transitive[1].sourceGroup = transitive[0].sourceGroup; transitive[2].brandGroup = transitive[1].brandGroup;
  assert.equal(auditCorpus(transitive).issues.filter(x => x.reason === 'split-leakage').length, 2);
  const uncertain = corpus(); uncertain[0].rights.training = 'unknown'; uncertain[1].evidenceKind = 'model-prediction'; uncertain.pop();
  assert.deepEqual(auditCorpus(uncertain).issues.map(x => x.reason), ['rights-not-cleared', 'not-independent-evaluation', 'empty-split']);
  assert.throws(() => auditCorpus([...corpus(), corpus()[0]]));
  for (const invalid of [['train'], true, null, '__proto__']) {
    const records = corpus(); records[0].split = invalid;
    assert.throws(() => auditCorpus(records));
  }
});

test('JavaScript and Python agree on valid and invalid language contracts', () => {
  const changedCapture = capture(); changedCapture.observations.pop();
  const leak = corpus(); leak[2].templateGroup = leak[0].templateGroup;
  const candidates = [{ id: 'a', context: design.context }, { id: 'b', context: { ...design.context, audience: null } }];
  const calls = [
    ['validate_design', [design]], ['design_fingerprint', [design]],
    ['design_fingerprint', [{ ...design, id: 'caf\u00e9-\u{1f600}' }]],
    ...['\ufeff', '\u0085', 'reference-\u2028-entry'].map(id => ['design_fingerprint', [{ ...design, id }]]),
    ...[null, capture(), changedCapture, { ...capture(), designHash: 'old' }].map(c => ['assess_relations', [design, c]]),
    ...['#000000', '#ffffff', '#ff0000', '#123456', '#abcdef'].map(color => ['oklab', [color]]),
    ['describe_tokens', [tokens]], ['match_contexts', [design.context, candidates]],
    ['match_contexts', [{ ...design.context, task: null }, candidates]],
    ...[null, evidence, { ...evidence, kind: 'randomized', protocol: 'fixture-protocol' }].map(e => ['assess_evidence', [claim, e]]),
    ['audit_corpus', [corpus()]], ['audit_corpus', [leak]],
    ...invalidDesigns().map(d => ['validate_design', [d]]),
    ['describe_tokens', [{ ...tokens, bodyPx: true }]], ['oklab', ['#ffffff\n']],
    ['audit_corpus', [[...corpus(), corpus()[0]]]],
    ...[['train'], true, null, '__proto__'].map(split => ['audit_corpus', [[{ ...corpus()[0], split }, ...corpus().slice(1)]]]),
  ];
  const functions = { validate_design: validateDesign, design_fingerprint: designFingerprint, assess_relations: assessRelations,
    oklab, describe_tokens: describeTokens, match_contexts: matchContexts, assess_evidence: assessEvidence, audit_corpus: auditCorpus };
  const expected = calls.map(([name, args]) => { try { return { result: functions[name](...args) }; } catch { return { error: true }; } });
  const source = `import json,sys,language\nresult=[]\nfor name,args in json.load(sys.stdin):\n try: result.append({'result':getattr(language,name)(*args)})\n except (ValueError,TypeError,OverflowError): result.append({'error':True})\nprint(json.dumps(result,allow_nan=False))`;
  const result = spawnSync(resolvePython(), ['-X', 'utf8', '-c', source], { cwd: fileURLToPath(new URL('.', import.meta.url)), input: JSON.stringify(calls), encoding: 'utf8', maxBuffer: 2**22 });
  assert.equal(result.status, 0, result.stderr || String(result.error));
  close(expected, JSON.parse(result.stdout));
});

test('all 1000 retained recipes produce matching numerical descriptors in both languages', async () => {
  const winners = JSON.parse(await readFile(new URL('./evaluation/recipe-study/winners.json', import.meta.url), 'utf8'));
  assert.equal(winners.length, 1000);
  const inputs = winners.map(w => ({ foreground: w.palette.text, background: w.palette.background, bodyPx: w.numeric.bodyPx,
    headingPx: w.numeric.headingPx, lineHeightPx: w.numeric.bodyPx * w.numeric.lineHeight, gapPx: w.numeric.gapPx }));
  const actual = inputs.map(describeTokens);
  actual.forEach((d, i) => close(d.contrastRatio, winners[i].checks.ratios.body));
  const source = 'import json,sys; from language import describe_tokens; print(json.dumps([describe_tokens(x) for x in json.load(sys.stdin)],allow_nan=False))';
  const result = spawnSync(resolvePython(), ['-X', 'utf8', '-c', source], { cwd: fileURLToPath(new URL('.', import.meta.url)), input: JSON.stringify(inputs), encoding: 'utf8', maxBuffer: 2**22 });
  assert.equal(result.status, 0, result.stderr || String(result.error));
  close(actual, JSON.parse(result.stdout));
});

test('saved winner diagnostics are reproducible and do not promote a training or beauty claim', async () => {
  const report = await runStudy();
  const saved = JSON.parse(await readFile(new URL('./evaluation/language-study/report.json', import.meta.url), 'utf8'));
  close(report, saved);
  assert.equal(report.input.count, 1000);
  assert.ok(report.descriptors.distinctProjectedProfiles < report.input.count);
  assert.equal(report.corpus.status, 'blocked');
  assert.equal(report.corpus.trainingAuthorized, false);
  assert.deepEqual(report.decisions.map(x => x.action), ['retain', 'reject', 'reject']);
});
