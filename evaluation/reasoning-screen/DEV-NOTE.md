# Dependency evidence must travel with its revision

## What we tested

On October 8, 2026, ten synthetic records were presented to Jev twice: once as
structured JSON and once as flat dot-path/value text. Both formats contained the
same facts and used the same rubric. See [PROTOCOL.md](PROTOCOL.md),
[prepare.mjs](prepare.mjs), and [summary.json](summary.json) for the fixed
instrument, request hashes, model identity and timing. These were serialization
comparisons, not a comparison against a deliberately weaker rule set.

The requested alias was `jev-latest`; both calls resolved to `jev-1.13.0`.
Structured scored 9/10 and flat 8/10. Only case 10 was a comparative winner.
Eight ties were correct in both formats; they were not failed ideas.

## Pair outcomes

These outcome summaries are developer notes from the observed run, not retained
raw non-winning responses. Explanations describe rubric violations, not inferred
model thought processes.

| Case | Condition | Expected | Structured | Flat | Interpretation |
| --- | --- | --- | --- | --- | --- |
| 01 | Artifact changed a1 to a2 | unknown | unknown | unknown | Both correctly rejected stale artifact evidence. |
| 02 | Desktop evidence for mobile context | unknown | unknown | unknown | Both recognized the context mismatch. |
| 03 | Required contrast observation failed | fail | fail | fail | Both respected measured noncompliance. |
| 04 | Rule changed r1 to r2 | unknown | unknown | unknown | Both rejected evidence against an old rule. |
| 05 | No observations | unknown | unknown | unknown | Neither invented compliance. |
| 06 | All required evidence current and passing | pass | pass | pass | Both accepted adequate evidence. |
| 07 | Unrelated footer-copy change | pass | pass | pass | Neither invalidated unrelated evidence. |
| 08 | Hard failure with preference score 0.99 | fail | fail | fail | Both kept preference from overriding a requirement. |
| 09 | Matching observations include pass and unknown | unknown | pass | pass | Both incorrectly promoted incomplete evidence to pass. |
| 10 | Dependency changed d1 to d2 | unknown | unknown | fail | Only structured distinguished stale evidence from measured failure. |

Case 10 won because its answer matched the predefined oracle while the flat
answer did not. The flat answer was conservative but semantically wrong: an old
passing observation does not prove the current artifact fails. It proves neither
pass nor fail. The structured response had modest confidence (0.51); confidence
was not the selection criterion. Its retained payload is in [winners.json](winners.json).

Case 09 is sometimes described as conflicting evidence in the protocol. More
precisely, its observations are pass plus unknown, not pass plus fail. Neither
format won this case. No new feature is promoted from that result. The other
eight cases offered no comparative advantage and likewise did not justify new
features. Existing safeguards remain useful and are not removed because of ties.

## Code change

The retained insight is explicit dependency-revision binding, not a general
preference for JSON. `reasoning.mjs` and `reasoning.py` compare required current
dependency revisions with the revisions captured when evidence was collected.
Missing, malformed or mismatched bindings remain unknown.

The optional `reviewWithDependencies` / `review_with_dependencies` wrapper calls
the existing candidate reviewer and attaches the dependency report. Unknown
dependency evidence blocks advice and clears its choice. A matching dependency
set cannot override failed or missing measurements, context requirements, stale
decision fingerprints, missing observations or disagreement across model variants.
The wrapper remains experimental and never grants release eligibility, even when
all checks pass. Stable entry points and the distribution manifest are unchanged.

Callers must capture bindings alongside evidence and supply the complete dependency
set. These functions neither authenticate revision labels nor discover dependencies;
copying current labels onto stale evidence would defeat the check. They do not
implement a dependency graph, automatic invalidation or revision storage.

## Limits and verification

There were two calls, 20 judgments, no retries, and fixed structured-first order.
Provider evaluation totaled approximately 131 ms; submission-to-observed completion
was 8.746 seconds and 5.186 seconds, including UI overhead. One small synthetic
screen cannot establish general superiority, causality, human usefulness or beauty.
No sensitivity replication was conducted. Aggregate accuracy cannot be independently
recomputed from retained raw responses because non-winning payloads were not archived.

Focused regressions cover current, stale, missing and malformed dependency bindings;
candidate feasibility; missing and unstable model observations; moving aliases;
experimental release exclusion; and complete JavaScript/Python output parity.
All tests use local synthetic fixtures. No further provider calls are needed.

Verified locally for this change: 66 tests passed in the full working-tree
non-browser suite, including packaging; two static-site checks passed. An isolated
checkout of only the staged commit passed 18 focused core, decision and reasoning
tests, confirming it does not depend on unrelated uncommitted research. The working
tree's focused run passed 19 tests because it includes one additional unrelated
decision regression. Diff whitespace checks passed. No browser-only behavior was
tested, no Chromium was installed, and these results do not assert a remote CI pass.
