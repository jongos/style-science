// Experimental design-language contracts. No renderer, judge, or trained model.
import { createHash } from 'node:crypto';
import { contrast } from './engine.mjs';

export const languageVersion = '0.1.0';
const contextKeys = ['task', 'audience', 'medium', 'intent'];
const kinds = ['group', 'text', 'image', 'action', 'data'];
const relations = ['contains', 'precedes', 'groups-with', 'emphasizes'];
const evidenceKinds = ['computed', 'rendered', 'observational', 'randomized', 'model-prediction', 'synthetic'];
const text = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 4000 && !/[\uD800-\uDFFF]/u.test(x);
const number = x => typeof x === 'number' && Number.isFinite(x);
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function fields(x, required, optional = []) {
  if (!object(x) || required.some(k => !Object.hasOwn(x, k)) ||
      Object.keys(x).some(k => !required.includes(k) && !optional.includes(k))) throw Error('Invalid or unknown fields');
}
function texts(values) { if (!values.every(text)) throw Error('Expected bounded nonempty text'); }
function list(x, maximum, allowEmpty = false) {
  if (!Array.isArray(x) || x.length > maximum || (!allowEmpty && !x.length)) throw Error('Invalid list length');
}
function unique(values) { if (new Set(values).size !== values.length) throw Error('Duplicate value'); }
function context(x, incomplete = false) {
  fields(x, contextKeys);
  if (!Object.values(x).every(v => text(v) || (incomplete && v === null))) throw Error('Invalid context');
}
const canonical = x => Array.isArray(x) ? `[${x.map(canonical).join(',')}]`
  : object(x) ? `{${Object.keys(x).sort().map(k => `${JSON.stringify(k)}:${canonical(x[k])}`).join(',')}}` : JSON.stringify(x);

function acyclic(nodes, edges) {
  const indegree = new Map(nodes.map(n => [n.id, 0]));
  const next = new Map(nodes.map(n => [n.id, []]));
  for (const e of edges) { indegree.set(e.to, indegree.get(e.to) + 1); next.get(e.from).push(e.to); }
  const queue = [...indegree.keys()].filter(id => indegree.get(id) === 0);
  let visited = 0;
  for (let i = 0; i < queue.length; i++) {
    visited++;
    for (const id of next.get(queue[i])) {
      indegree.set(id, indegree.get(id) - 1);
      if (indegree.get(id) === 0) queue.push(id);
    }
  }
  if (visited !== nodes.length) throw Error('Cyclic relation');
}

export function validateDesign(design) {
  fields(design, ['languageVersion', 'id', 'revision', 'context', 'nodes', 'relations']);
  if (design.languageVersion !== languageVersion) throw Error('Unsupported language version');
  texts([design.id, design.revision]); context(design.context);
  list(design.nodes, 256); list(design.relations, 1024, true);
  for (const n of design.nodes) {
    fields(n, ['id', 'kind', 'role', 'tokenRefs']); texts([n.id, n.role]);
    if (!kinds.includes(n.kind)) throw Error('Unsupported node kind');
    list(n.tokenRefs, 64, true); texts(n.tokenRefs); unique(n.tokenRefs);
  }
  unique(design.nodes.map(n => n.id));
  const nodes = new Map(design.nodes.map(n => [n.id, n]));
  const identities = [], parents = [];
  for (const r of design.relations) {
    fields(r, ['id', 'kind', 'from', 'to']); texts([r.id, r.from, r.to]);
    if (!relations.includes(r.kind) || !nodes.has(r.from) || !nodes.has(r.to) || r.from === r.to) throw Error('Unsupported or dangling relation');
    const pair = r.kind === 'groups-with' ? [r.from, r.to].sort() : [r.from, r.to];
    identities.push(JSON.stringify([r.kind, ...pair]));
    if (r.kind === 'contains') {
      if (nodes.get(r.from).kind !== 'group') throw Error('Only a group may contain nodes');
      parents.push(r.to);
    }
  }
  unique(design.relations.map(r => r.id)); unique(identities); unique(parents);
  for (const kind of ['contains', 'precedes', 'emphasizes']) acyclic(design.nodes, design.relations.filter(r => r.kind === kind));
  return design;
}

// Binds a declaration, not a perceptual identity or proof of authenticity.
export function designFingerprint(design) {
  validateDesign(design);
  return createHash('sha256').update(canonical(design)).digest('hex');
}

