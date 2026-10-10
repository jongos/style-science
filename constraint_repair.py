"""Experimental exact search over declared finite integer domains, not rendering."""
import hashlib
import json
import re


def _integer(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and abs(x) <= 1000000 and int(x) == x


def _identifier(x):
    return isinstance(x, str) and re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,127}", x) is not None


def _keys(x, names):
    return isinstance(x, dict) and set(x) == set(names)


def _satisfies(rule, values):
    lhs = sum(coefficient * values[name] for name, coefficient in rule['terms'].items())
    return lhs <= rule['rhs'] if rule['relation'] == 'le' else lhs >= rule['rhs'] if rule['relation'] == 'ge' else lhs == rule['rhs']


def _validate(p):
    if (not _keys(p, ['version', 'artifactRevision', 'observedRevision', 'variables', 'requirements'])
            or isinstance(p['version'], bool) or p['version'] != 1
            or not _identifier(p['artifactRevision']) or not _identifier(p['observedRevision'])
            or not isinstance(p['variables'], dict) or not isinstance(p['requirements'], list)
            or not 1 <= len(p['requirements']) <= 12):
        return 'invalid-or-unsupported'
    names = list(p['variables'])
    if not 1 <= len(names) <= 6 or not all(_identifier(n) for n in names):
        return 'invalid-or-unsupported'
    count = 1
    for v in p['variables'].values():
        if (not _keys(v, ['value', 'domain', 'locked', 'unit']) or v['unit'] != 'px'
                or not isinstance(v['locked'], bool) or not _integer(v['value'])
                or not isinstance(v['domain'], list) or not 1 <= len(v['domain']) <= 32
                or not all(_integer(x) for x in v['domain'])
                or len(set(v['domain'])) != len(v['domain']) or v['value'] not in v['domain']):
            return 'invalid-or-unsupported'
        count *= 1 if v['locked'] else len(v['domain'])
    ids = set()
    for r in p['requirements']:
        if (not _keys(r, ['id', 'terms', 'relation', 'rhs']) or not _identifier(r['id']) or r['id'] in ids
                or r['relation'] not in ['le', 'ge', 'eq'] or not _integer(r['rhs'])
                or not isinstance(r['terms'], dict) or not r['terms']
                or any(n not in names or not _integer(c) for n, c in r['terms'].items())):
            return 'invalid-or-unsupported'
        ids.add(r['id'])
    if p['artifactRevision'] != p['observedRevision']:
        return 'stale-revision'
    return 'search-budget-exceeded' if count > 4096 else None


def _canonical(x):
    if isinstance(x, dict):
        return {k: _canonical(v) for k, v in x.items()}
    if isinstance(x, list):
        return [_canonical(v) for v in x]
    if isinstance(x, (int, float)) and not isinstance(x, bool):
        return int(x)
    return x


def review_constraints(problem):
    base = dict(version='0.1.0', experimental=True, scope='declared-finite-domain-only', releaseEligible=False, automaticAction=False, repair=None, conflict=None)
    reason = _validate(problem)
    if reason:
        return dict(base, status='unknown', reason=reason)
    names = sorted(problem['variables'])
    current = {n: problem['variables'][n]['value'] for n in names}
    domains = {n: [current[n]] if problem['variables'][n]['locked'] else sorted(problem['variables'][n]['domain']) for n in names}
    requirements = sorted(problem['requirements'], key=lambda r: r['id'])
    failed = [r['id'] for r in requirements if not _satisfies(r, current)]
    encoded = json.dumps(_canonical(problem), sort_keys=True, separators=(',', ':'), ensure_ascii=True)
    binding = dict(artifactRevision=problem['artifactRevision'], inputHash=hashlib.sha256(encoded.encode()).hexdigest())
    if not failed:
        return dict(base, **binding, status='satisfied', failed=failed, evaluatedAssignments=0)
    rows = []

    def visit(index, values):
        if index == len(names):
            rows.append(dict(values=values.copy(), failed=[r['id'] for r in requirements if not _satisfies(r, values)]))
            return
        name = names[index]
        for value in domains[name]:
            values[name] = value
            visit(index + 1, values)

    visit(0, {})

    def cost(values):
        return [sum(values[n] != current[n] for n in names), sum(abs(values[n] - current[n]) for n in names)] + [values[n] for n in names]

    feasible = sorted((row for row in rows if not row['failed']), key=lambda row: cost(row['values']))
    if feasible:
        values = feasible[0]['values']
        repair = dict(values=values, cost=cost(values)[:2], changes=[dict(variable=n, **{'from': current[n], 'to': values[n]}) for n in names if values[n] != current[n]], requiresRenderedVerification=True)
        return dict(base, **binding, status='repair-proposed', failed=failed, evaluatedAssignments=len(rows), repair=repair)
    conflict = [r['id'] for r in requirements]
    for identifier in conflict.copy():
        trial = [x for x in conflict if x != identifier]
        if not any(all(x not in row['failed'] for x in trial) for row in rows):
            conflict = trial
    return dict(base, **binding, status='infeasible', failed=failed, evaluatedAssignments=len(rows), conflict=dict(requirements=conflict, domains=domains, locked=[n for n in names if problem['variables'][n]['locked']], minimality='inclusion-minimal-relative-to-domains-and-locks'))
