# Constraint Repair: Results and Developer Notes

## Decision

Retain exact bounded repairs and inclusion-minimal conflict explanations as an
**experimental, direct-file helper**. Keep verification as the stable gate. Reject
the one-variable/first-failure heuristic as advice to consumers; it remains only
in the comparison harness to reproduce its failures.

The [research plan](../MATHEMATICAL-RESEARCH-PLAN.md) explains the broader program;
the [protocol](PROTOCOL.md) was written before the implementation and comparison.
The [saved report](report.json) includes every case, not just successes, source
hashes, base Git revision and working-tree status. Source hashes, not the base
commit alone, identify this locally modified experiment.

## Comparison

Original synthetic integer-pixel relationships; 16 development cases and 32 held-out
scale transformations from the same eight scenario families. The holdout is weak:
scaling preserves the basic problem structure. It is not independent evidence of
real-world generalization. The baseline is deliberately simple, not a competitive
continuous optimizer or a comparison against Cassowary.

| Measure | Verification Only | Local First-Failure Repair | Bounded Repair |
| --- | ---: | ---: | ---: |
| Valid repairs, development (10 repairable) | 0 | 4 | 10 |
| Invalid proposals, all development cases | 0 | 4 | 0 |
| Valid repairs, held out (20 repairable) | 0 | 8 | 20 |
| Invalid proposals, all held-out cases | 0 | 8 | 0 |
| Missing proposals on repairable held-out cases | 20 | 8 | 0 |
| Lock violations, held out | 0 | 0 | 0 |

Invalid proposals include infeasible cases, so that row has a different denominator
from valid/missing repairs. Across all 48 supported cases, the candidate matched
the independent enumerator's feasibility classification. All 30 proposed repairs
had minimum lexicographic (changed-variable count, total pixel change) cost.
All 12 infeasible cases had independently checked inclusion-minimal conflicts;
six removed an irrelevant requirement. Six already-valid cases needed no repair.

The first complete local JS comparison took approximately 10 ms, including the
independent oracle. `report.json` records the current reproduction's time and Node
version. These tiny cases do not establish a general performance advantage, and
no rendering, user testing or inference time is included.

## Why the Alternatives Failed

**Verification only remains necessary, but cannot propose changes.** Its zero
repair count is an expected capability boundary, not a correctness failure. The
existing GDC verifier and native host gates are not replaced.

**Single-variable search misses coupled changes.** In `coupled-repair-3`, x and y
both begin at 9 and must sum to at most 6. Their permitted values are 3, 6 and 9.
Neither can fix the problem alone; changing both to 3 works. Local repair returns
no proposal, while bounded repair finds the two-variable solution.

**Fixing the first failure can break another requirement.** In `secondary-trap-3`,
x=9 and y=6 must sum to at most 12, while x must remain at least 9. The local
heuristic proposes x=6, y=6 and breaks the minimum. Bounded search instead proposes
x=9, y=3. The lesson is to recheck every hard requirement, not to compensate for
violations with an aggregate score.

**A contradiction is not a repair opportunity.** In `contradiction-3`, x<=3 and
x>=6 cannot coexist. The local heuristic fixes the first rule while violating the
second. Bounded search reports infeasibility within the declared domains and
identifies the two conflicting rules, omitting the unrelated rule for y.

**Relaxing locks is not an alternative.** Both methods preserve locks; the bounded
method can additionally explain an obstruction relative to the explicitly fixed
domains and lock values. No benchmark credit is awarded for an unauthorized change.

## Using the Retained Helper

JavaScript: `reviewConstraints` from `constraint-repair.mjs`.
Python: `review_constraints` from `constraint_repair.py`.
See [cases.json](cases.json) for complete runnable inputs.

```js
import { reviewConstraints } from '../../constraint-repair.mjs';
import { cases } from './fixtures.mjs';
const result = reviewConstraints(cases.find(c => c.id === 'secondary-trap-3').problem);
// result.repair.values: { x: 9, y: 3 }
// A proposal only. The host must render, recapture and run its existing gates.
```

Contract version 1 requires explicit finite integer domains, current values,
Boolean locks, px units, linear requirements and matching artifact/observation
revision strings. Reports bind the complete input with SHA-256. Changing any input
requires a new review; a caller-supplied hash/revision is not authenticated evidence.
The helper does not apply edits, generate CSS or ingest arbitrary natural language.

`satisfied` means the current declared values satisfy the declared equations.
`repair-proposed` returns a permitted all-requirement solution, cost and changes.
`infeasible` applies only to the declared finite domains and locks; continuous or
larger domains may admit solutions. Conflicts are inclusion-minimal, not necessarily
the smallest possible conflict, and domains/locks are background assumptions.
`unknown` returns no proposal for malformed, unsupported, stale or over-budget input.
All reports remain experimental, non-automatic and ineligible for release evidence.

## Verification and Limits

Local verification on October 10, 2026: all 47 core tests, 31 research tests and
two read-only downstream GDC provenance/routing tests passed. The initial sandboxed
core run passed 46/47 but failed the extracted-archive consumer check. The unchanged
suite passed outside the filesystem sandbox; no packaging assertion was weakened.
Browser tests were not run because no renderer, HTML adapter or site changed.
No new CI run, commit, push or deployment is claimed by this local verification.

Run `node evaluation/constraint-repair/run.mjs` to regenerate cases/report and
`node --test constraint-repair.test.mjs` for independent-oracle and Python parity
checks. Regeneration overwrites the two generated JSON files; review the diff.
The test is also included in `npm run test:research`.

Regression coverage includes 22 abstention inputs, deterministic equal-cost choices,
input binding, no mutation, the exact 4096-assignment boundary, and 120 additional
deterministic mixed-sign/equality cases. Supplementary cases are robustness checks,
not additional held-out efficacy evidence. Saved evidence is checked against source
hashes; intentional implementation changes require rerunning and reviewing the study.

The chosen objective prioritizes fewer changed variables, then smaller total pixel
change. This is an explicit engineering preference, not a model of design quality.
Enumeration is deliberately capped: six variables, 32 domain values per variable,
12 requirements, at most 4096 permitted assignments, bounded integer arithmetic.
There is no float tolerance, nonlinear model, global continuous optimality claim,
runtime rendering, human study or Jev call. Stable exports and release ZIP contents
are unchanged. Dazzler and its installed skill are untouched.

Next useful test: independently authored, realistic layout problems compared with
a mature solver, including domains where our bounded search abstains. Do not
promote this helper merely because the constructed cases pass.
