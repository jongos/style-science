# Related work informing Style Science

Reviewed October 8, 2026. Style Science is an open, evidence-aware framework for
design reasoning: helping AI agents express, test and revise design decisions in
service of human needs. We are not inventing design reasoning from scratch.

These projects and publications inform our direction from this review onward;
this is not a retrospective claim that existing code derives from them. Sources
below are project documentation, a published specification and research papers.
Repository descriptions are author claims, not independently tested results.
No source code, assets or datasets were imported in this review. Compatibility,
affiliation and endorsement are not implied.

## Penrose: separate meaning from representation

[Penrose](https://penrose.cs.cmu.edu/docs/ref) separates Domain, Substance and Style:
types and predicates, particular objects and relationships, and their visual
representation. Its diagram-generation approach uses numerical optimization.

**Insight to develop:** a relationship such as grouping should survive a change
of presentation. Our proposed distinction is semantic intent, medium-specific
realization, and independently scoped evidence. Satisfying a geometric objective
does not prove that people perceive the intended group.

**Test and decision:** encode equivalent relationships in synthetic HTML and
document specifications. Retain a shared representation only if equivalent
intent stays equivalent and unsupported medium mappings remain unknown. Otherwise
keep the relationship medium-specific. No Penrose integration exists today.

## Scout: translate concepts without hiding assumptions

[Scout, Swearngin et al. (2020)](https://arxiv.org/abs/2001.05424) translates
high-level concepts including emphasis, order and semantic structure into spatial
constraints for interface alternatives. Its reported 18-designer evaluation is
evidence for that system and task, not for Style Science.

**Insight to develop:** translating "emphasize this action" must expose the chosen
interpretation. Size, placement and contrast are possible instruments, not
interchangeable definitions of attention.

**Test and decision:** compare explicit concept-to-constraint mappings with direct
low-level declarations under identical synthetic briefs and candidate budgets.
Retain a mapping only if it reduces declaration omissions without adding hard
constraint violations. Remove unsupported mappings; do not infer perceived
emphasis from geometric compliance. This translator is proposed, not implemented.

## C-K theory: distinguish a possibility from knowledge

[Hatchuel, Le Masson and Weil (2011)](https://www.cambridge.org/core/journals/ai-edam/article/abs/teaching-innovative-design-reasoning-how-conceptknowledge-theory-can-help-overcome-fixation-effects/C6BBCFEB0A1368C37A616E4F26AA7EAC)
discuss concept-knowledge theory in teaching innovative design reasoning and
addressing fixation. This is an established research lineage, not an agent API.

**Insight to develop:** a plausible design idea should remain a hypothesis until
an appropriate observation supports a scoped claim. This distinction informs our
thinking; it is not a complete implementation or formal equivalence to C-K theory.

**Test and decision:** inject contradictory, stale and absent evidence into a
proposed decision-history representation. Retain it only if claims lose support
when their evidence changes and this catches errors missed by a flat record.
Otherwise retain the simpler existing evidence records. Human creativity or
fixation benefits would require separate human research.

## Design Model: contracts should explain failed decisions

[sherizan/design-model](https://github.com/sherizan/design-model) describes tokens,
component contracts and constraints, plus validation and suggested fixes through
MCP. Its documented demonstration is intentionally narrow.

**Insight to develop:** a failure should identify the requirement and the smallest
candidate change that could address it. A repair proposal is not permission to
modify a user's design, and it must be checked against every hard constraint.

**Test and decision:** use conflicting synthetic requirements to compare repair
suggestions against validation alone. Retain repair advice only if it produces
more valid candidates without relaxing locks; suppress it when no verified repair
exists. Repair generation and MCP interoperability are not implemented here.

## AgentsORG / DESIGN: carry rationale with the contract

[AgentsORG / DESIGN](https://github.com/AgentsORG/DESIGN) describes a portable
`.design` file containing visual contracts, rationale and agent instructions.

**Insight to develop:** distinguish normative requirements from rationale and
examples. Imported prose should not silently become an executable requirement,
and imported agent instructions must remain untrusted data.

**Test and decision:** trial a narrowly versioned import mapping with round-trip
fixtures. Retain it only if supported requirements preserve their meaning and
unsupported fields receive explicit diagnostics. Reject an import that needs
silent guessing. There is no `.design` compatibility claim today.

## design-pact: distinguish derivation from verification

[no7z/design-pact](https://github.com/no7z/design-pact) documents deterministic
token derivation, an agent-readable contract and source/rendered compliance checks.

**Insight to develop:** record which values were supplied, derived or observed.
A palette-derived value is not evidence that a delivered artifact uses it, and
compliance is not a measurement of aesthetic quality.

**Test and decision:** mutate synthetic token values and observations independently.
Retain derivation provenance only if it detects otherwise-missed stale reasoning;
remove redundant fields if it adds no diagnostic value. This is an offline data
experiment, not a proposal to restore browser installation or copy its auditor.

## DTCG: reuse an interchange standard

The [Design Tokens Community Group Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/)
defines a token exchange format. It is a Community Group specification, not a
W3C Recommendation or a general theory of design quality.

**Insight to develop:** keep interoperable token values separate from our context,
constraints and evidence. Do not invent competing token syntax where the standard
already supplies it.

**Test and decision:** start with a declared subset, round-trip supported types
and aliases, and reject cycles, unsupported values and lossy conversions. Retain
an adapter only with matching JavaScript/Python outcomes. The first
[experimental adapter](TOKENS.md) now covers numbers, dimensions, font families
and curly-brace aliases, with original synthetic regression/parity tests. Other
types and reference mechanisms remain unsupported; no full DTCG conformance
claim is made. See the [experiment protocol](evaluation/TOKEN-INTERCHANGE.md).

## Our synthesis, not a new name for their systems

We propose connecting intent, representation, constraints, evidence and revision.
For candidate x in context c, let each declared hard check have value pass, fail
or unknown. A candidate is eligible only when all required checks pass. A
preference objective may help compare eligible candidates; it cannot offset a
failed constraint or manufacture missing evidence. Eligibility is not beauty.

A decision record should make four questions answerable: why this choice, under
which conditions, supported by what evidence, and what would change the decision?
Existing GDC checks, scoped evidence and outcome comparisons cover parts of this;
most integrations and extensions above remain proposed research. The limited
token-interchange implementation is explicitly identified separately.

First investigate token interchange, then rationale-preserving contracts, then
concept translation and repair. Each experiment must predeclare a baseline,
failure cases, held-out cases and a retain/remove decision. Keep negative results
for these new engineering experiments; do not alter the historical winner-only
recipe dataset. The initial review ran no experiment; its first follow-on is the
offline token-interchange fixture experiment. No human study has been run.

Future implementations should cite the exact source/version informing them.
Direct reuse of code, schemas, assets or datasets requires its own license and
provenance review. Acknowledgment is scholarly attribution, not permission to
copy, a claim of partnership, or a promise of search ranking.
