import { verify } from './engine.mjs';

export const canvasVersion = '0.1.0';
const text = x => typeof x === 'string' && x.trim().length > 0;
const number = x => typeof x === 'number' && Number.isFinite(x);

export function boundedEffect(baseline, candidate, direction, minimumEffect) {
  for (const interval of [baseline, candidate]) {
    if (!interval || !number(interval.lower) || !number(interval.upper) || interval.lower > interval.upper) throw Error('Invalid measurement bounds');
  }
  if (!['minimize', 'maximize'].includes(direction) || !number(minimumEffect) || minimumEffect < 0) throw Error('Invalid outcome direction or practical threshold');
  const lower = direction === 'minimize' ? baseline.lower - candidate.upper : candidate.lower - baseline.upper;
  const upper = direction === 'minimize' ? baseline.upper - candidate.lower : candidate.upper - baseline.lower;
  if (!number(lower) || !number(upper)) throw Error('Effect exceeds numeric range');
  const status = lower > minimumEffect ? 'improved' : upper < -minimumEffect ? 'worsened'
    : lower >= -minimumEffect && upper <= minimumEffect ? 'negligible' : 'inconclusive';
  return { lower, upper, status };
}

function validateSpec(spec) {
  if (!spec || !text(spec.context) || !Array.isArray(spec.metrics) || !spec.metrics.length) throw Error('Declare context and outcome metrics');
  const ids = new Set();
  for (const m of spec.metrics) {
    if (!m || ![m.id, m.unit, m.instrument].every(text) || ids.has(m.id) || !['minimize', 'maximize'].includes(m.direction) || !number(m.minimumEffect) || m.minimumEffect < 0) throw Error('Invalid or duplicate outcome metric');
    ids.add(m.id);
  }
}

function indexOutcomes(artifact, spec, environments) {
  if (!artifact || !text(artifact.id) || !text(artifact.revision) || !Array.isArray(artifact.outcomes)) throw Error('Declare artifact identity, revision and outcomes');
  const index = new Map();
  for (const record of artifact.outcomes) {
    if (!record || !spec.metrics.some(m => m.id === record.metric) || !environments.includes(record.environment)) throw Error('Undeclared metric or environment');
    const key = JSON.stringify([record.environment, record.metric]);
    if (index.has(key)) throw Error('Duplicate outcome observation');
    index.set(key, record);
  }
  return index;
}

// Engineering bounds yield conditional comparisons, not statistical confidence.
export function compareCanvas(plan, baseline, candidate, spec) {
  validateSpec(spec);
  const feasibility = { baseline: verify(plan, baseline.snapshots), candidate: verify(plan, candidate.snapshots) };
  const environments = plan.environments.map(e => e.id);
  const left = indexOutcomes(baseline, spec, environments);
  const right = indexOutcomes(candidate, spec, environments);
  const results = [];
  for (const environment of environments) for (const metric of spec.metrics) {
    const key = JSON.stringify([environment, metric.id]);
    const a = left.get(key), b = right.get(key);
    const item = { environment, metric: metric.id, unit: metric.unit, minimumEffect: metric.minimumEffect };
    let reason;
    if (!a || !b) reason = 'missing-observation';
    else if (a.context !== spec.context || b.context !== spec.context) reason = 'context-mismatch';
    else if (a.artifactRevision !== baseline.revision || b.artifactRevision !== candidate.revision) reason = 'stale-observation';
    else if ([a, b].some(r => r.source !== 'measurement')) reason = 'not-measured';
    else if ([a, b].some(r => r.unit !== metric.unit || r.instrument !== metric.instrument)) reason = 'instrument-or-unit-mismatch';
    if (reason) results.push({ ...item, status: 'unknown', reason });
    else results.push({ ...item, ...boundedEffect(a, b, metric.direction, metric.minimumEffect) });
  }
  const status = feasibility.candidate.status !== 'pass' ? 'blocked'
    : results.some(r => r.status === 'unknown') ? 'incomplete' : 'comparison';
  return { canvasVersion, status, context: spec.context, baseline: baseline.id, candidate: candidate.id,
    feasibility, results, automaticSelection: false,
    scope: 'Declared outcomes and supplied engineering bounds only; no causal, aesthetic or statistical-confidence claim.' };
}

export function assessExperiment(plan) {
  const required = ['feature', 'hypothesis', 'baseline', 'intervention', 'metric', 'budget'];
  if (!plan || required.some(k => !text(plan[k]))) return { status: 'incomplete', collectionAuthorized: false };
  const actions = [plan.ifSupported, plan.ifRefuted];
  if (actions.some(a => !a || !['improve', 'remove', 'retain', 'reject'].includes(a.action) || !text(a.change))) return { status: 'incomplete', collectionAuthorized: false };
  if (actions.every(a => a.action === 'retain') || (actions[0].action === actions[1].action && actions[0].change.trim() === actions[1].change.trim())) return { status: 'no-feature-decision', collectionAuthorized: false };
  return { status: 'ready-for-review', collectionAuthorized: false };
}
