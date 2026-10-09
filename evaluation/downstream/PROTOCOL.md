# Offline downstream comparison v1

This is an implementation benchmark under `evaluation/protocol.json`, not its
unrun human study. Freeze this file and the fixture manifest before comparison.
No human participants, provider calls, private briefs or design-quality labels.

## Conditions and controls

- Baseline: a documented lexical-overlap retrieval proxy, not a reproduction of
  the entire Dazzler agent. One shared ten-entry index (two per context); no generation.
- Retrieval: the optional constrained shortlist, with the same index and briefs.
  Both retrieval conditions return at most three entries. Constraint violations
  are counted per brief (any violating selection), not as independent samples.
- Verification: inspect the same injected HTML/native facts in every condition.
- Comparison: the existing bounded-effect canvas on identical measurement pairs.
- Five development briefs and ten differently worded held-out briefs, spanning
  editorial, commerce, culture, information and software. No tuning from held-out
  results during this run. Shared contexts are intentional; brief IDs/texts differ.
- Host is `synthetic-offline-v1`; model and prompt-driven generation are absent.
  Inference tokens and provider cost are zero, not estimates of production cost.
  Record runtime, code/fixture/rubric hashes and actual instrument observations.

## Decisions set before execution

Retain the optional retrieval implementation only if it selects no hard-conflict
candidate on the authored held-out cases and strictly improves constraint failures
over the lexical proxy. Otherwise change/remove its ranking policy; do not change
the host's production default. Missing font capabilities must produce unknown.

Retain an instrument if its named positive, negative and unsupported cases agree
with the prespecified predicate and JS/Python reports match. Change the instrument
if there is any false pass. Never promote an unsupported paint/semantic claim to
pass. A removal decision concerns that instrument's eligibility, not deleting data.

Retain bounded candidate comparison if beneficial, harmful and inconclusive
interval fixtures remain distinct. Reject automatic overall candidate ranking.

## Outcomes and limits

Report every case, constraint failures, injected defects detected/missed, false
alarms, unknown/no-fit rates, distinct arrangement/type/color-category proxies,
wall-clock latency and provider cost. Preserve desktop/mobile screenshots and
original editable DOCX fixture bytes. Native pagination and visual review stay
unknown without a declared native renderer and qualified review.

The complete Dazzler/host-agent baseline, blinded human visual/task assessments,
real generation latency/cost and native rendered pages are NOT measured. Those
parts of issue #18 remain open. No amount of fixture agreement proves beauty or
demonstrates added value to real users.
