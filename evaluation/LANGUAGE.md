# A Language for Design

A heading is not important because it has a large number beside it. It is important in relation to something else: a paragraph, a competing action, a reader's immediate task. If GDC is to learn design, those relationships have to become part of what it learns.

Style Science supplies the language and the evidence discipline. GDC is the research program for learning and reasoning in that language. Dazzler is one possible consumer, not the runtime authority.

This first implementation makes five parts of that direction usable without pretending the research is finished.

The subsequent [rendered relationship study](RELATIONS.md) adds separate DOM and geometric instruments, a host-supplied HTML collector and actual Chromium counterexamples. It does not upgrade numerical predicates into perceptual judgments. The initial-pass record below retains its original scope and test count.

| Direction | Implemented Now | Still a Research Question |
| --- | --- | --- |
| Design grammar | Typed nodes, four relations, graph validation, declaration hashes and host-evidence checks | Which relationships transfer reliably between native media? |
| Perceptual representation | Oklab color coordinates, token contrast and dimensionless type/spacing ratios | Which representation captures perceived style independently of content? |
| Contextual dialects | Explicit task, audience, medium and intent; exact-match filtering with unknowns | Can learned contextual matching outperform explicit labels on unfamiliar designs? |
| Causal knowledge | Evidence compatibility and provenance review gates, alongside the existing outcome canvas | What interventions produce practically important effects under declared conditions? |
| Learnable corpus | Rights-metadata checks, split-leakage detection and winner-library diagnostics | Can a model generalize across sources, brands, template families and media? |

The modules are experimental version `0.1.0`. They have no third-party runtime dependencies, network calls, renderer or trained weights. No external dataset has been copied or added to training. No human preference result, causal estimate, or improvement in aesthetic quality is claimed.

## Start with Relationships

Use [language.mjs](../language.mjs) from JavaScript or [language.py](../language.py) from Python. The [example declaration](../examples/language.json) is synthetic and deliberately small. It describes a reference entry, its title and its description without choosing a layout engine.

```shell
node examples/language.mjs
node --test language.test.mjs
node evaluation/language-study/run.mjs
```

```javascript
import { validateDesign, describeTokens } from './language.mjs';
validateDesign(design);
const descriptors = describeTokens({
  foreground: '#202020', background: '#ffffff',
  bodyPx: 16, headingPx: 32, lineHeightPx: 24, gapPx: 8
});
```

```python
from language import validate_design, describe_tokens
validate_design(design)
descriptors = describe_tokens({
    "foreground": "#202020", "background": "#ffffff",
    "bodyPx": 16, "headingPx": 32, "lineHeightPx": 24, "gapPx": 8
})
```

Both snippets assume the host has loaded `design` from the example JSON. JSON field names remain the same across languages; Python function names use snake_case. The package also exposes the JavaScript `./language` subpath.

## Grammar Contract

A design contains `languageVersion`, `id`, `revision`, `context`, `nodes` and `relations`. Context explicitly names `task`, `audience`, `medium` and `intent`. These are host-owned labels, not inferred demographics. Unknown fields and unsupported versions are rejected.

Each node has an ID, kind, semantic role and an array of `tokenRefs`. Kinds are `group`, `text`, `image`, `action` and `data`. Token references are opaque host-owned identifiers: resolve them using the host's existing token system. This module does not parse or claim conformance to DTCG, load fonts, or replace native chart, document or interaction models.

| Relation | Declared Meaning | Structural Rule |
| --- | --- | --- |
| `contains` | A group directly contains a child | Group parent; at most one parent; no cycles |
| `precedes` | A comes before B in the intended reading sequence | Directed and acyclic; no inferred geometric direction |
| `groups-with` | A and B are intended to be perceived as related | Symmetric pair; no automatic transitive grouping |
| `emphasizes` | A is intended to receive more emphasis than B | Directed and acyclic; no font-size or salience threshold inferred |

Endpoints must exist. Self-relations, duplicate edges, reversed duplicate symmetric edges and duplicate IDs are invalid. Containment is a forest: multiple roots are permitted. Different relation kinds are validated independently; this is not a general semantic-consistency solver. Limits are 256 nodes and 1,024 relations per declaration.

[The JSON Schema](../schemas/design.schema.json) checks structural fields. Runtime validation additionally checks graph semantics. Runtime text is limited to 4,000 UTF-16 code units; JSON Schema length uses Unicode code points, so runtime validation is authoritative at that boundary.

`designFingerprint` hashes canonical key-sorted JSON. Arrays retain their order. It binds the exact declaration and context, not graph isomorphism, visual identity or authentic evidence. Changing media or revision changes the hash even when relationships are preserved.

## Check a Realization

`assessRelations(design, capture)` accepts a host record with `designHash`, `artifactRevision`, `environment` and `observations`. Every observation names `relation`, `status`, `instrument` and `source`. Status is `pass`, `fail` or `unknown`.

