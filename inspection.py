"""Portable verification of bounded rendered and native-package facts."""
import hashlib
import json

KINDS = ['font-face-loaded', 'scroll-containment', 'focus-target', 'focus-outline', 'center-hit-target', 'native-title', 'native-headings', 'native-fonts', 'native-page-geometry', 'native-table-bounds', 'native-pagination']


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False)


def inspection_fingerprint(plan):
    import re
    def fields(value, required, optional=()):
        return isinstance(value, dict) and set(required) <= set(value) <= set(required) | set(optional)
    def scalar(value):
        return isinstance(value, str) and not any(0xD800 <= ord(c) <= 0xDFFF for c in value)
    if not fields(plan, ['schemaVersion', 'artifactSha256', 'environment', 'renderer', 'checks']) or not fields(plan['environment'], ['medium', 'width', 'height', 'theme', 'state']) or not fields(plan['renderer'], ['name', 'version']):
        raise ValueError('Invalid inspection plan')
    e, r = plan.get('environment', {}), plan.get('renderer', {})
    if type(plan.get('schemaVersion')) is not int or plan['schemaVersion'] != 1 or not scalar(plan.get('artifactSha256')) or not re.fullmatch(r'[a-f0-9]{64}', plan['artifactSha256']) or e.get('medium') not in ('html', 'docx') or not all(type(e.get(k)) is int and 0 < e[k] <= 9007199254740991 for k in ('width', 'height')) or e.get('theme') not in ('light', 'dark') or not scalar(e.get('state')) or not e['state'] or not all(scalar(r.get(k)) and r[k] for k in ('name', 'version')) or not isinstance(plan.get('checks'), list) or not plan['checks'] or any(not fields(c, ['id','kind'], ['selector','expected']) or not scalar(c.get('id')) or not c['id'] or c.get('kind') not in KINDS or ('selector' in c and not scalar(c['selector'])) or ('expected' in c and not scalar(c['expected'])) for c in plan['checks']) or len({c['id'] for c in plan['checks']}) != len(plan['checks']):
        raise ValueError('Invalid inspection plan')
    return hashlib.sha256(canonical(plan).encode()).hexdigest()


def inspect_value(kind, facts):
    if not isinstance(facts, dict) or facts.get('unknown'):
        return 'unknown'
    def binary(*keys):
        return ('pass' if all(facts[k] for k in keys) else 'fail') if all(type(facts.get(k)) is bool for k in keys) else 'unknown'
    if kind == 'font-face-loaded':
        return binary('declared', 'loaded')
    if kind == 'focus-target':
        return binary('focused', 'enabled')
    if kind == 'focus-outline':
        return binary('focused', 'outlinePresent')
    if kind == 'center-hit-target':
        return binary('centerHitsTarget')
    if kind == 'scroll-containment':
        if not all(type(facts.get(k)) is int and 0 <= facts[k] <= 9007199254740991 for k in ('scrollWidth', 'clientWidth', 'scrollHeight', 'clientHeight')) or not facts['clientWidth'] or not facts['clientHeight']:
            return 'unknown'
        return 'pass' if facts['scrollWidth'] <= facts['clientWidth'] and facts['scrollHeight'] <= facts['clientHeight'] else 'fail'
    if kind == 'native-pagination':
        return 'unknown'
    if kind.startswith('native-'):
        return binary('valid')
    return 'unknown'


def verify_inspection(plan, snapshot):
    stamp = inspection_fingerprint(plan)
    bound = isinstance(snapshot, dict) and snapshot.get('planHash') == stamp and snapshot.get('artifactSha256') == plan['artifactSha256'] and canonical(snapshot.get('environment')) == canonical(plan['environment']) and canonical(snapshot.get('renderer')) == canonical(plan['renderer']) and snapshot.get('settled') is True
    results = []
    for c in plan['checks']:
        source = 'package' if c['kind'].startswith('native-') else 'rendered'
        observation = (snapshot or {}).get('observations', {}).get(c['id'], {})
        results.append(dict(id=c['id'], kind=c['kind'], status=inspect_value(c['kind'], observation.get('facts')) if bound and observation.get('source') == source else 'unknown', source=source))
    return dict(schemaVersion=1, planHash=stamp, status='fail' if any(r['status'] == 'fail' for r in results) else 'pass' if all(r['status'] == 'pass' for r in results) else 'unknown', results=results, qualityClaim=False, coverage='Declared facts only; not complete accessibility, aesthetic quality or native pagination certification')
