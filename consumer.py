"""Offline artifact integrity and capability negotiation. No automatic upgrade."""
import hashlib
import json
import re
from pathlib import Path


def inspect_distribution(directory, expected):
    fallback = dict(status='unknown', fallback='retain-previous-pin-and-native-gates', contract=None)
    if not isinstance(expected, dict) or not isinstance(expected.get('sourceRevision'), str) or not re.fullmatch(r'(?:[a-f0-9]{40}|[a-f0-9]{64})', expected['sourceRevision']) or not isinstance(expected.get('files'), dict) or not expected['files'].get('consumer-contract.json'):
        return dict(fallback, reason='missing-trusted-manifest')
    try:
        root = Path(directory).resolve(strict=True)
        source = json.loads((root / 'SOURCE.json').read_text(encoding='utf-8'))
        if source['sourceRevision'] != expected['sourceRevision']:
            return dict(fallback, status='invalid', reason='source-mismatch')
        if set(source['files']) != set(expected['files']):
            return dict(fallback, status='invalid', reason='manifest-mismatch')
        for name, stamp in sorted(expected['files'].items()):
            if not re.fullmatch(r'[A-Za-z0-9_./-]+', name) or any(p in ('', '.', '..') for p in name.split('/')):
                raise ValueError('Invalid path')
            target = (root / name).resolve(strict=True)
            target.relative_to(root)
            digest = hashlib.sha256(target.read_bytes()).hexdigest()
            if digest != stamp or source['files'][name] != digest:
                return dict(fallback, status='invalid', reason='hash-mismatch', file=name)
        contract = json.loads((root / 'consumer-contract.json').read_text(encoding='utf-8'))
        if contract['contractVersion'] != '1.0.0':
            return dict(fallback, status='unsupported', reason='contract-version')
        if not isinstance(contract.get('modules'), dict) or not isinstance(contract.get('schemas'), dict) or not isinstance(contract.get('unsupported'), list):
            raise ValueError('Invalid contract')
        for module in contract['modules'].values():
            if not isinstance(module, dict) or not isinstance(module.get('checks'), list) or not all(isinstance(x, str) for x in module['checks']) or not isinstance(module.get('files'), list) or any(p not in expected['files'] for p in module['files']):
                raise ValueError('Missing module')
        return dict(status='verified', fallback=None, sourceRevision=source['sourceRevision'], contract=contract)
    except (OSError, ValueError, KeyError, TypeError, AttributeError):
        return dict(fallback, status='invalid', reason='missing-or-malformed-artifact')


def negotiate(inspection, request):
    if not isinstance(inspection, dict) or inspection.get('status') not in ('verified', 'unknown', 'invalid', 'unsupported'):
        return dict(status='unknown', fallback='retain-previous-pin-and-native-gates', checks=[])
    if inspection['status'] != 'verified':
        return dict(status=inspection['status'], fallback='retain-previous-pin-and-native-gates', checks=[])
    c = inspection.get('contract')
    if not isinstance(c, dict) or not isinstance(c.get('schemas'), dict) or not isinstance(c.get('modules'), dict) or not isinstance(c.get('unsupported'), list) or any(not isinstance(m, dict) or not isinstance(m.get('checks'), list) for m in c['modules'].values()):
        return dict(status='unknown', fallback='retain-previous-pin-and-native-gates', checks=[])
    if not isinstance(request, dict) or request.get('contractVersion') != '1.0.0' or type(request.get('planSchema')) is not int or request['planSchema'] != c['schemas']['plan'] or any(k in request and (not isinstance(request[k], list) or not all(isinstance(x, str) for x in request[k])) for k in ('checks', 'modules')):
        return dict(status='unsupported', fallback='retain-previous-pin-and-native-gates', checks=[])
    checks = [dict(check=x, status='supported' if any(x in m['checks'] for m in c['modules'].values()) else 'unsupported' if x in c['unsupported'] else 'unknown') for x in request.get('checks', [])]
    modules = [dict(module=x, status='supported' if x in c['modules'] else 'unsupported') for x in request.get('modules', [])]
    return dict(status='supported' if all(x['status'] == 'supported' for x in checks + modules) else 'partial', checks=checks, modules=modules, fallback='native-gates-remain-required')
