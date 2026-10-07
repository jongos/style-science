# The Mathematical Outcome Canvas

Imagine a technician looking up a fault. You make the reference more compact. Lookups get faster, but people choose the wrong fault more often. Should you ship it?

That is the kind of decision this canvas is built to clarify. It puts alternatives, requirements and outcomes in one comparison, without hiding competing effects inside a single score. The math makes the consequences inspectable. Deciding which consequences matter remains a human responsibility.

Here is that tradeoff in the runnable example. These numbers are **synthetic**, not results from testing people or rendered designs:

| Outcome | Baseline Bounds | Compact Reference Bounds | Bounded Effect |
| --- | --- | --- | --- |
| Lookup time | 10 to 12 seconds | 7 to 8 seconds | 2 to 5 seconds faster |
| Error rate | 1% to 2% | 3% to 4% | 1 to 3 percentage points worse |

Both effects appear in both example environments. The report returns `automaticSelection: false`: faster lookups alone cannot tell us how much additional error the task can tolerate.

## Give the Decision a Shape

Style Science separates three questions:

- **Does the design meet its declared requirements?** The original engine checks feasibility.
- **Does model advice survive a change in presentation?** The decision module checks semantic stability.
- **What changes when we use this candidate?** The canvas compares supplied baseline and candidate outcomes in every declared environment.

To make that last question answerable, name each metric's unit, instrument, direction and task-specific minimum meaningful effect. Then supply observations with lower and upper engineering bounds, tied to a metric, environment, context and artifact revision. Each observation also declares its source.

Those details determine whether two numbers belong in the same comparison. A stale revision, a different instrument or a model prediction cannot stand in for a comparable measurement. Missing observations, mismatched contexts, different units and other declared incompatibilities return `unknown`, never an inferred measurement.

The current canvas works with the existing HTML plan/environment contract. It neither collects outcomes automatically nor adds to the four existing browser checks. Transfer to native documents, slides or motion has not been established.

## Read the Range

For the lookup example, the smallest improvement is 10 minus 8: two seconds. The largest is 12 minus 7: five seconds. Keeping both endpoints prevents the comparison from claiming more precision than its inputs provide.

For a lower-is-better outcome with baseline bounds [bL,bU] and candidate bounds [cL,cU]:

    improvement = [bL - cU, bU - cL]

For a higher-is-better outcome:

    improvement = [cL - bU, cU - bL]

These conservative interval differences depend on the supplied bounds actually containing the quantities in the same context. They do not infer probability, covariance, causality or sampling confidence. Sample minima and maxima, or statistical confidence intervals, cannot silently become guaranteed population bounds. The caller must document what the intervals mean and where they came from.

Arithmetic uses finite IEEE-754 values without rounding before comparison. Overflow is rejected.

In either direction, a positive effect favors the candidate. Let delta be the declared nonnegative minimum meaningful effect:

| Status | Condition on the improvement interval [L,U] |
| --- | --- |
| improved | L > delta |
| worsened | U < -delta |
| negligible | L >= -delta and U <= delta |
| inconclusive | None of those conditions holds |
| unknown | Comparable measurement evidence is missing |

The threshold is deliberate. Touching it does not establish strict improvement or worsening. A point effect exactly at the threshold is inside the negligible band; a wider interval that touches the threshold and extends beyond it is inconclusive. Here, `negligible` describes this metric and these bounds. It does not mean the designs look identical or have demonstrated statistical equivalence.

## Requirements Still Apply

A promising outcome cannot waive a required check. The canvas calls `verify` again for both artifacts and reports:

| Report | Meaning |
| --- | --- |
| `blocked` | The candidate fails a required check, or a required check is unknown, regardless of its outcomes. |
| `incomplete` | The candidate clears its required checks, but comparable outcome evidence is missing. |
| `comparison` | The candidate clears its required checks and the outcome comparison is fully populated. |

A baseline's failed checks stay visible, but do not prevent inspecting a repair's measured effects. None of these reports selects a winner or assigns combined weights.

## Try the Comparison

Run the synthetic example:

```shell
node examples/canvas.mjs
```

Or use the JavaScript API:

