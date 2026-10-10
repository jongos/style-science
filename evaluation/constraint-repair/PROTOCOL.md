# Constraint Conflicts and Bounded Repairs

Protocol frozen before implementation/comparison, October 10, 2026.

## Hypothesis and Scope

An exhaustive bounded search will produce more valid repair proposals than a
single-variable local repair, without weakening requirements or changing locks.
An inclusion-minimal conflict explanation will be more specific than returning
every requirement when the declared domains contain no feasible assignment.

This is an original offline engineering experiment. We test integer CSS-pixel
relationships, not rendered layouts or perceived quality. No external solver,
browser, model, private artifact or participant is required. Finite enumeration
provides an exact small-domain reference; a future continuous solver would need
separate evidence. This is not an implementation of Cassowary or Draco.

## Contract and Limits

Version 1: named variables with explicit integer domain values, a current value,
unit px and an explicit Boolean lock; linear requirements with integer coefficients,
an id, relation le/ge/eq and integer right side. Require an artifact revision and
matching observedRevision. These are caller-declared bindings, not authenticated
observations. No vacuous requirements, duplicate ids, implicit domains or guessing.
ASCII identifiers, at most six variables, 32 values each, 12 requirements, 4096
assignments after locks, absolute numeric values <= 1000000. Unsupported, invalid,
stale or over-budget inputs produce unknown, no repair, and no conflict claim.

Repairs minimize the pair (number of changed variables, total absolute px change),
then the ASCII-name-ordered numeric tuple. These are explicit engineering preferences,
not an aesthetic objective. Current values must belong to declared domains.
Locks reduce domains to their current value. Conflicts are inclusion-minimal
subsets of requirements relative to those fixed domains and locks, not globally
minimum-cardinality explanations or proof of infeasibility outside these domains.

## Frozen Cases and Baselines

Prepare eight scenario families at six scales: scales 1/2 development, 3/5/7/11
held-out synthetic transformations. Families: already valid; one-variable repair;
two-variable coupled repair; secondary-requirement trap; locked obstruction;
contradictory requirements with an irrelevant requirement; equal-cost alternatives;
signed-coefficient/equality relationship. Total: 48 supported cases (16 development,
32 held out). All cases are authored before candidate implementation; no tuning on
the held-out scales. This is a weak synthetic holdout, not independently sampled
tasks or evidence of real-world generalization. Additional malformed, stale and
budget cases test abstention separately.

1. Verification-only baseline: identifies failed current requirements, never repairs.
2. Local baseline: fixes only the first failed requirement by changing one unlocked
   variable, minimizing absolute change. It does not check other requirements before
   proposing. Score proposals independently; never use this baseline in production.
3. Bounded candidate: searches permitted assignments, rechecks all requirements,
   emits a cost-minimal proposal or an inclusion-minimal conflict.

Independent oracle: separately implemented Cartesian-product expansion and direct
relation evaluation, without calling candidate validation, evaluation or search.
Audit every proposed assignment and conflict subset, including its proper one-item
deletions. Cross-check JS/Python outputs. Keep the complete per-case comparison.

## Predeclared Decisions

Retain the bounded candidate experimentally only if it finds every repairable
supported case, returns no invalid repairs/lock changes, agrees with oracle minimum
cost and feasibility on all cases, and improves valid repair count over both
baselines on the held-out split. Retain conflict extraction only if every returned
conflict is inclusion-minimal and at least one removes irrelevant requirements.
Unknown cases must never produce advice. Any safety failure requires correction
and disclosure before retention, not an adjusted criterion.

Report counts by split: valid/invalid/missing proposals, lock violations, feasibility
agreement, optimality, conflict minimality and assignments examined. Record elapsed
wall-clock runtime descriptively, not as a quality score or cross-machine benchmark.
Hash protocol, corpus and implementations; report source revision and dirty-file
state. Do not call working-tree results committed or release-qualified.

Retain only the winning behavior in experimental source. Preserve rejected baseline
code only in the evaluation harness for reproducibility and document why it failed.
No stable exports, release manifest, host installation or automatic mutation changes.