Missing observations, a null capture, stale declarations and empty relation sets cannot pass. One failure makes the report fail. Otherwise a missing or unknown observation makes it unknown. Passing means only that the host supplied a passing observation for every declared relation in this one environment.

The module does not observe a render or verify a host's assertion. The host must define and test each instrument. For example, a computed font-size comparison is not automatically an instrument for perceived emphasis. A report never authorizes selection; hosts must still run their required feasibility checks through the existing verifier and capture every required environment separately.

The web, slide and document fixtures test transport of declarations, not successful rendering or cross-medium perceptual equivalence. Native-medium adapters remain unimplemented.

## Measure without Inventing a Score

`describeTokens` accepts two opaque six-digit sRGB colors and four declared dimensions in CSS pixels: body size, heading size, line height and gap. Dimensions must be finite, at most 16,384; gap may be zero and the other dimensions must be positive. These are bounded prototype inputs, not recommended design ranges.

The output contains Oklab coordinates, Euclidean Oklab color distance, the existing sRGB contrast ratio, heading/body ratio, line-height/body ratio and gap/body ratio. Ratios remain unchanged when all four dimensions are scaled equally. Oklab uses Bjorn Ottosson's published 2021-01-25 matrices under the author's public-domain offering.

These quantities are inspectable coordinates, not a learned embedding or a universal perceptual distance. They omit font metrics, imagery, accents, layout, content, motion and interaction. They cannot certify accessibility, visual hierarchy or beauty. Floating-point consumer agreement uses a relative/absolute tolerance of `1e-12`, rather than requiring bit-identical arithmetic.

## Keep Context Explicit

`matchContexts(request, candidates)` compares the four context labels exactly, preserves input order and returns matching IDs without ranking them. Every candidate has `id` and `context`. Null fields are allowed here to represent missing context; absent keys are malformed input.

A null request field returns `needs-context`. A known candidate mismatch is `out-of-scope`; otherwise missing candidate context is `unknown`. There are no default audiences, hidden weights, popularity priors or aesthetic scores. Hosts own their vocabularies and normalization. Matching labels do not demonstrate task effectiveness.

## Separate Evidence from Conclusions

`assessEvidence(claim, evidence)` is a review gate, not a causal estimator. The claim declares `id`, `kind`, `context`, `artifactRevision` and `instrument`. The record adds its own `id`, evidence `kind`, `source`, a nonempty `limitations` array and `protocol` (a reference or null), with matching context, revision and instrument.

| Claim Kind | Compatible Record Kinds |
| --- | --- |
| `numerical` | `computed` |
| `rendered` | `rendered` |
| `association` | `observational`, `randomized` |
| `causal` | `randomized`, with a protocol reference |
| `preference` | `observational`, `randomized`, with a protocol reference |
| `model-advice` | `model-prediction` |

Synthetic records cannot establish these real-world claims. Compatible metadata yields only `ready-for-review`, always with `establishesClaim: false`. The reviewer still needs the actual study, instruments, estimand, uncertainty, protocol and assumptions. A protocol string is not proof that preregistration or authorization occurred. Observational causal identification is deliberately unsupported in this first contract, not scientifically impossible.

Use the existing canvas for comparable measured bounds. Do not turn its interval arithmetic into a causal estimate or statistical confidence interval. Use the existing experiment-admission function to require a concrete improvement, removal or rejection decision before collection.

## Prepare a Corpus Responsibly

`auditCorpus(records)` checks metadata for records with `id`, `split`, `sourceGroup`, `brandGroup`, `templateGroup`, `contentHash`, `rights` and `evidenceKind`. Splits are `train`, `validation` and `test`. Group labels may be null, which blocks readiness instead of silently treating missing values as independent groups. Content hashes must be lowercase SHA-256 strings or null.

Rights contain `training` (`cleared`, `unknown` or `denied`), `license` and `source`. Cleared metadata is not legal advice or permission granted by this program. The report always returns `trainingAuthorized: false`.

Any shared source, brand, template family or content hash crossing splits is flagged. This also catches the crossing edges in a chain of related records, but does not infer undeclared relationships. Empty splits, unresolved rights and synthetic/model-predicted validation or test labels block readiness for an independent benchmark. Such labels may still be useful for separately labeled synthetic regression tests.

Groups and hashes must be established by the host, not invented just to get a passing audit. Hashes detect byte identity only after consistent host canonicalization. Similarity deduplication, license verification, label audits and split allocation are not implemented. A successful metadata audit is only readiness for review.

## What This Pass Tests

The test suite exercises invalid graphs, 100-node cycles, missing and stale observations, known color values, numerical scaling, explicit-context behavior, evidence incompatibility, rights gaps and leakage. JavaScript/Python parity covers valid and invalid contracts and all 1,000 retained recipe descriptors.

