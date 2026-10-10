import { createHash } from 'node:crypto';

const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const integer = x => Number.isSafeInteger(x) && Math.abs(x) <= 1000000;
const identifier = x => typeof x === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(x);
const keys = (x, names) => object(x) && Object.keys(x).sort().join(',') === [...names].sort().join(',');
const canonical = x => Array.isArray(x) ? x.map(canonical) : object(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;
const compare = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
const satisfies = (r, values) => {
  const lhs = Object.entries(r.terms).reduce((sum, [name, coefficient]) => sum + coefficient * values[name], 0);
  return r.relation === 'le' ? lhs <= r.rhs : r.relation === 'ge' ? lhs >= r.rhs : lhs === r.rhs;
};

function validate(p) {
  if (!keys(p, ['version', 'artifactRevision', 'observedRevision', 'variables', 'requirements']) || p.version !== 1 ||
      !identifier(p.artifactRevision) || !identifier(p.observedRevision) || !object(p.variables) ||
      !Array.isArray(p.requirements) || !p.requirements.length || p.requirements.length > 12) return 'invalid-or-unsupported';
  const names = Object.keys(p.variables).sort();
  if (!names.length || names.length > 6 || !names.every(identifier)) return 'invalid-or-unsupported';
  let count = 1;
  for (const v of Object.values(p.variables)) {
    if (!keys(v, ['value', 'domain', 'locked', 'unit']) || v.unit !== 'px' || typeof v.locked !== 'boolean' || !integer(v.value) ||
        !Array.isArray(v.domain) || !v.domain.length || v.domain.length > 32 || !v.domain.every(integer) ||
        new Set(v.domain).size !== v.domain.length || !v.domain.includes(v.value)) return 'invalid-or-unsupported';
    count *= v.locked ? 1 : v.domain.length;
  }
  const ids = new Set();
  for (const r of p.requirements) {
    if (!keys(r, ['id', 'terms', 'relation', 'rhs']) || !identifier(r.id) || ids.has(r.id) ||
        !['le', 'ge', 'eq'].includes(r.relation) || !integer(r.rhs) || !object(r.terms) || !Object.keys(r.terms).length ||
        Object.entries(r.terms).some(([name, coefficient]) => !names.includes(name) || !integer(coefficient))) return 'invalid-or-unsupported';
    ids.add(r.id);
  }
  if (p.artifactRevision !== p.observedRevision) return 'stale-revision';
  return count > 4096 ? 'search-budget-exceeded' : null;
}

export function reviewConstraints(problem) {
  const base = { version: '0.1.0', experimental: true, scope: 'declared-finite-domain-only', releaseEligible: false, automaticAction: false, repair: null, conflict: null };
  const reason = validate(problem);
  if (reason) return { ...base, status: 'unknown', reason };
  const names = Object.keys(problem.variables).sort();
  const current = Object.fromEntries(names.map(n => [n, problem.variables[n].value]));
  const domains = Object.fromEntries(names.map(n => [n, problem.variables[n].locked ? [current[n]] : [...problem.variables[n].domain].sort((a, b) => a - b)]));
  const requirements = [...problem.requirements].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const failed = requirements.filter(r => !satisfies(r, current)).map(r => r.id);
  const binding = { artifactRevision: problem.artifactRevision, inputHash: createHash('sha256').update(JSON.stringify(canonical(problem))).digest('hex') };
  if (!failed.length) return { ...base, ...binding, status: 'satisfied', failed, evaluatedAssignments: 0 };
  const rows = [];
  function visit(index, values) {
    if (index === names.length) {
      rows.push({ values: { ...values }, failed: requirements.filter(r => !satisfies(r, values)).map(r => r.id) });
      return;
    }
    const name = names[index];
    for (const value of domains[name]) { values[name] = value; visit(index + 1, values); }
  }
  visit(0, {});
  const cost = values => [names.filter(n => values[n] !== current[n]).length, names.reduce((s, n) => s + Math.abs(values[n] - current[n]), 0), ...names.map(n => values[n])];
  const feasible = rows.filter(row => !row.failed.length).sort((a, b) => compare(cost(a.values), cost(b.values)));
  if (feasible.length) {
    const values = feasible[0].values;
    return { ...base, ...binding, status: 'repair-proposed', failed, evaluatedAssignments: rows.length,
      repair: { values, cost: cost(values).slice(0, 2), changes: names.filter(n => values[n] !== current[n]).map(n => ({ variable: n, from: current[n], to: values[n] })), requiresRenderedVerification: true } };
  }
  // Deletion yields one inclusion-minimal conflict, relative to fixed domains/locks.
  let conflict = requirements.map(r => r.id);
  for (const id of [...conflict]) {
    const trial = conflict.filter(x => x !== id);
    if (!rows.some(row => trial.every(x => !row.failed.includes(x)))) conflict = trial;
  }
  return { ...base, ...binding, status: 'infeasible', failed, evaluatedAssignments: rows.length,
    conflict: { requirements: conflict, domains, locked: names.filter(n => problem.variables[n].locked), minimality: 'inclusion-minimal-relative-to-domains-and-locks' } };
}
