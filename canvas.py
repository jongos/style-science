"""Conditional outcome arithmetic; no learned ranking or statistical inference."""
import math
from gdc import verify

CANVAS_VERSION = '0.1.0'


def text(value):
    return isinstance(value, str) and bool(value.strip())


def number(value):
    return type(value) in (int, float) and math.isfinite(value)


def bounded_effect(baseline, candidate, direction, minimum_effect):
    for interval in (baseline, candidate):
        if not isinstance(interval, dict) or not number(interval.get('lower')) or not number(interval.get('upper')) or interval['lower'] > interval['upper']:
            raise ValueError('Invalid measurement bounds')
    if direction not in ('minimize', 'maximize') or not number(minimum_effect) or minimum_effect < 0:
        raise ValueError('Invalid outcome direction or practical threshold')
    lower = baseline['lower'] - candidate['upper'] if direction == 'minimize' else candidate['lower'] - baseline['upper']
    upper = baseline['upper'] - candidate['lower'] if direction == 'minimize' else candidate['upper'] - baseline['lower']
    if not number(lower) or not number(upper):
        raise ValueError('Effect exceeds numeric range')
    status = 'improved' if lower > minimum_effect else 'worsened' if upper < -minimum_effect else 'negligible' if lower >= -minimum_effect and upper <= minimum_effect else 'inconclusive'
    return dict(lower=lower, upper=upper, status=status)


def validate_spec(spec):
    if not isinstance(spec, dict) or not text(spec.get('context')) or not isinstance(spec.get('metrics'), list) or not spec['metrics']:
        raise ValueError('Declare context and outcome metrics')
    ids = set()
    for m in spec['metrics']:
        if not isinstance(m, dict) or not all(text(m.get(k)) for k in ('id', 'unit', 'instrument')) or m['id'] in ids or m.get('direction') not in ('minimize', 'maximize') or not number(m.get('minimumEffect')) or m['minimumEffect'] < 0:
            raise ValueError('Invalid or duplicate outcome metric')
        ids.add(m['id'])


def index_outcomes(artifact, spec, environments):
    if not isinstance(artifact, dict) or not text(artifact.get('id')) or not text(artifact.get('revision')) or not isinstance(artifact.get('outcomes'), list):
        raise ValueError('Declare artifact identity, revision and outcomes')
    index = {}
    for record in artifact['outcomes']:
        if not isinstance(record, dict) or not isinstance(record.get('metric'), str) or record['metric'] not in [m['id'] for m in spec['metrics']] or record.get('environment') not in environments:
            raise ValueError('Undeclared metric or environment')
        key = (record['environment'], record['metric'])
        if key in index:
            raise ValueError('Duplicate outcome observation')
        index[key] = record
    return index


def compare_canvas(plan, baseline, candidate, spec):
    validate_spec(spec)
    feasibility = dict(baseline=verify(plan, baseline['snapshots']), candidate=verify(plan, candidate['snapshots']))
    environments = [e['id'] for e in plan['environments']]
    left, right = index_outcomes(baseline, spec, environments), index_outcomes(candidate, spec, environments)
    results = []
    for environment in environments:
        for metric in spec['metrics']:
            a, b = left.get((environment, metric['id'])), right.get((environment, metric['id']))
            item = dict(environment=environment, metric=metric['id'], unit=metric['unit'], minimumEffect=metric['minimumEffect'])
            reason = None
            if a is None or b is None:
                reason = 'missing-observation'
            elif a.get('context') != spec['context'] or b.get('context') != spec['context']:
                reason = 'context-mismatch'
            elif a.get('artifactRevision') != baseline['revision'] or b.get('artifactRevision') != candidate['revision']:
                reason = 'stale-observation'
            elif any(r.get('source') != 'measurement' for r in (a, b)):
                reason = 'not-measured'
            elif any(r.get('unit') != metric['unit'] or r.get('instrument') != metric['instrument'] for r in (a, b)):
                reason = 'instrument-or-unit-mismatch'
            results.append(dict(item, status='unknown', reason=reason) if reason else dict(item, **bounded_effect(a, b, metric['direction'], metric['minimumEffect'])))
    status = 'blocked' if feasibility['candidate']['status'] != 'pass' else 'incomplete' if any(r['status'] == 'unknown' for r in results) else 'comparison'
    return dict(canvasVersion=CANVAS_VERSION, status=status, context=spec['context'], baseline=baseline['id'], candidate=candidate['id'], feasibility=feasibility, results=results, automaticSelection=False, scope='Declared outcomes and supplied engineering bounds only; no causal, aesthetic or statistical-confidence claim.')


def assess_experiment(plan):
    required = ('feature', 'hypothesis', 'baseline', 'intervention', 'metric', 'budget')
    if not isinstance(plan, dict) or any(not text(plan.get(k)) for k in required):
        return dict(status='incomplete', collectionAuthorized=False)
    actions = [plan.get('ifSupported'), plan.get('ifRefuted')]
    if any(not isinstance(a, dict) or a.get('action') not in ('improve', 'remove', 'retain', 'reject') or not text(a.get('change')) for a in actions):
        return dict(status='incomplete', collectionAuthorized=False)
    if all(a['action'] == 'retain' for a in actions) or (actions[0]['action'] == actions[1]['action'] and actions[0]['change'].strip() == actions[1]['change'].strip()):
        return dict(status='no-feature-decision', collectionAuthorized=False)
    return dict(status='ready-for-review', collectionAuthorized=False)