[The diagnostic runner](language-study/run.mjs) regenerates [report.json](language-study/report.json) from the retained winner file. It preserves the LF-normalized input SHA-256, observed ranges, projection collisions and aggregate corpus-readiness issues. Line-ending normalization keeps the hash portable between Windows and Unix checkouts. It never modifies the original study or reconstructs losers.

The initial run found 885 distinct projected profiles among 1,000 winners: 115 collision groups involving 230 recipes. The winner library also lacks independent validation/test partitions and reviewed training-rights metadata. These gaps block training readiness, not ordinary use of the recipe guides as ideas.

The report retains numerical descriptors for inspection, rejects using this incomplete projection as a universal style distance, and rejects using the single-source winner collection as an independent benchmark. Collision counts describe numerical projection ambiguity, not perceptual similarity or dissimilarity. These are engineering decisions, not results from human experiments.

Validation for this pass: `npm test` passed all 39 tests, including the 10 new language tests. The runnable example and deterministic diagnostic report also completed. Both existing Dazzler GDC tests passed, including verification of vendored bytes against their recorded provenance. Browser/site tests were not rerun because neither the HTML adapter nor the site changed. No downstream consumer was upgraded.

## Next Research Gates

Proceed in order, keeping every experiment tied to a feature decision:

1. **Grammar transfer:** implement two independently tested native-medium adapters. Compare declared-relation preservation with native reference artifacts. Extend only relations whose instruments survive the comparison; otherwise narrow the relation or adapter. No claim of perceptual transfer from serialization alone.
2. **Perceptual retrieval:** establish a rights-reviewed rendered corpus with held-out content, brands and templates. Compare token matching with a proposed learned representation. Measure style retrieval separately from content recognition. Retain the representation only if it improves the declared target; otherwise remove the extra model stage.
3. **Contextual selection:** compare exact matching with learned contextual matching on reviewed, held-out briefs. Measure relevance and constraint violations separately. Retain learned matching only if it improves relevance without unacceptable violations; otherwise keep explicit labels.
4. **Intervention effects:** finish preregistration for a concrete spacing or hierarchy intervention, including participants, consent, estimand, meaningful effect, budget and stopping rule. Promote or narrow a scoped rule if supported; reject the default if refuted. No participant collection before approval.
5. **Model learning:** choose a cleared corpus and fixed held-out tasks before training. Compare a small trained model against existing-model and nearest-recipe baselines at a declared compute budget. Keep the training path only if it improves a stated task under the frozen evaluation; otherwise reject that model configuration.

Thresholds, sample sizes, training costs and human-study budgets are not fabricated here. These experiments remain unrun until those decisions and required approvals are complete. External dataset downloads, new training expenditure and participant recruitment are separate approval gates. No additional Jev run is needed to settle the deterministic checks in this pass.

## Research Sources

Sources consulted October 7, 2026. They motivate the direction; their results are not automatically transferable to GDC.

- [Vega-Lite](https://idl.uw.edu/papers/vega-lite): a compositional grammar for visual encoding and interaction in visualization. Inspiration for a declarative relationship layer, not proof of a universal design grammar.
- [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/): stable Community Group token reports, not a W3C Recommendation. Keep token interchange outside this experimental grammar.
- [Oklab](https://bottosson.github.io/posts/oklab/): color representation and published conversion matrices. The author offers conversion code in the public domain and alternatively under MIT. This implementation uses the public-domain offering and preserves attribution here and in source.
- [CLIP](https://arxiv.org/abs/2103.00020): transferable image/text representations. Motivation for multimodal learning, not a validated style embedding.
- [Website complexity and prototypicality](https://research.google/pubs/the-role-of-visual-complexity-and-prototypicality-regarding-first-impression-of-websites-working-towards-understanding-aesthetic-judgments/): evidence for studying contextual aesthetic dimensions, not a universal simplicity rule.
- [Draco](https://idl.uw.edu/papers/draco): executable design constraints in visualization. Its domain findings have not been imported as general-purpose rules.
- [DoWhy](https://arxiv.org/abs/2011.04216): explicit assumptions, identification, estimation and robustness checks for causal analysis. This pass adds no estimator or DoWhy dependency.
- [UICrit](https://github.com/google-research-datasets/uicrit): a candidate source of interface critiques and ratings. No records downloaded, rights cleared, or training use approved here.
- [LayoutTransformer](https://openaccess.thecvf.com/content/ICCV2021/papers/Gupta_LayoutTransformer_Layout_Generation_and_Completion_With_Self-Attention_ICCV_2021_paper.pdf): learning contextual layout relationships. No model architecture or weights imported.

No external study text, screenshots or datasets are redistributed by this pass. The foundation remains an inspectable language and contract library that any host can implement.