export function assessRelations(design, capture) {
  const designHash = designFingerprint(design);
  const base = { languageVersion, designHash, automaticSelection: false, scope: 'Host-reported relation evidence only; not rendered or aesthetic verification.' };
  if (capture === null) return { ...base, status: 'unknown', reason: 'missing-capture' };
  fields(capture, ['designHash', 'environment', 'artifactRevision', 'observations']);
  texts([capture.designHash, capture.environment, capture.artifactRevision]); list(capture.observations, 1024, true);
  const ids = new Set(design.relations.map(r => r.id));
  for (const o of capture.observations) {
    fields(o, ['relation', 'status', 'instrument', 'source']); texts([o.relation, o.instrument, o.source]);
    if (!ids.has(o.relation) || !['pass', 'fail', 'unknown'].includes(o.status)) throw Error('Invalid relation observation');
  }
  unique(capture.observations.map(o => o.relation));
  if (capture.designHash !== designHash || capture.artifactRevision !== design.revision) return { ...base, status: 'unknown', reason: 'stale-capture' };
  if (!design.relations.length) return { ...base, status: 'unknown', reason: 'no-relations' };
  const results = design.relations.map(r => ({ relation: r.id, status: capture.observations.find(o => o.relation === r.id)?.status ?? 'unknown' }));
  const status = results.some(r => r.status === 'fail') ? 'fail' : results.some(r => r.status === 'unknown') ? 'unknown' : 'pass';
  return { ...base, status, environment: capture.environment, results };
}

// Bjorn Ottosson's 2021-01-25 Oklab matrices; attribution in evaluation/LANGUAGE.md.
export function oklab(hex) {
  if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) throw Error('Expected opaque six-digit sRGB hex');
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = rgb;
  const l = Math.cbrt(0.4122214708*r + 0.5363325363*g + 0.0514459929*b);
  const m = Math.cbrt(0.2119034982*r + 0.6806995451*g + 0.1073969566*b);
  const s = Math.cbrt(0.0883024619*r + 0.2817188376*g + 0.6299787005*b);
  return { L: 0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
    a: 1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
    b: 0.0259040371*l + 0.7827717662*m - 0.8086757660*s };
}

export function describeTokens(tokens) {
  fields(tokens, ['foreground', 'background', 'bodyPx', 'headingPx', 'lineHeightPx', 'gapPx']);
  for (const k of ['bodyPx', 'headingPx', 'lineHeightPx', 'gapPx']) {
    if (!number(tokens[k]) || (k === 'gapPx' ? tokens[k] < 0 : tokens[k] <= 0) || tokens[k] > 16384) throw Error('Invalid declared pixel dimension');
  }
  const foreground = oklab(tokens.foreground), background = oklab(tokens.background);
  const values = { contrastRatio: contrast(tokens.foreground, tokens.background),
    typeRatio: tokens.headingPx / tokens.bodyPx, lineHeightRatio: tokens.lineHeightPx / tokens.bodyPx,
    gapRatio: tokens.gapPx / tokens.bodyPx,
    colorDistance: Math.hypot(...['L', 'a', 'b'].map(k => foreground[k] - background[k])) };
  if (!Object.values(values).every(number)) throw Error('Descriptor exceeds numeric range');
  return { languageVersion, evidenceKind: 'computed', scope: 'Declared tokens only; no rendered perception, font metrics, accessibility verdict, or beauty score.',
    foreground, background, ...values };
}

export function matchContexts(request, candidates) {
  context(request, true); list(candidates, 10000, true);
  for (const c of candidates) { fields(c, ['id', 'context']); texts([c.id]); context(c.context, true); }
  unique(candidates.map(c => c.id));
  const missing = contextKeys.filter(k => request[k] === null);
  if (missing.length) return { status: 'needs-context', missing, eligible: [], automaticSelection: false };
  const results = candidates.map(c => {
    const missing = contextKeys.filter(k => c.context[k] === null);
    const mismatched = contextKeys.filter(k => c.context[k] !== null && c.context[k] !== request[k]);
    return { id: c.id, status: mismatched.length ? 'out-of-scope' : missing.length ? 'unknown' : 'matching', missing, mismatched };
  });
  return { status: 'advisory', eligible: results.filter(r => r.status === 'matching').map(r => r.id), results, automaticSelection: false };
}

