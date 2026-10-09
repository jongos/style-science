"""Optional heuristic retrieval, separate from measured design quality."""
import hashlib
import math
import re
from gdc import contrast


def words(value):
    return set(re.findall(r'[a-z0-9]+', value.lower()))


def shortlist(index, brief, limit=3):
    if index.get('schemaVersion') != 1 or not isinstance(index.get('entries'), list) or brief.get('schemaVersion') != 1 or not isinstance(brief.get('contexts'), list) or not brief['contexts'] or not all(isinstance(x, str) for x in brief['contexts']) or not all(isinstance(brief.get(k), str) and brief[k].strip() for k in ('task', 'audience', 'content', 'medium', 'intent')) or not isinstance(brief.get('interactions'), list) or type(limit) is not int or not 1 <= limit <= 5:
        raise ValueError('Invalid retrieval contract')
    constraints = brief.get('constraints') or {}
    query = words(' '.join(brief[k] for k in ('task', 'audience', 'content')))
    candidates, excluded, ids = [], [], set()
    for r in index['entries']:
        if not isinstance(r.get('id'), str) or r['id'] in ids or not isinstance(r.get('contexts'), list) or (r.get('interactions') is not None and not isinstance(r['interactions'], list)) or not r.get('fonts') or not r.get('palette') or not all(isinstance(r.get(k), str) for k in ('arrangement', 'typography', 'colorRelationship', 'intent', 'medium', 'text')):
            raise ValueError('Invalid recipe index')
        ids.add(r['id'])
        conflicts, unknown = [], []
        if r['medium'] != brief['medium']:
            conflicts.append('medium')
        if r.get('interactions') is None and brief['interactions']:
            unknown.append('interaction-capabilities')
        elif any(x not in (r['interactions'] or []) for x in brief['interactions']):
            conflicts.append('interaction')
        for key, value in (constraints.get('palette') or {}).items():
            if r['palette'].get(key) != value:
                conflicts.append('palette:' + key)
        for key, value in (constraints.get('fonts') or {}).items():
            if r['fonts'].get(key) != value:
                conflicts.append('font-lock:' + key)
        if not isinstance(constraints.get('availableFonts'), list):
            unknown.append('font-availability')
        elif any(f not in constraints['availableFonts'] for f in r['fonts'].values()):
            conflicts.append('font-unavailable')
        if 'minimumContrast' in constraints:
            minimum = constraints['minimumContrast']
            if type(minimum) not in (int, float) or not math.isfinite(minimum) or not 1 <= minimum <= 21:
                raise ValueError('Invalid contrast threshold')
            if not all(isinstance(r['palette'].get(k), str) and re.fullmatch(r'#[a-fA-F0-9]{6}', r['palette'][k]) for k in ('text', 'background')):
                unknown.append('token-contrast')
            elif contrast(r['palette']['text'], r['palette']['background']) < minimum:
                conflicts.append('token-contrast')
        if conflicts or unknown:
            excluded.append(dict(id=r['id'], status='incompatible' if conflicts else 'unknown', conflicts=conflicts, unknown=unknown))
            continue
        matched = [x for x in brief['contexts'] if x in r['contexts']]
        overlap = len(query & words(r['text'])) / max(1, len(query))
        score = 4 * len(matched) / len(brief['contexts']) + 2 * int(r['intent'] == brief['intent']) + overlap
        agreement = r.get('agreement', 0)
        candidates.append(dict(id=r['id'], score=score, agreement=agreement if type(agreement) in (int, float) and math.isfinite(agreement) else 0,
            reasons=[f"contexts:{len(matched)}/{len(brief['contexts'])}", 'intent-match' if r['intent'] == brief['intent'] else 'intent-differs'],
            arrangement=r['arrangement'], typography=r['typography'], colorRelationship=r['colorRelationship'],
            tie=hashlib.sha256('\n'.join([brief['task'], brief['audience'], brief['content'], r['id']]).encode()).hexdigest(), detail=r.get('detail')))
    chosen = []
    while candidates and len(chosen) < limit:
        for c in candidates:
            c['diversity'] = min(sum(c[k] != s[k] for k in ('arrangement', 'typography', 'colorRelationship')) for s in chosen) if chosen else 0
        candidates.sort(key=lambda c: (-c['score'], -c['diversity'], -c['agreement'], c['tie']))
        item = candidates.pop(0)
        del item['tie']
        chosen.append(dict(item, renderedStatus='untested', adaptationsRequired=['Verify fonts, responsive layout, states and native delivery constraints'], conflicts=[]))
    return dict(schemaVersion=1, status='shortlist' if chosen else 'unknown' if any(x['status'] == 'unknown' for x in excluded) else 'no-fit', evidenceClass='heuristic-retrieval', qualityClaim=False, shortlist=chosen, excluded=excluded)
