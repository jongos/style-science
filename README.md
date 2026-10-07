# Style Science

**Design deserves better questions.**

We can generate a thousand designs. How do we explain the choices behind them, check that they meet the brief, and learn which ideas are worth carrying forward?

Style Science is a research program making design knowledge explicit: something we can examine, test, share and improve. The ambition is to help machines work with the reasons behind a design while leaving room for character, context and human judgment.

[Read the manifesto](https://jongos.github.io/style-science/) · [Try the prototype](#try-it) · [Explore the knowledge](knowledge/README.md) · [Contribute](#help-shape-the-work)

## From principles to working tools

A type size establishes importance. A distance separates or connects. A color directs attention. Style Science asks how those decisions can become knowledge that travels between tools without making every result look the same.

Three commitments guide the work:

- **Give decisions a reason.** Make assumptions and relationships clear enough to question and improve.
- **Measure what you can defend.** Check concrete requirements, record uncertainty, and keep aesthetic judgment in the review process.
- **Judge the thing people receive.** Inspect the rendered page, document or interface in the conditions where it will be used.

The first working prototype is **Generative Design Canvas (GDC-0)**: portable design knowledge and executable constraint checks for JavaScript and Python. It gives design agents and application developers a way to ask, "Does this candidate satisfy the requirements we declared?"

For example, a brief might require a heading to appear on desktop and mobile, meet a specified contrast ratio, retain a particular color, and avoid horizontal page overflow. GDC-0 evaluates those declared requirements against captured observations and reports **pass**, **fail** or **unknown**.

| Available today | What it provides |
| --- | --- |
| Four HTML constraint checks | Document overflow, declared text visibility, text contrast and computed-style equality |
| JavaScript and Python engines | Dependency-free verification with interoperable reference consumers |
| Optional browser adapter | Observation capture from a host-supplied Playwright Page |
| Portable knowledge library | Preserved reference material, provenance and a smaller registry of scoped entries |
| Candidate filtering | Candidates whose declared checks all pass, ready for human review |
| Mathematical outcome canvas | Bounded effects by metric and environment, with explicit unknowns and preserved tradeoffs |

GDC-0 is an early engineering prototype. It is not a trained generator or a validated model of design quality. No human study has been run. Its current value is a concrete, inspectable starting point for testing requirements and developing the research.

## Try it

Clone the repository and enter its directory:

```shell
git clone https://github.com/jongos/style-science.git
cd style-science
```

The verification engines need **Node.js 22+** or **Python 3.10+**, with no third-party runtime dependencies. The test suite uses both runtimes:

Node 22 is the supported and CI-tested minimum, not a claim that every core API requires it. Older releases may run parts of the package but are outside the support contract. The suite discovers `python`, then `python3`, and requires version 3.10 or newer. `GDC_PYTHON` overrides discovery with an explicit executable path; a broken override fails clearly.

```shell
npm test
```

For a small JavaScript example, calculate a contrast ratio directly:

```shell
node --input-type=module -e "import { contrast } from './engine.mjs'; console.log(contrast('#000000', '#ffffff'));"
```

This prints `21`, the contrast ratio of black and white. Next, open the [example plan](examples/plan.json) to see how requirements and desktop/mobile environments are declared.

### Optional browser and site tests

From the repository root, install the same development-only dependencies as CI:

```shell
npm install --no-save --ignore-scripts --package-lock=false playwright@1.63.0 axe-core@4.13.0
npx playwright install chromium
npm run test:browser
npm run test:site
```

On Linux, use `npx playwright install --with-deps chromium` if browser system libraries are missing. `test:site` builds the site before checking it and writes screenshots and its report to `dist/site-evidence/`. These dependencies are not required by either verification engine. Hosts supplying their own Playwright can set `GDC_PLAYWRIGHT_MODULE` for adapter tests or `PLAYWRIGHT_MODULE` for site tests; site tests also need a locally resolvable `axe-core` package.

### Verify a rendered design

1. Declare the environments and requirements in a plan, using the example as a starting point.
2. Render your artifact and collect observations for each environment with the browser adapter described below.
3. Save the collected snapshots as a JSON array in `snapshots.json`, then run either engine:

```shell
node engine.mjs examples/plan.json snapshots.json
python gdc.py examples/plan.json snapshots.json
```

`snapshots.json` is your capture output; it is not a bundled fixture. Exit `0` means every declared check passed; `2` means a failure or unknown; `1` means invalid input. Set `GDC_PYTHON` to select a Python executable for the test suite.

### Integrate with your tools

Copy this repository directory into another project to use the core locally. No Dazzler installation, prompt, rendered examples or network request is needed for verification. React, Vue and other frontend stacks retain their own implementation and render normally.

JavaScript consumers import `verify`, `filterCandidates`, `validatePlan`, `fingerprint` and `contrast` from `engine.mjs`. Python consumers use the corresponding snake_case functions from `gdc.py`. This is interoperability of reference consumers, not an independently authored host adoption study.

For rendered collection, import `capture` from `html.mjs`. Set the host Page viewport and color scheme to each declared environment, load the local artifact, exercise the relevant state, then call `capture(page, plan, environmentId)`. Capture after fonts and application content settle. Each distinct interaction state needs its own declared environment ID and capture. The adapter records actual dimensions/theme and never substitutes the requested values. Host navigation and application code remain outside the verifier's trust boundary.

## Contextual decisions and research

The [Contextual Design Science thesis](evaluation/THESIS.md) develops a mathematical direction for the project: feasible designs, task-specific outcome vectors and falsifiable intervention effects. An exploratory Jev pass produced 60 judgments across 30 synthetic scenarios. Two of the 15 scenarios checked under three option presentations changed their winning answer. These are observations of model behavior, not evidence of improved design quality.

The optional [JavaScript decision module](decision.mjs) and [Python counterpart](decision.py) incorporate those findings. They require explicit context, normalize reordered and relabeled options, preserve abstention, and flag unstable advice. `reviewCandidate` (Python: `review_candidate`) recomputes GDC feasibility first, so a model recommendation cannot override a failed or unknown measurement. The modules consume recorded observations without network access; they do not call Jev or rank aesthetics. See the [decision tests](decision.test.mjs) for executable contract examples and [saved analysis](evaluation/jev-pass-2026-10-07/analysis.json) for the evidence.

Decision module 0.2.0 separates advice from release evidence. Record `requestedModel`
(for example, `jev-latest`) separately from `resolvedModel` (`jev-1.13.0`). Legacy
`model` is used only when `resolvedModel` is absent, never when it is explicitly
null or empty. Reports retain per-variant `modelIdentities`. The closed pinning
policy accepts exact `jev-MAJOR.MINOR.PATCH` identities with no leading zeroes or
suffixes, or `sha256:` followed by 64 lowercase hex characters. Other provider
identity formats remain unpinned until a reviewed policy extension.

Aliases, including `jev-latest` and `jev-preview`, may still produce exploratory
`advisory` results, but have `modelIdentityStatus: "unpinned"`,
`evidenceScope: "exploratory"` and `releaseEligible: false`. Missing resolutions
return `needs-model`; mixed resolutions return `model-mismatch`. Only a pinned,
stable substantive advisory passes this narrow gate. Consumers must check
`releaseEligible`, not just `status`. Candidate releases must also use
`reviewCandidate` to require measured feasibility. Neither field authorizes a
release: host review and other evidence requirements remain necessary. An offline
identity check cannot authenticate a provider response or prove that a provider
never reuses a version label. Model agreement is not evidence of aesthetic quality.

Portable release ZIPs now use an [explicit committed manifest](PACKAGING.md).
Dirty working files and unfinished research cannot enter an archive implicitly.

Run the full verification and decision suite with `npm test`. Future hypothesis runs must name the feature they will improve, remove or reject under either result.

### Compare design outcomes

The [mathematical canvas](evaluation/CANVAS.md) compares baseline and candidate measurements using explicit units, instruments, context, artifact revisions and meaningful-effect thresholds. It reports improved, worsened, negligible, inconclusive or unknown for each outcome. It preserves tradeoffs and blocks infeasible candidates without assigning a universal style score.

```shell
node examples/canvas.mjs
```

This synthetic example shows a design becoming faster while producing more errors. JavaScript and Python consumers share the same contract. A further 36 Jev judgments informed the semantic boundaries; deterministic tests independently check the arithmetic. The canvas also checks that proposed experiments have a concrete feature decision under either outcome. See the [canvas research record](evaluation/CANVAS.md) for limits and the feature that was rejected.

## How verification works

The technical contract below defines what a passing result actually establishes. Keep these limits alongside any reported results.

### Measurements

- Overflow: `max(0, scrollWidth - clientWidth)`, passing only at zero CSS pixels. This detects document horizontal overflow, not all local clipping or overlap.
- Contrast: normalized sRGB channels use `c/12.92` below/equal to 0.04045, otherwise `((c+0.055)/1.055)^2.4`; luminance is `0.2126R + 0.7152G + 0.0722B`; ratio is `(Ymax+0.05)/(Ymin+0.05)`. Compare unrounded values against the task's explicit threshold. This checks declared text/background pairs, not all accessibility requirements.
- Declared text: an identified element must have a nonzero layout box, visible style and nonzero ancestor opacity, and contain the whitespace-normalized required text. This does not establish absence of occlusion, clipping, offscreen positioning, semantic accuracy or correct reading order.
- Style lock: exact equality of a declared computed CSS property and expected value. This verifies a computed style, not pixel identity or successful loading of the intended font file.

Let each required check in each declared environment return pass, fail or unknown. A candidate is eligible only if all return pass. Any fail yields fail; otherwise any missing, stale, unsupported or malformed observation yields unknown. All-pass yields pass. Empty plans are rejected. No soft preference can compensate for a failed requirement.

Plan identity uses a canonical key-sorted JSON SHA-256. It prevents accidental mixing of revisions and environments, not fabricated evidence. Snapshots are untrusted observations supplied by a host; the package does not authenticate them. Report renderer/browser versions, artifact revision and capture paths with experiment records.

The HTML contrast adapter deliberately supports only visible leaf text with its own opaque solid background and no detected paint effects. Transparent/inherited backgrounds, gradients, nested content and effects return unknown. It does not infer full contrast coverage from a few successful samples. Do not relabel unknown as pass; use an appropriate external measurement or report the gap.

## Knowledge and boundaries

`knowledge/registry.json` contains operational entries, scoped hypotheses and links between capabilities. `knowledge/library/` preserves Dazzler's reference knowledge and attribution independently of its prompt and rendered examples. `knowledge/inventory.json` records source hashes and domains. Imported documents are **mixed, uncurated guidance**, not validated atomic scientific claims. Existing composition thresholds remain heuristics; catalog palettes remain references. The preservation inventory is not a claim that all Dazzler knowledge has been formalized.

Keep native medium representations. DTCG tokens and DESIGN.md remain interchange formats handled by existing consumers. Chart semantics should be evaluated through a separately tested Draco 2 adapter; none is installed or claimed here. DOCX pagination, slides, motion, semantic image evaluation and learned ranking remain outside GDC-0.

Generation and final aesthetic judgment stay with the host and reviewer. `filterCandidates` preserves the eligible input order without ranking it. Boldness, distinction and contextual voice remain deliberate review criteria. A numerical distance is not evidence of perceptual diversity. Candidate selection may be extended only with declared instruments and evaluation evidence.

## Help shape the work

Useful contributions begin with a concrete design question, a reproducible example, or a limitation you can demonstrate. Good places to start include:

- **Exercise the checks.** Bring a small rendered case that exposes a failure or an unsupported observation, with the expected result.
- **Refine a knowledge entry.** Give a claim a clear scope, source, measurement and counterexample.
- **Explore an adapter.** Preserve the target medium's semantics and define what evidence it can reliably supply.
- **Strengthen the research plan.** Help specify how a proposed benefit could be evaluated before collecting results.

[Open an issue](https://github.com/jongos/style-science/issues) to discuss a question or proposed change. Read the [maintenance guidance](AGENTS.md) for implementation boundaries and required checks, and the [changelog](CHANGELOG.md) for the project's development so far.

### Evolution and evaluation

Each executable entry names its measurement, scope, evidence class, limitations, tests and version. Changes require fixtures, a version change and an explicit effect on prior outputs. Relations are links between knowledge entries, not a universal graph for every medium. See `evaluation/protocol.json`: research enrollment is blocked until the analysis, practical effect, power analysis, budgets and reviewer sampling are preregistered. No human study has been run.

## Explore the repository

| Start here | For |
| --- | --- |
| [Manifesto source](site/manifesto.json) and [site design notes](DESIGN.md) | The project's principles and the rationale behind its public page |
| [JavaScript engine](engine.mjs) and [Python engine](gdc.py) | Verification, plan validation, fingerprints and candidate filtering |
| [HTML adapter](html.mjs) | Capturing observations from a rendered page |
| [Example plan](examples/plan.json) | A concrete desktop/mobile requirement set |
| [Knowledge guide](knowledge/README.md) and [registry](knowledge/registry.json) | Source provenance, operational entries and scoped hypotheses |
| [Evaluation protocol](evaluation/protocol.json) | Research status and prerequisites for a future study |

## License and credits

Original implementation: Apache-2.0; see LICENSE. Imported Dazzler references retain their existing credits and license files. Foundations include [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/), [DESIGN.md](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md), and [Draco 2](https://arxiv.org/abs/2308.14247). These sources do not endorse GDC-0 or establish its quality benefit.
