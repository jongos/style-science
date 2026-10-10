const variable = (value, scale, locked = false, domain = [1, 2, 3]) => ({
  value: value * scale, domain: domain.map(x => x * scale), locked, unit: 'px',
});
const rule = (id, terms, relation, rhs) => ({ id, terms, relation, rhs });
export const cases = [];
for (const scale of [1, 2, 3, 5, 7, 11]) {
  const cap = rhs => rule('capacity', { x: 1, y: 1 }, 'le', rhs * scale);
  const families = [
    ['already-valid', { x: variable(1, scale), y: variable(1, scale) }, [cap(4)]],
    ['single-repair', { x: variable(3, scale), y: variable(2, scale) }, [cap(4)]],
    ['coupled-repair', { x: variable(3, scale), y: variable(3, scale) }, [cap(2)]],
    ['secondary-trap', { x: variable(3, scale), y: variable(2, scale) }, [cap(4), rule('minimum-x', { x: 1 }, 'ge', 3 * scale)]],
    ['locked-obstruction', { x: variable(3, scale, true), y: variable(2, scale, false, [2, 3]) }, [cap(4)]],
    ['contradiction', { x: variable(3, scale), y: variable(2, scale) }, [rule('maximum-x', { x: 1 }, 'le', scale), rule('minimum-x', { x: 1 }, 'ge', 2 * scale), rule('irrelevant-y', { y: 1 }, 'ge', scale)]],
    ['equal-cost', { x: variable(3, scale), y: variable(3, scale) }, [cap(5)]],
    ['signed-equality', { x: variable(1, scale), y: variable(3, scale) }, [rule('difference', { x: 1, y: -1 }, 'eq', scale)]],
  ];
  for (const [family, variables, requirements] of families) cases.push({
    id: `${family}-${scale}`, family, split: scale <= 2 ? 'development' : 'held-out',
    problem: { version: 1, artifactRevision: `synthetic-${family}-${scale}`, observedRevision: `synthetic-${family}-${scale}`, variables, requirements },
  });
}
