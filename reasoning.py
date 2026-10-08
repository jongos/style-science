"""Experimental dependency revision checks, not overall design eligibility."""
from decision import review_candidate


def verify_dependency_bindings(current, observed):
    def text(value):
        return isinstance(value, str) and bool(value) and not any(0xD800 <= ord(c) <= 0xDFFF for c in value)
    def revisions(value):
        return isinstance(value, dict) and all(text(k) and text(v) for k, v in value.items())
    base = dict(scope='dependency-revisions-only', qualityClaim=False)
    if not revisions(current) or not current or not revisions(observed):
        return dict(base, status='unknown', reason='missing-or-invalid-dependency-bindings', checks=[])
    checks = [dict(id=key, currentRevision=value, observedRevision=observed.get(key),
                   status='pass' if observed.get(key) == value else 'unknown') for key, value in current.items()]
    return dict(base, status='pass' if all(x['status'] == 'pass' for x in checks) else 'unknown', checks=checks)


def review_with_dependencies(plan, snapshots, contract, observations, current, observed):
    dependencies = verify_dependency_bindings(current, observed)
    review = review_candidate(plan, snapshots, contract, observations)
    result = dict(review, dependencies=dependencies, releaseEligible=False,
                  evidenceScope='exploratory', experimental=True)
    if dependencies['status'] != 'pass':
        return dict(result, status='blocked', choice=None, reason='dependency-evidence-unknown')
    return result
