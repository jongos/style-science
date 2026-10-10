# Mathematical Design Reasoning

Research plan, October 10, 2026. Proposed extensions, not claims of established
human benefit. No human study, hosted inference or private-data collection is
authorized by this document.

## Purpose

Style Science makes design reasoning explicit, portable and correctable. The
Generative Design Canvas should connect design intentions to requirements,
relationships, scoped predictions, observations and revisions. It should explain
why a decision is appropriate, which evidence supports it, and what would change
the decision. It is not a universal formula for beauty or another design editor.

Our research question is whether this shared representation helps people, agents
and platforms identify problems, compare alternatives and propose useful changes
more reliably than flat collections of tokens and rules. More representation or
more generated alternatives is not itself success.

## Scientific Position

Constraint models establish geometric feasibility. Color spaces describe aspects
of appearance and difference. Interaction models predict specific human actions
under specified conditions. Preference research concerns judgments conditioned on
audiences, experience and context. These are different questions: distinguishable
colors need not convey their intended meaning; reachable controls need not be
understandable; feasible layouts need not be aesthetically successful.

The proposed sequence is:

**Intent -> constraints -> candidate relationships -> scoped predictions ->
observed outcomes -> revision.**

Every model needs inputs, units, a mathematical definition, sources, applicability
conditions, limitations and calibration provenance where required. Reports must
distinguish calculations, predictions, observations and preferences. Evidence
belongs to a particular artifact and context. Missing inputs or unsupported
conditions remain unknown. Extend existing contracts only when added complexity
prevents a demonstrated error or enables a useful decision.

## First Experiment: Conflicts and Bounded Repairs

Study whether the framework can explain incompatible requirements and propose
permitted changes, rather than merely report failure. Cassowary informs the
separation of required linear constraints and preferences; Draco informs explicit,
testable design knowledge. Neither system is integrated by this plan.

Compare verification alone, a simple local repair heuristic and globally checked
bounded repairs. Use original synthetic layouts covering satisfiable problems,
contradictions, multiple repairs, locks and absent evidence. Independently check
small problems with known answers. Measure valid repairs, false feasibility
claims, lock violations, change cost, conflict correctness and runtime. Every
repair must satisfy every hard requirement. A solver result is a proposal, not
rendered evidence or permission to apply it.

The first implementation is deliberately a finite integer-domain experiment,
not a general continuous layout optimizer. Its exact limits, predeclared corpus
and decisions are in [the experiment protocol](constraint-repair/PROTOCOL.md).

## Second Experiment: Color in Context

Compare color-only analysis with a scoped model that includes rendered mark size,
shape and viewing assumptions. Reuse color pairs across points, lines, bars and
surfaces. Oklab informs color representation; Szafir's work motivates geometry-
dependent discriminability. Separate perceptual difference, text contrast and
semantic meaning. Unsupported effects and conditions remain unknown.

First reproduce calculations and applicability checks, then compare predictions
with reusable published reference data if rights allow. Synthetic cases alone
cannot establish human discriminability. Retain the extension only if it adds
defensible distinctions within the supported domain.

## Third Experiment: Interaction Effort

Compare simple geometric checks with a scoped Fitts-law model. Declare target
geometry, starting positions, device and task sequence. Without suitable
calibration, report a difficulty index, not invented milliseconds. Calibration
must identify its source and applicable range. Preserve other outcomes, such as
errors, separately; predicted speed never compensates for a hard failure.

Initial tests establish calculation and contract correctness. Demonstrating human
performance gains requires a separate approved empirical study.

## Later Work

Investigate visual clutter through feature congestion rather than element counts;
typography through global line-breaking optimization and separately measured
reader outcomes; and contextual color meaning through audience-specific evidence.
Do not optimize everything toward blankness, one font or fixed color associations.
These are later research directions, not current implementation commitments.

## Evaluation and Governance

Before running each comparison, freeze hypotheses, baselines, cases, measures and
retain/change/remove criteria. Keep development and held-out cases separate; do
not adjust thresholds after seeing results. Synthetic holdouts demonstrate only
generalization within their constructed family, not independent ecological validity.

Retain useful features, not every prototype. Preserve concise negative results and
counterexamples so failed approaches are not repeatedly rediscovered. This does
not change the historical winner-only recipe collection.

Jev or another model may suggest counterexamples and critique explanations when
separately authorized. Its outputs remain model observations, never the sole
oracle or proof of human benefit. No new model calls are needed for experiment one.

Deliver a protocol, attributed specification, matching JS/Python behavior where
applicable, regression fixtures, comparison report and an explicit decision.
Keep experimental APIs out of stable exports and release archives until separately
reviewed. Preserve the host's native rendering and delivery gates.

## Research Informing the Plan

- [Cassowary, Badros and Borning](https://constraints.cs.washington.edu/solvers/cassowary-tr.html): required and preferred linear relationships.
- [Draco, Moritz et al.](https://dig.cmu.edu/publications/2018-draco.html): executable visualization knowledge and learned soft-constraint weights.
- [Oulasvirta, computational UI design](https://research.aalto.fi/en/publications/user-interface-design-with-combinatorial-optimization/): model-based design search.
- [DesignScape](https://www.dgp.toronto.edu/~donovan/design/): refinement versus exploration of layout alternatives.
- [Oklab, Ottosson](https://bottosson.github.io/posts/oklab/): computational color representation and its compromises.
- [Szafir, color difference for visualization](https://danielleszafir.com/colordiff_vis2017.pdf): mark-dependent discriminability.
- [Palmer and Schloss](https://pmc.ncbi.nlm.nih.gov/articles/2889342/): ecological valence and color preference.
- [Semantic discriminability](https://arxiv.org/abs/2108.03685): context and feature-concept associations.
- [MacKenzie, Fitts' law](https://www.yorku.ca/mack/hci1992.html): pointing models and limits on transferring calibration.
- [Rosenholtz, visual clutter](https://persci.mit.edu/research/clutter): feature congestion and subband entropy.
- [Knuth and Plass](https://onlinelibrary.wiley.com/doi/10.1002/spe.4380111102): paragraph-wide line-breaking optimization.
- [AdaptiFont](https://arxiv.org/abs/2104.10741): individual font adaptation and measured reading performance.

These sources inform proposed research, not affiliation, endorsement or blanket
compatibility. No third-party code, data or assets are imported by this plan.