export function assessEvidence(claim, evidence) {
  fields(claim, ['id', 'kind', 'context', 'artifactRevision', 'instrument']);
  texts(Object.values(claim));
  const compatible = { numerical: ['computed'], rendered: ['rendered'], association: ['observational', 'randomized'],
    causal: ['randomized'], preference: ['observational', 'randomized'], 'model-advice': ['model-prediction'] };
  if (!Object.hasOwn(compatible, claim.kind)) throw Error('Unsupported claim kind');
  const base = { languageVersion, claim: claim.id, automaticAction: false, establishesClaim: false };
  if (evidence === null) return { ...base, status: 'unknown', reason: 'missing-evidence' };
  fields(evidence, ['id', 'kind', 'context', 'artifactRevision', 'instrument', 'source', 'limitations', 'protocol']);
  texts([evidence.id, evidence.context, evidence.artifactRevision, evidence.instrument, evidence.source]);
  list(evidence.limitations, 32); texts(evidence.limitations);
  if (!evidenceKinds.includes(evidence.kind) || !(evidence.protocol === null || text(evidence.protocol))) throw Error('Invalid evidence kind or protocol');
  for (const key of ['context', 'artifactRevision', 'instrument']) {
    if (evidence[key] !== claim[key]) return { ...base, status: 'unknown', reason: `${key}-mismatch` };
  }
  if (!compatible[claim.kind].includes(evidence.kind)) return { ...base, status: 'unknown', reason: 'incompatible-evidence' };
  if (['causal', 'preference'].includes(claim.kind) && evidence.protocol === null) return { ...base, status: 'unknown', reason: 'missing-protocol' };
  return { ...base, status: 'ready-for-review', evidence: evidence.id, limitations: [...evidence.limitations] };
}

export function auditCorpus(records) {
  list(records, 100000); const issues = [], splits = { train: 0, validation: 0, test: 0 };
  const groups = new Map();
  for (const r of records) {
    fields(r, ['id', 'split', 'sourceGroup', 'brandGroup', 'templateGroup', 'contentHash', 'rights', 'evidenceKind']);
    texts([r.id]);
    if (!['train', 'validation', 'test'].includes(r.split) || !evidenceKinds.includes(r.evidenceKind)) throw Error('Invalid split or evidence kind');
    if (r.contentHash !== null && (typeof r.contentHash !== 'string' || !/^[a-f0-9]{64}$/.test(r.contentHash))) throw Error('Invalid SHA-256');
    fields(r.rights, ['training', 'license', 'source']);
    if (!['cleared', 'unknown', 'denied'].includes(r.rights.training)) throw Error('Invalid rights status');
    for (const k of ['license', 'source']) if (r.rights[k] !== null && !text(r.rights[k])) throw Error('Invalid rights provenance');
    if (r.rights.training !== 'cleared' || !text(r.rights.license) || !text(r.rights.source)) issues.push({ id: r.id, reason: 'rights-not-cleared' });
    splits[r.split]++;
    for (const k of ['sourceGroup', 'brandGroup', 'templateGroup', 'contentHash']) {
      if (r[k] === null) { issues.push({ id: r.id, reason: 'missing-group', field: k }); continue; }
      texts([r[k]]);
      const key = JSON.stringify([k, r[k]]);
      if (!groups.has(key)) groups.set(key, { field: k, value: r[k], splits: new Set(), ids: [] });
      const group = groups.get(key); group.splits.add(r.split); group.ids.push(r.id);
    }
    if (r.split !== 'train' && ['synthetic', 'model-prediction'].includes(r.evidenceKind)) issues.push({ id: r.id, reason: 'not-independent-evaluation' });
  }
  unique(records.map(r => r.id));
  for (const group of groups.values()) if (group.splits.size > 1) issues.push({ reason: 'split-leakage', field: group.field, value: group.value, ids: group.ids });
  for (const [split, count] of Object.entries(splits)) if (!count) issues.push({ reason: 'empty-split', split });
  return { languageVersion, status: issues.length ? 'blocked' : 'ready-for-review', splits, issues,
    trainingAuthorized: false, scope: 'Supplied metadata only; no legal clearance, semantic deduplication, or independent-label verification.' };
}
