# Contextual Design Science

Status: research thesis and exploratory model evidence, October 7, 2026. No human study or design-quality improvement has been established.

The subsequent [mathematical outcome canvas](CANVAS.md) implements conditional interval comparisons and feature-directed experiment admission. It does not estimate the causal effects proposed below. Its separate 36-judgment Jev contract review and deterministic tests are documented in that record.

## Thesis

Design can be studied as the choice of a feasible intervention for a specified audience, task and environment. A useful mathematical framework should predict measurable consequences of those interventions, expose uncertainty and improve or eliminate an actual feature when its predictions are tested.

Style Science should therefore represent conditional, falsifiable relationships between design decisions and outcomes. Jev can accelerate the screening of those relationships and the classification of decision states. Renderers, deterministic measurements and human experiments supply different kinds of evidence. Agreement among repeated Jev answers is model stability, not scientific corroboration.

## Mathematical structure

Let d be a design intervention; c=(task, audience, content, medium, environment, explicit requirements) its context; and m(d,c) the available measurements. Represent each requirement g_j(d,c) as pass, fail or unknown.

    F(c) = { d : every required g_j(d,c) is observed and passes }

This is the feasible set already implemented by GDC. Missing evidence excludes a candidate from verified eligibility. Aesthetic preference cannot compensate for a failed requirement.

For each feasible design, study an outcome vector rather than an assumed universal beauty score:

    Y(d,c) = (task errors, completion time, comprehension,
              audience preference, maintenance cost)

Each coordinate needs its own instrument, units, population and uncertainty. Not every coordinate applies to every task. No weights are implemented or inferred from Jev confidence. A chosen tradeoff must be supplied by the task owner or investigated with target users.

A design hypothesis predicts a contextual intervention effect:

    Delta_j(c) = E[Y_j | do(d = treatment), c]
                 - E[Y_j | do(d = baseline), c]

The do notation specifies the desired causal question; the current repository does not estimate it. A randomized comparison or defensible causal design would be needed. Observed popularity, a computed distance or a model's preference is not that estimate.

For semantic model probes, compare distributions after mapping every option back to the same meaning:

    TV(p,q) = 0.5 * sum_i abs(p_i - q_i)

The decision module reports the maximum pairwise total-variation distance across baseline, reordered and relabeled observations. Rounded distributions are normalized first. A changed winning meaning produces `unstable`; no arbitrary threshold converts distribution stability into truth. Even unanimous predictions remain advisory.

The research objective is lower decision and revision cost at acceptable task outcomes. Any empirical stopping policy requires outcome history, an explicit budget and a minimum practical effect; none is inferred from the mere cost of another model call.

## What this pass established

The TypeSafe playground executed four batches against resolved model `jev-1.13.0`: 15 scenarios in three variants and 15 additional scenarios in one variant, for 60 judgments across 30 scenarios. An earlier five-question smoke run is retained separately and is excluded from those totals. Six pre-existing demonstration scenarios were not part of the collected dataset and are excluded from all counts and conclusions.

The three variants used the original option order, reversed order, and swapped labels. They were sent as separate requests. The text scenarios covered density, layout, whitespace, palette roles, redundancy, novelty, symmetry, context, typography, uncertainty and mathematical claims. They contained no rendered images. Analyst predictions were recorded before the runs, but are not independent ground truth and are never reported as model accuracy.

| Finding | Evidence | Feature decision |
| --- | --- | --- |
| A semantic answer can change under equivalent option presentation | `density_lookup`: A/U/A; `palette_distance`: B/U/B | Add semantic normalization and an instability state; withhold a single recommendation when winners disagree |
| Missing context can be a meaningful result | `density_unknown`, `density_reading`, `palette_semantics` returned U in all three variants | Require declared context fields and support explicit abstention; do not hard-code universal density or palette defaults from this pass |
| Whitespace direction depends on the task | More separation for paragraphs running together; retain compact spacing when additional space hides critical rows, consistently across variants | Keep spacing task-dependent; do not add an unconditional whitespace maximizer |
| Novelty depends on the task | Exploratory composition for an experimental exhibition; familiar navigation for repeated operations, consistently across variants | Preserve task and explicit intent in decision contracts; do not add a global novelty bonus |
| Numeric descriptions do not establish perceptual benefit | Color-distance conclusion was unstable; quality, confidence and transfer probes were only single-variant model judgments | Keep exact measurements in code and visual/human claims unvalidated; no automatic aesthetic ranking added |

