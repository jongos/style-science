"""Advisory model observations, separate from measured feasibility."""
import hashlib
import json
import math
import re
from gdc import verify

DECISION_VERSION = '0.2.0'
VARIANTS = {'baseline', 'reordered', 'relabeled'}
PINNED_MODEL = re.compile(r'(?:jev-(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)|sha256:[a-f0-9]{64})', re.ASCII)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def validate_contract(c):
    if not isinstance(c, dict) or set(c) != {'id', 'context', 'requiredContext', 'options', 'abstainOptions'} or not nonempty(c['id']):
        raise ValueError('Invalid decision contract')
    if not isinstance(c['context'], dict) or any(v is not None and not isinstance(v, str) for v in c['context'].values()):
        raise ValueError('Context values must be text or null')
    required = c['requiredContext']
    if not isinstance(required, list) or not required or not all(nonempty(v) for v in required) or len(set(required)) != len(required):
        raise ValueError('Declare unique required context fields')
    opts = c['options']
    if not isinstance(opts, dict) or len(opts) < 2 or not all(nonempty(v) for v in opts) or not all(nonempty(v) for v in opts.values()):
        raise ValueError('Declare at least two described options')
    abstain = c['abstainOptions']
    if not isinstance(abstain, list) or not abstain or not all(isinstance(v, str) for v in abstain) or len(set(abstain)) != len(abstain) or not set(abstain) <= set(opts) or len(abstain) == len(opts):
        raise ValueError('Declare abstention and substantive options')


def decision_fingerprint(contract):
    validate_contract(contract)
    encoded = json.dumps(contract, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
    return hashlib.sha256(encoded.encode('utf-8')).hexdigest()


def assess_choice(contract, observations):
    stamp = decision_fingerprint(contract)
    base = dict(decisionVersion=DECISION_VERSION, contractHash=stamp, evidenceClass='model-prediction', automaticAction=False, releaseEligible=False, evidenceScope='exploratory')
    missing = [k for k in contract['requiredContext'] if not nonempty(contract['context'].get(k))]
    if missing:
        return dict(base, status='needs-context', missing=missing)
    if not isinstance(observations, list):
        raise ValueError('Observations must be an array')
    if len(observations) != 3 or any(not isinstance(o, dict) or not isinstance(o.get('variant'), str) for o in observations) or {o.get('variant') for o in observations} != VARIANTS:
        return dict(base, status='needs-observations')
    if any(o.get('contractHash') != stamp for o in observations):
        return dict(base, status='stale')
    model_identities = []
    for o in observations:
        for key in ('model', 'resolvedModel', 'requestedModel'):
            if o.get(key) is not None and not isinstance(o[key], str):
                raise ValueError('Model identities must be text or null')
        resolved = o.get('resolvedModel') if 'resolvedModel' in o else o.get('model')
        identity_status = 'missing' if not nonempty(resolved) else 'pinned' if PINNED_MODEL.fullmatch(resolved) else 'unpinned'
        model_identities.append(dict(variant=o['variant'], requestedModel=o.get('requestedModel'), resolvedModel=resolved, identityStatus=identity_status))
    base['modelIdentities'] = model_identities
    if any(o['identityStatus'] == 'missing' for o in model_identities):
        return dict(base, status='needs-model', modelIdentityStatus='missing')
    if len({o['resolvedModel'] for o in model_identities}) != 1:
        return dict(base, status='model-mismatch', modelIdentityStatus='mixed')
    model_identity_status = model_identities[0]['identityStatus']
    ids = set(contract['options'])
    normalized = []
    for o in observations:
        a, mapping = o.get('answer'), o.get('optionMap')
        if not isinstance(mapping, dict) or not all(isinstance(v, str) for v in mapping.values()) or len(mapping) != len(ids) or set(mapping.values()) != ids or not isinstance(a, dict) or not isinstance(a.get('choice'), str) or a['choice'] not in mapping or not isinstance(a.get('probabilities'), dict) or set(a['probabilities']) != set(mapping):
            raise ValueError('Invalid option mapping or answer')
        values = list(a['probabilities'].values())
        confidence = a.get('confidence')
        if any(type(p) not in (int, float) or not math.isfinite(p) or p < 0 or p > 1 for p in values) or abs(sum(values) - 1) > 0.025 or type(confidence) not in (int, float) or not math.isfinite(confidence) or not 0 <= confidence <= 1:
            raise ValueError('Invalid probability or confidence')
        if a['probabilities'][a['choice']] < max(values):
            raise ValueError('Choice must maximize reported probability')
        normalized.append(dict(variant=o['variant'], choice=mapping[a['choice']], confidence=confidence, probabilities={mapping[k]: p for k, p in a['probabilities'].items()}))
    distance = 0
    for i, left in enumerate(normalized):
        for right in normalized[i + 1:]:
            a, b = left['probabilities'], right['probabilities']
            sa, sb = sum(a.values()), sum(b.values())
            distance = max(distance, sum(abs(a[k] / sa - b[k] / sb) for k in ids) / 2)
    choice = normalized[0]['choice']
    tied = any(sum(p == o['probabilities'][o['choice']] for p in o['probabilities'].values()) > 1 for o in normalized)
    status = 'unstable' if any(o['choice'] != choice for o in normalized) else 'ambiguous' if tied else 'abstain' if choice in contract['abstainOptions'] else 'advisory'
    base.update(releaseEligible=model_identity_status == 'pinned' and status == 'advisory', evidenceScope='version-pinned-model-observation' if model_identity_status == 'pinned' else 'exploratory')
    return dict(base, status=status, choice=None if status in ('unstable', 'ambiguous') else choice, model=model_identities[0]['resolvedModel'], resolvedModel=model_identities[0]['resolvedModel'], modelIdentityStatus=model_identity_status, maxTotalVariation=distance, observations=normalized)


def review_candidate(plan, snapshots, contract, observations):
    feasibility = verify(plan, snapshots)
    if feasibility['status'] != 'pass':
        return dict(status='blocked', automaticAction=False, releaseEligible=False, feasibility=feasibility)
    return dict(feasibility=feasibility, **assess_choice(contract, observations))
