# Initial reasoning screen

Ten paired tests, twenty Jev judgments, two requests. The requested alias was
`jev-latest`; both responses resolved to `jev-1.13.0`. Structured records scored
9/10 and flat leaf documents 8/10. There was one structured-only winner, eight
both-correct pairs and one both-incorrect pair. No extra runs were made to obtain
more winners. This does not establish that structured records are generally better.

Provider evaluation time was 67.995 ms for the structured batch and 63.334 ms for
the flat batch, 131.329 ms combined. Submission-to-observed-completion bounds were
8.746 s and 5.186 s, including UI/tool overhead. Local request preparation took
8.625 ms. The first submission to the final observed response spanned 25.037 s,
including copying results and preparing the second UI submission. Total task
time was longer because of setup, browser recovery, protocol writing and analysis.
Reported usage totals 3,810 input tokens and 746 output tokens. Monetary cost was
not returned and is unknown; the rounded balance is not a cost measurement.

## Incorporated winner

The retained case concerns a derived observation whose dependency changed from
`d1` to `d2`. The observation cannot establish current compliance. Its correct
status is unknown, not pass or a new measured failure. This narrow behavior is
available experimentally as `verifyDependencyBindings(current, observed)` in
`reasoning.mjs` and `verify_dependency_bindings` in `reasoning.py`.

Both arguments map dependency IDs to revision strings. Missing, empty, malformed
or mismatched bindings return unknown. Matching bindings pass only this instrument;
all artifact, context, rule, measurement and feasibility gates still apply.
The helper does not authenticate host revision labels. The optional
`reviewWithDependencies(plan, snapshots, contract, observations, current, observed)`
wrapper (Python: `review_with_dependencies`) now connects this check to candidate
review. Use dependency maps captured with the evidence, not regenerated from current
state. Missing or stale bindings block advice with dependency status unknown and
clear the selected choice. Matching bindings still require the existing feasibility,
context, fingerprint, model and sensitivity checks. This experimental path always
returns `releaseEligible: false`, even when advisory. Neither helper nor wrapper is
in stable package exports or the release manifest; existing core calls are unchanged.

See [the developer note](DEV-NOTE.md) for every pair's outcome, the narrow reason
for retaining the winner and the implementation boundaries.

Only `winners.json` retains case-level model output. `summary.json` preserves
aggregate accounting, IDs, timing and hashes. Non-winning raw responses were not
archived. This retention policy means future readers cannot independently
recompute aggregate accuracy without provider-side original responses. Prepared
test definitions are retained as the fixed instrument, not as promoted designs.

The calls were deliberately exploratory: fixed block order, small synthetic
sample, no sensitivity replication and no human outcomes. Model agreement and
confidence are not evidence of aesthetic quality. The winning response itself
had modest confidence (0.51); this is a candidate worth testing, not settled science.