These findings describe model behavior under authored questions. Wording bundles several properties, options can make answers obvious, and broad state-free questions can over-invite abstention. No result establishes a universal design rule. The second group lacks replication under reordered or relabeled options and is marked `needs-observations` by the new code.

## Incorporated code

`decision.mjs` and `decision.py` implement matching offline contracts. They accept a context-bound decision and observations already obtained from a provider; they make no network requests and need no credentials.

- `decisionFingerprint` / `decision_fingerprint`: bind the decision ID, context, required fields, option meanings and abstentions to a local SHA-256.
- `assessChoice` / `assess_choice`: require baseline, reordered and relabeled observations from the same resolved model; normalize option labels; reject malformed probabilities; distinguish missing context, missing observations, stale results, model mismatch, instability, abstention and advisory output.
- `reviewCandidate` / `review_candidate`: recompute feasibility through the existing engine before exposing advice. A fail or unknown remains blocked.

Fingerprints detect mismatches, not fabricated observations. Callers must honestly preserve which prompt, option mapping and model produced each observation. The three runs are correlated sensitivity checks. Every result has `automaticAction: false`; confidence is recorded but is not used as an accuracy guarantee or a calibrated execution threshold.

The core verifier remains at version 0.1.0, with unchanged output semantics. The package is 0.2.0 because it adds an optional decision export; the decision contract is independently versioned at 0.1.0. No downstream Dazzler copy is changed in this pass.

## Only actionable experiments

Before another Jev batch, name the affected feature and write both result branches. An experiment without an improvement, removal or rejected addition on each branch does not run. Prefer deterministic fixtures when they can settle the question without a model.

| Hypothesis to test next | Comparison and measurement | If supported | If refuted |
| --- | --- | --- | --- |
| The stability gate reduces wrong semantic routing at acceptable cost | Freeze labeled routing cases; compare one prediction against three-variant gating; measure routing errors, abstention, latency and human overrides | Retain gating for affected decisions | Remove mandatory triple probing for decisions where its cost exceeds its measured benefit; retain ordinary schema/context checks |
| Task-specific source retrieval reduces revision cost | Same briefs, model and generation budget; compare full-library prompting with relevant-source retrieval; measure time, revisions and target task outcomes | Add a tested retrieval adapter | Remove the retrieval stage and its maintenance burden |
| More complete observation capture is more valuable than semantic routing for unknown-heavy pages | Classify unknown causes; compare a specific richer measurement adapter with the current one on held-out rendered fixtures | Extend that adapter's precisely tested coverage | Reject that extension; retain explicit unknown outcomes |
| Contextual spacing policies improve the target task | Freeze two realizable spacing interventions; compare task time/errors and preference in the specified audience | Add a scoped spacing rule with the measured effect | Remove that default or narrow its applicability |

No sample size, effect threshold, confidence cutoff or cost ceiling has been invented here. For human outcomes, complete the existing `protocol.json` preregistration fields before collection. Model regression fixtures can run now; human study results cannot be claimed from them.

## Reproduce and inspect

    node evaluation/jev-probes.mjs
    node evaluation/analyze-jev.mjs
    npm test

The first command regenerates the four saved request specifications; it does not call Jev. The second reads the preserved playground responses and recomputes `analysis.json`. Tests include the actual density-lookup disagreement and cross-language parity. Original responses contain the resolved model and full answer distributions. Planned batches `batch-1-1` and `batch-1-2` (reordered and relabeled variants of the second group) were not executed because they lacked an additional concrete feature decision. Their request files are not in the dataset. This exploratory stopping decision was made after inspecting earlier results; the pass was not preregistered.

Official source checks used in this pass:

- [State inputs](https://docs.typesafe.ai/concepts/state): Jev consumes text/JSON, not rendered images.
- [Confidence](https://docs.typesafe.ai/confidence): confidence summarizes the answer distribution; it is not a measured task-success rate.
- [Known limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13): exact arithmetic, option order, irrelevant context and adversarial text require explicit handling.
- [Models](https://docs.typesafe.ai/models): record resolved versions because aliases can change.

This thesis is a proposal for a testable design science. The delivered code operationalizes evidence handling and model sensitivity; causal design-effect estimation and human validation remain future experiments tied to concrete feature decisions.
