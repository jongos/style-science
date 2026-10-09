# Release Roadmap

This is the disposition of the October 8 backlog, not a claim that all research
questions have been answered. Source publication and supported runtime packaging
are separate decisions. Existing evidence and backups remain intact.

## Phase 1: Release Foundation

Prepare the Unicode decision parity fix (#8), line-ending-aware provenance (#9),
honest validation documentation (#21), consumer contract (#14), retrospective
capture metadata (#11), and provider-qualified model policy (#22).
Public exports must match the explicit distribution manifest. Required core
tests and optional research tests are separate. Malformed consumer inspections
preserve native gates and the prior pin. Packaging tests use actual public exports.

## Phase 2: Bounded Instruments and Retrieval

Keep rendered instruments (#16) and constraint-aware retrieval (#15) experimental.
An optional workflow (#19) uses existing host Chrome, has a ten-minute timeout
and never installs a browser. Its initial remote run passed. It now triggers on
renderer/site changes as well as manual dispatch; branch protections are unchanged.
Experimental non-browser tests run in a distinct CI job, not the core suite.

The actual-host smoke comparison invokes Dazzler's existing recipe helper without
changing it. Ten original synthetic briefs compare its shortlist, a font-availability
filter, and the experimental retriever on the same 1,000-record index with a
three-candidate limit. Retain filtering only with zero violations; retain separate
retrieval research only if it finds feasible candidates that post-filtering misses.
The result is not a held-out agent evaluation or evidence of aesthetic quality.
The baseline does not accept structured font availability, so conflicts are not
presented as violations of its own API contract. See `downstream/compare-host.mjs`.

Observed smoke result: the baseline returned font-incompatible suggestions in
10/10 briefs, post-filtering in 0/10, and constrained retrieval in 0/10.
Post-filtering left nine empty shortlists versus five for constrained retrieval.
Retain filtering and targeted retrieval research; do not replace the host's
production defaults. The two methods retained one and fifteen candidates,
respectively, under the same maximum of three per brief. See the complete
[case record](host-smoke-20261008/report.json), including failures and limitations.

## Phase 3: Explicit Deferrals

- #18: full agent ablations, generation costs and human task/preference outcomes
  remain unmeasured. The host-helper comparison is a narrower completed step.
- #17: keep native DOCX package facts; defer rendered pagination and slides.
- Tokens: retain the small tested interchange subset, not full DTCG compatibility.
- Language/relations: retain tested primitives without stable package exports.
- Reject universal beauty scoring, automatic overall aesthetic ranking, another
  recipe-voting campaign without a decision, and redundant verifier abstractions.
- Do not publish debug logs, install downstream copies or delete original evidence.

## Already Implemented Issues

#10 (Python floor CI), #12 (immutable manifest packaging), #13 (alias gate), and
#20 (published retained recipe source) have committed implementations. They need
acceptance/status reconciliation, not duplicate development. No issue is closed
merely because a local test passes.

## Release Gate

Review explicit source membership, run the core, packaging, research and relevant
host-rendered suites separately, build an isolated committed fixture, inspect the
diff, then publish only the reviewed set. Record remote CI separately from local
results. A source checkout may retain research that the runtime ZIP excludes.

The reviewed staged source passed 47 core tests, 26 research tests, three
host-rendered suites, two static-site tests and four site viewport checks.
Packaging coverage includes imports from extracted archives and independent
archive/hash equality. No new browser or provider was installed or called.
