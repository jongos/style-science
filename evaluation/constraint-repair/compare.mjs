import { reviewConstraints } from '../../constraint-repair.mjs';

// Deliberately separate reference implementation: no candidate internals imported.
export function holds(rule, assignment) {
  let total = 0;
  for (const name of Object.keys(rule.terms)) total += assignment[name] * rule.terms[name];
  switch (rule.relation) {
    case 'le': return total <= rule.rhs;
    case 'ge': return total >= rule.rhs;
    case 'eq': return total === rule.rhs;
    default: throw Error('Unsupported oracle relation');
  }
}
export function assignments(problem) {
  let result = [{}];
  for (const [name, variable] of Object.entries(problem.variables)) {
    result = result.flatMap(prefix => (variable.locked ? [variable.value] : variable.domain).map(value => ({ ...prefix, [name]: value })));
  }
  return result;
}
export function permitted(problem, assignment) {
  return assignment !== null && typeof assignment === 'object' &&
    Object.keys(assignment).sort().join(',') === Object.keys(problem.variables).sort().join(',') &&
    Object.entries(problem.variables).every(([name, v]) => v.domain.includes(assignment[name]) && (!v.locked || assignment[name] === v.value));
}
export function score(problem, assignment) {
  const differences = Object.keys(problem.variables).map(n => Math.abs(assignment[n] - problem.variables[n].value));
  return [differences.filter(x => x !== 0).length, differences.reduce((sum, x) => sum + x, 0)];
}
export function oracle(problem) {
  const feasible = assignments(problem).filter(a => problem.requirements.every(r => holds(r, a)));
  const costs = feasible.map(a => score(problem, a)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { feasible: feasible.length > 0, minimumCost: costs[0] ?? null };
}
export function localRepair(problem) {
  const current = Object.fromEntries(Object.entries(problem.variables).map(([n, v]) => [n, v.value]));
  const first = problem.requirements.find(r => !holds(r, current));
  if (!first) return null;
  const choices = [];
  for (const name of Object.keys(problem.variables).sort()) {
    const v = problem.variables[name];
    if (v.locked) continue;
    for (const value of [...v.domain].sort((a, b) => a - b)) {
      const candidate = { ...current, [name]: value };
      if (holds(first, candidate)) choices.push(candidate);
    }
  }
  choices.sort((a, b) => score(problem, a)[1] - score(problem, b)[1]);
  return choices[0] ?? null;
}
export function conflictValid(problem, conflict) {
  if (!conflict || !conflict.requirements.length || new Set(conflict.requirements).size !== conflict.requirements.length) return false;
  const rules = problem.requirements.filter(r => conflict.requirements.includes(r.id));
  if (rules.length !== conflict.requirements.length) return false;
  const space = assignments(problem);
  const feasible = subset => space.some(a => subset.every(r => holds(r, a)));
  return !feasible(rules) && rules.every(rule => feasible(rules.filter(r => r.id !== rule.id)));
}
export function compareCase(fixture) {
  const p = fixture.problem, reference = oracle(p), report = reviewConstraints(p);
  const current = Object.fromEntries(Object.entries(p.variables).map(([n, v]) => [n, v.value]));
  const currentValid = p.requirements.every(r => holds(r, current));
  function audit(proposal) {
    return { proposal, valid: proposal !== null && permitted(p, proposal) && p.requirements.every(r => holds(r, proposal)),
      lockViolation: proposal !== null && Object.entries(p.variables).some(([n, v]) => v.locked && proposal[n] !== v.value) };
  }
  const candidate = audit(report.repair?.values ?? null);
  return { id: fixture.id, family: fixture.family, split: fixture.split, reference, currentValid,
    repairable: reference.feasible && !currentValid,
    baseline: { failed: p.requirements.filter(r => !holds(r, current)).map(r => r.id), ...audit(null) },
    local: audit(localRepair(p)), candidate,
    feasibilityCorrect: report.status === (currentValid ? 'satisfied' : reference.feasible ? 'repair-proposed' : 'infeasible'),
    optimal: !report.repair || JSON.stringify(score(p, report.repair.values)) === JSON.stringify(reference.minimumCost),
    conflictCorrect: reference.feasible ? report.conflict === null : conflictValid(p, report.conflict), report };
}
export function summarize(rows) {
  const stats = { cases: rows.length, repairable: rows.filter(r => r.repairable).length,
    feasibilityCorrect: rows.filter(r => r.feasibilityCorrect).length,
    optimal: rows.filter(r => r.optimal).length, conflictCorrect: rows.filter(r => r.conflictCorrect).length,
    irrelevantConstraintsRemoved: rows.filter(r => r.family === 'contradiction' && !r.report.conflict.requirements.includes('irrelevant-y')).length };
  for (const name of ['baseline', 'local', 'candidate']) stats[name] = {
    validRepairs: rows.filter(r => r.repairable && r[name].valid).length,
    invalidProposals: rows.filter(r => r[name].proposal !== null && !r[name].valid).length,
    missingRepairs: rows.filter(r => r.repairable && r[name].proposal === null).length,
    lockViolations: rows.filter(r => r[name].lockViolation).length,
  };
  return stats;
}