```javascript
import { compareCanvas, boundedEffect, assessExperiment } from './canvas.mjs';
import { canvasExample } from './examples/canvas.mjs';

const { plan, baseline, candidate, spec } = await canvasExample();
const report = compareCanvas(plan, baseline, candidate, spec);
```

Python exposes `compare_canvas`, `bounded_effect` and `assess_experiment` from `canvas.py`, accepting the same JSON-shaped records. See `examples/canvas.mjs` for the full executable input shape. Both implementations are tested against the same cases.

Measurement identity is still a host assertion, not authentication. The canvas can detect declared incompatibilities; it cannot catch a fabricated measurement or a mislabeled prediction simply because the metadata looks right. Version context and instrument identifiers when task populations or measurement procedures change, and keep collection artifacts separately.

## Make an Experiment Earn Its Place

Before running a hypothesis, say which feature could change and what you would do with either result. A study that cannot affect the product is outside this pass's scope.

`assessExperiment` checks that a plan names its feature, hypothesis, baseline, intervention, metric and budget. It also requires `ifSupported` and `ifRefuted` branches. Each branch supplies an `action` (`improve`, `remove`, `retain` or `reject`) and a `change` description.

- Missing fields return `incomplete`.
- Identical actions and descriptions, or two retain actions, return `no-feature-decision`.
- Other complete plans return `ready-for-review`.

That last status means the structure is ready to inspect, not that the experiment is ready to run. The checker cannot prove that the descriptions are meaningful or distinct. It does not choose a sample size, invent a budget, preregister a study or authorize human collection. Every result carries `collectionAuthorized: false`; the existing evaluation protocol governs those prerequisites.

## What Jev Helped Us Keep and Reject

We used Jev to review proposed contract interpretations. Three feature hypotheses were written in `canvas-probes.mjs` before the runs, with implementation branches for supportive and refuting results.

We submitted twelve synthetic scenarios in three presentations: original order, reversed order and relabeled options. The TypeSafe playground returned thirty-six judgments from resolved model `jev-1.13.0`.

Eleven scenarios retained the same semantic interpretation across all three presentations. The tradeoff scenario did not: it returned U/A/U, or insufficient evidence / preserve separate outcomes / insufficient evidence. That instability reinforced the decision to leave automatic tradeoff ranking out. There were also no authorized weights or validated ranking instrument to justify adding it.

| Feature | Decision and evidence |
| --- | --- |
| Bounded outcome comparison | Added. Overlap, separation, threshold and no-invented-probability interpretations were stable. Independent deterministic tests verify the arithmetic. |
| Measurement identity | Added. Unit, environment, instrument and measured/predicted distinctions were stable. Negative tests verify each unknown path. |
| Automatic tradeoff ranking | Rejected. No authorized weights or validated ranking instrument exists; the semantic tradeoff answer was unstable. Individual effects remain visible. |
| Experiment admission | Added as review-only structural validation. Both admission scenarios were stable, though the actionable-plan confidence was modest. It grants no collection authority. |

Jev's role here was to challenge the contract, not certify the science. These were authored semantic probes with deliberately distinguishable options. Expected answers were analyst predictions, not independently collected truth labels. Reported confidence varied and is not treated as a measured probability of implementation correctness.

The pass establishes neither a design law nor a statistical quality result. It measured no rendered design or human task outcome, and does not show that Jev accelerated the overall workflow. What it produced is narrower and useful: explicit feature decisions, executable contracts and tests that can fail when the implementation breaks those contracts.

## Inspect the Evidence

Reproduce request definitions and analyze the preserved responses without contacting Jev:

```shell
node evaluation/canvas-probes.mjs
node evaluation/analyze-canvas.mjs
npm test
```

Raw requests, responses and the summary live in `evaluation/canvas-pass-2026-10-07/`. Tests cover interval endpoints, sign reversal, threshold boundaries, incompatible observations, feasibility blocking and JavaScript/Python parity.

Future experiments remain restricted to decisions that improve, remove or reject a feature. The next useful question is a concrete one: which design decision needs better evidence, and what will change when we have it?

Canvas version 0.1.0, introduced in package 0.3.0. This is an executable comparison of supplied outcomes, not a universal theory of beauty or an automatic design selector.
