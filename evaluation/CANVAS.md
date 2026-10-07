# Mathematical outcome canvas

Version 0.1.0, introduced in package 0.3.0. This is an executable comparison of supplied outcomes, not a universal theory of beauty or an automatic design selector.

## What changed

The original engine establishes declared feasibility. The decision module checks the stability of semantic model advice. The canvas adds a third operation: compare a baseline and a candidate on explicitly defined outcome metrics in every declared environment.

Each metric names its unit, instrument, direction and task-specific minimum meaningful effect. Each observation names the metric, environment, context and artifact revision, declares a measurement source, and supplies lower/upper engineering bounds. Missing observations, mismatched contexts, stale revisions, different units/instruments and model predictions produce `unknown`, never an inferred measurement.

The current canvas is scoped to the existing HTML plan/environment contract. It does not establish transfer to native documents, slides or motion. It does not extend the four existing browser checks or automatically collect outcome measurements.

## Arithmetic and interpretation

For a lower-is-better outcome with baseline bounds [bL,bU] and candidate bounds [cL,cU]:

    improvement = [bL - cU, bU - cL]

For a higher-is-better outcome:

    improvement = [cL - bU, cU - bL]

These are conservative interval differences. They assume the supplied values actually bound the quantities in the same context. No probability, covariance, causal effect or sampling confidence is inferred. Sample minima/maxima and statistical confidence intervals cannot silently be treated as guaranteed population bounds. Callers are responsible for the meaning and provenance of the intervals. Arithmetic uses finite IEEE-754 values with no rounding before comparison; overflow is rejected.

Let delta be the declared nonnegative minimum meaningful effect:

| Status | Condition on the improvement interval [L,U] |
| --- | --- |
| improved | L > delta |
| worsened | U < -delta |
| negligible | L >= -delta and U <= delta |
| inconclusive | None of those conditions holds |
| unknown | Comparable measurement evidence is missing |

Touching a threshold does not establish strict improvement or worsening. A point effect exactly at the threshold falls within the declared negligible band; a wider interval that touches the threshold and extends beyond it is inconclusive. `negligible` refers only to this metric and supplied bounds, not visual identity or statistical equivalence.

The canvas recomputes baseline and candidate feasibility with `verify`. A candidate that fails or has unknown required checks is `blocked`, regardless of its outcomes. Otherwise missing comparable outcomes produce `incomplete`, and a fully populated report is `comparison`. Baseline infeasibility remains visible; it does not prevent inspecting a repair's measured effects. No report selects a winner or assigns combined weights.

## Run the example

```shell
node examples/canvas.mjs
```

The example is explicitly synthetic. A compact reference has a time improvement bounded by 2 to 5 seconds, alongside an error-rate worsening bounded by 1 to 3 percentage points, in both example environments. The report preserves both effects and returns `automaticSelection: false`. No target users were tested.

JavaScript:

```javascript
import { compareCanvas, boundedEffect, assessExperiment } from './canvas.mjs';
import { canvasExample } from './examples/canvas.mjs';

const { plan, baseline, candidate, spec } = await canvasExample();
const report = compareCanvas(plan, baseline, candidate, spec);
```

Python provides `compare_canvas`, `bounded_effect` and `assess_experiment` from `canvas.py`, accepting the same JSON-shaped records. The full executable input shape is in `examples/canvas.mjs`; both consumers are tested against the same cases.

Observation identity is a host assertion, not authentication. A caller can still fabricate measurements or mislabel a prediction. Version context and instrument identifiers when task populations or measurement procedures change, and record collection artifacts separately. The canvas detects declared incompatibilities; it cannot establish truth from metadata.

## Feature-directed experiments

`assessExperiment` requires a feature, hypothesis, baseline, intervention, metric, budget, and `ifSupported` / `ifRefuted` actions. Each action has an `action` (improve, remove, retain or reject) and a `change` description. Missing fields are `incomplete`; identical actions/descriptions or two retain actions are `no-feature-decision`; otherwise the plan is `ready-for-review`.

This is a structural admission check, not semantic proof that the descriptions are meaningful or distinct. Every result has `collectionAuthorized: false`. It does not choose a sample size, invent a budget, preregister a study or authorize human collection. The existing evaluation protocol still governs those prerequisites.

## Jev contract review

Three feature hypotheses were written before the runs in `canvas-probes.mjs`, each with implementation branches for supportive and refuting results. Twelve synthetic scenarios were submitted in three presentations: original order, reversed order and relabeled options. Thirty-six judgments were obtained from resolved model `jev-1.13.0` through the TypeSafe playground.

Eleven scenarios selected the same semantic interpretation in all three presentations. The tradeoff scenario returned U/A/U (insufficient evidence / preserve separate outcomes / insufficient evidence). Reported confidence varied; none is treated as a measured probability that the implementation is correct.

| Feature | Decision and evidence |
| --- | --- |
| Bounded outcome comparison | Added. Overlap, separation, threshold and no-invented-probability interpretations were stable. Independent deterministic tests verify the arithmetic. |
| Measurement identity | Added. Unit, environment, instrument and measured/predicted distinctions were stable. Negative tests verify each unknown path. |
| Automatic tradeoff ranking | Rejected. No authorized weights or validated ranking instrument exists; the semantic tradeoff answer was unstable. Individual effects remain visible. |
| Experiment admission | Added as review-only structural validation. Both admission scenarios were stable, though the actionable-plan confidence was modest. It grants no collection authority. |

These are authored semantic probes with deliberately distinguishable options. The expected answers are analyst predictions, not independently collected truth labels. Stability is not a statistical quality result, proof of a design law or evidence that Jev accelerated the overall workflow. No rendered design or human task outcome was measured in this pass.

Reproduce request definitions and analyze the preserved responses without contacting Jev:

```shell
node evaluation/canvas-probes.mjs
node evaluation/analyze-canvas.mjs
npm test
```

The raw requests, responses and summary are under `evaluation/canvas-pass-2026-10-07/`. Tests check interval endpoints, sign reversal, threshold boundaries, incompatible observations, feasibility blocking and JavaScript/Python parity. Future experiments remain restricted to decisions that improve, remove or reject a feature.
