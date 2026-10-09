// Observable proxies for declared relationships, never a semantic/perceptual verdict.
import { createHash } from 'node:crypto';
import { designFingerprint } from './language.mjs';

export const relationMeasureVersion = '0.1.0';
const compatible = { 'dom-parent': 'contains', 'box-contains': 'contains',
  'dom-before': 'precedes', 'y-before': 'precedes', 'x-before': 'precedes', 'x-after': 'precedes' };
const text = x => typeof x === 'string' && x.trim().length > 0 && x.length <= 4000 && !/[\uD800-\uDFFF]/u.test(x);
const finite = x => typeof x === 'number' && Number.isFinite(x);
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const keys = (x, names) => object(x) && Object.keys(x).length === names.length && names.every(k => Object.hasOwn(x, k));
const unique = xs => new Set(xs).size === xs.length;
const canonical = x => Array.isArray(x) ? `[${x.map(canonical).join(',')}]`
  : object(x) ? `{${Object.keys(x).sort().map(k => `${JSON.stringify(k)}:${canonical(x[k])}`).join(',')}}` : JSON.stringify(x);

export function validateRelationPlan(design, plan) {
  const designHash = designFingerprint(design);
  if (!keys(plan, ['schemaVersion', 'id', 'designHash', 'bindings', 'environments', 'requirements']) || plan.schemaVersion !== 1 || !text(plan.id) || plan.designHash !== designHash) throw Error('Invalid or stale relation plan');
  if (!Array.isArray(plan.bindings) || plan.bindings.length !== design.nodes.length) throw Error('Bind every declared node');
  for (const b of plan.bindings) if (!keys(b, ['node', 'selector']) || !design.nodes.some(n => n.id === b.node) || !text(b.selector)) throw Error('Invalid node binding');
  if (!unique(plan.bindings.map(b => b.node))) throw Error('Duplicate node binding');
  if (!Array.isArray(plan.environments) || !plan.environments.length || plan.environments.length > 32) throw Error('Declare 1-32 environments');
  for (const e of plan.environments) {
    if (!keys(e, ['id', 'width', 'height', 'colorScheme']) || !text(e.id) || !['width', 'height'].every(k => Number.isInteger(e[k]) && e[k] > 0 && e[k] <= 16384) || !['light', 'dark'].includes(e.colorScheme)) throw Error('Invalid environment');
  }
  if (!unique(plan.environments.map(e => e.id))) throw Error('Duplicate environment');
  if (!Array.isArray(plan.requirements) || !plan.requirements.length || plan.requirements.length > 128) throw Error('Declare 1-128 measurement requirements');
  for (const r of plan.requirements) {
    if (!keys(r, ['id', 'relation', 'instrument']) || !text(r.id) || !Object.hasOwn(compatible, r.instrument) || typeof r.instrument !== 'string' ||
        !design.relations.some(edge => edge.id === r.relation && edge.kind === compatible[r.instrument])) throw Error('Unsupported relation instrument');
  }
  if (!unique(plan.requirements.map(r => r.id)) || !unique(plan.requirements.map(r => JSON.stringify([r.relation, r.instrument])))) throw Error('Duplicate measurement requirement');
  return plan;
}

export function relationPlanFingerprint(design, plan) {
  validateRelationPlan(design, plan);
  return createHash('sha256').update(canonical(plan)).digest('hex');
}

function box(x) {
  return keys(x, ['left', 'top', 'width', 'height']) && Object.values(x).every(finite) && x.width > 0 && x.height > 0 &&
    finite(x.left + x.width) && finite(x.top + x.height);
}

export function evaluateRelationMeasure(instrument, measurement) {
  if (typeof instrument !== 'string' || !Object.hasOwn(compatible, instrument)) throw Error('Unsupported instrument');
  const unknown = reason => ({ status: 'unknown', reason });
  if (!object(measurement)) return unknown('missing-measurement');
  if (Object.hasOwn(measurement, 'unknown')) return unknown(keys(measurement, ['unknown']) && text(measurement.unknown) ? measurement.unknown : 'malformed-measurement');
  if (['dom-parent', 'dom-before'].includes(instrument)) {
    if (!keys(measurement, ['value']) || typeof measurement.value !== 'boolean') return unknown('malformed-measurement');
    return { status: measurement.value ? 'pass' : 'fail', value: measurement.value, unit: 'boolean' };
  }
  if (!keys(measurement, ['from', 'to']) || !box(measurement.from) || !box(measurement.to)) return unknown('malformed-boxes');
  const a = measurement.from, b = measurement.to;
  let value;
  if (instrument === 'box-contains') value = Math.min(b.left-a.left, b.top-a.top, a.left+a.width-b.left-b.width, a.top+a.height-b.top-b.height);
  if (instrument === 'y-before') value = b.top-a.top-a.height;
  if (instrument === 'x-before') value = b.left-a.left-a.width;
  if (instrument === 'x-after') value = a.left-b.left-b.width;
  if (!finite(value)) return unknown('numeric-overflow');
  if (value === 0) value = 0;
  return { status: value >= 0 ? 'pass' : 'fail', value, unit: 'css-px' };
}

export function verifyRelationMeasures(design, plan, snapshots) {
  const planHash = relationPlanFingerprint(design, plan);
  if (!Array.isArray(snapshots) || snapshots.length > 32) throw Error('Invalid snapshot list');
  for (const s of snapshots) {
    if (!keys(s, ['schemaVersion', 'planHash', 'designHash', 'artifactRevision', 'environment', 'measurements', 'adapter', 'renderer']) ||
        !keys(s.environment, ['id', 'width', 'height', 'colorScheme']) || !plan.environments.some(e => e.id === s.environment.id) ||
        !object(s.measurements)) throw Error('Malformed snapshot envelope');
    if (Object.keys(s.measurements).some(id => !plan.requirements.some(r => r.id === id))) throw Error('Undeclared measurement');
  }
  if (!unique(snapshots.map(s => s.environment.id))) throw Error('Duplicate snapshot environment');
  const results = [];
  for (const environment of plan.environments) {
    const s = snapshots.find(s => s.environment.id === environment.id);
    let reason;
    if (!s) reason = 'missing-snapshot';
    else if (s.schemaVersion !== 1 || s.planHash !== planHash || s.designHash !== plan.designHash || s.artifactRevision !== design.revision) reason = 'stale-snapshot';
    else if (!['width', 'height', 'colorScheme'].every(k => s.environment[k] === environment[k])) reason = 'environment-mismatch';
    else if (!text(s.adapter) || !text(s.renderer)) reason = 'missing-provenance';
    for (const r of plan.requirements) results.push({ environment: environment.id, requirement: r.id, relation: r.relation, instrument: r.instrument,
      ...(reason ? { status: 'unknown', reason } : evaluateRelationMeasure(r.instrument, s.measurements[r.id])) });
  }
  return { relationMeasureVersion, planHash, status: results.some(r => r.status === 'fail') ? 'fail' : results.some(r => r.status === 'unknown') ? 'unknown' : 'pass',
    results, unprobedRelations: design.relations.filter(r => !plan.requirements.some(q => q.relation === r.id)).map(r => r.id),
    semanticStatus: 'not-assessed', automaticSelection: false,
    scope: 'Declared DOM and border-box predicates only; no meaningful reading order, perceived grouping/emphasis, visibility coverage or accessibility verdict.' };
}
