"""Original partial DTCG 2025.10 adapter; no interpretation of metadata."""
import copy
import json
import math
import re

SUPPORTED = {'number', 'dimension', 'fontFamily'}
KNOWN = SUPPORTED | {'color', 'fontWeight', 'duration', 'cubicBezier', 'strokeStyle', 'border', 'transition', 'shadow', 'gradient', 'typography'}


def scalar(value):
    return isinstance(value, str) and not any(0xD800 <= ord(c) <= 0xDFFF for c in value)


def numeric(value):
    return type(value) in (int, float) and abs(value) <= 9007199254740991 and math.isfinite(value)


def import_tokens(document):
    diagnostics, records, resolved = [], {}, {}
    def add(path, code, status='invalid'):
        diagnostics.append(dict(path='/' + '/'.join(x.replace('~', '~0').replace('/', '~1') for x in path), code=code, status=status))
    count = 0
    def validate_json(value, depth=0):
        nonlocal count
        count += 1
        if count > 4096 or depth > 32:
            raise ValueError('input-limit')
        if value is None or type(value) is bool or scalar(value) or numeric(value):
            return
        if isinstance(value, list):
            for item in value:
                validate_json(item, depth + 1)
            return
        if isinstance(value, dict):
            for key, item in value.items():
                if not scalar(key):
                    raise ValueError('invalid-json')
                validate_json(item, depth + 1)
            return
        raise ValueError('invalid-json')
    def result():
        return dict(adapterVersion='0.1.0', specification='DTCG-2025.10-partial',
                    status='invalid' if any(x['status'] == 'invalid' for x in diagnostics) else 'unsupported' if diagnostics else 'supported',
                    diagnostics=diagnostics, tokens=[] if diagnostics else sorted(resolved.values(), key=lambda x: '.'.join(x['path'])),
                    sourceDocument=None if diagnostics else copy.deepcopy(document), evidenceClass='declared-tokens', qualityClaim=False)
    try:
        validate_json(document)
    except ValueError as error:
        add([], str(error))
        return result()
    if not isinstance(document, dict) or '$value' in document:
        add([], 'invalid-document')
        return result()
    def visit(node, path, inherited=None):
        if not isinstance(node, dict):
            add(path, 'invalid-node')
            return
        token = '$value' in node
        for key in sorted(node):
            if key.startswith('$') and key not in ('$value', '$type', '$description', '$deprecated', '$extensions'):
                add(path + [key], 'unsupported-property', 'unsupported')
            elif token and not key.startswith('$'):
                add(path + [key], 'mixed-token-group')
        if '$description' in node and not scalar(node['$description']):
            add(path, 'invalid-description')
        if '$deprecated' in node and type(node['$deprecated']) is not bool and not scalar(node['$deprecated']):
            add(path, 'invalid-deprecated')
        if '$extensions' in node and not isinstance(node['$extensions'], dict):
            add(path, 'invalid-extensions')
        if '$type' in node and (not scalar(node['$type']) or node['$type'] not in KNOWN):
            add(path, 'invalid-type')
        if token:
            records['.'.join(path)] = dict(node=node, path=path, inherited=inherited)
            return
        for name in sorted(k for k in node if not k.startswith('$')):
            if not name or re.search(r'[{}.]', name):
                add(path + [name], 'invalid-name')
                continue
            visit(node[name], path + [name], node.get('$type', inherited))
    visit(document, [])
    if not records and not diagnostics:
        add([], 'empty-document')
    def resolve(name, chain=()):
        if name in resolved:
            return resolved[name]
        r = records.get(name)
        if r is None:
            return None
        if name in chain:
            add(r['path'], 'alias-cycle')
            return None
        if len(chain) > 128:
            add(r['path'], 'alias-limit')
            return None
        value = r['node']['$value']
        match = re.fullmatch(r'\{([^{}]+)\}', value) if isinstance(value, str) else None
        token_type, actual = r['node'].get('$type', r['inherited']), value
        dependencies, origin = [], 'literal'
        if match:
            origin = 'alias'
            if match[1] not in records:
                add(r['path'], 'missing-reference')
                return None
            diagnostic_start = len(diagnostics)
            target = resolve(match[1], (*chain, name))
            if target is None:
                add(r['path'], 'unresolved-reference', 'invalid' if any(x['status'] == 'invalid' for x in diagnostics[diagnostic_start:]) else 'unsupported')
                return None
            token_type = r['node'].get('$type', target['type'])
            if token_type != target['type']:
                add(r['path'], 'alias-type-mismatch')
                return None
            actual, dependencies = target['value'], [target['path'], *target['dependencies']]
            if len(dependencies) > 128:
                add(r['path'], 'alias-limit')
                return None
        if token_type not in KNOWN:
            add(r['path'], 'missing-or-invalid-type')
            return None
        if token_type not in SUPPORTED:
            add(r['path'], 'unsupported-type', 'unsupported')
            return None
        valid = False
        if token_type == 'number':
            valid = numeric(actual)
        if token_type == 'dimension':
            valid = isinstance(actual, dict) and set(actual) == {'value', 'unit'} and numeric(actual['value']) and actual['unit'] in ('px', 'rem')
        if token_type == 'fontFamily':
            valid = (scalar(actual) and bool(actual)) or (isinstance(actual, list) and bool(actual) and all(scalar(x) and bool(x) for x in actual))
        if not valid:
            add(r['path'], 'invalid-value')
            return None
        entry = dict(path=r['path'], type=token_type, value=copy.deepcopy(actual), origin=origin, dependencies=dependencies)
        resolved[name] = entry
        return entry
    if not diagnostics:
        for name in sorted(records):
            resolve(name)
    return result()


def export_tokens(document):
    report = import_tokens(document)
    if report['status'] != 'supported':
        raise ValueError('Token export blocked: ' + report['status'])
    return json.dumps(report['sourceDocument'], ensure_ascii=False, indent=2, allow_nan=False) + '\n'
