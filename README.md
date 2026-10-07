# Generative Design Canvas — GDC-0

Style Science is a research program. GDC-0 is an engineering prototype: portable design knowledge and executable constraint checks, consumed by JavaScript or Python. It is not a trained generator, a universal design graph or a validated quality model.

Copy this directory to another project. No Dazzler installation, prompt, rendered examples, network request or third-party runtime dependency is needed for the verification engines. Node 22+ or Python 3.10+ is sufficient. The optional browser adapter accepts a host-supplied Playwright Page; React, Vue and other frontend stacks retain their own implementation and render normally.

## Run

```shell
node engine.mjs examples/plan.json snapshots.json
python gdc.py examples/plan.json snapshots.json
node --test test.mjs
```

Exit 0 means every declared check passed; 2 means a failure or unknown; 1 means invalid input. The tests require both language runtimes. `GDC_PYTHON` selects a Python executable.

JavaScript consumers import `verify`, `filterCandidates`, `validatePlan`, `fingerprint` and `contrast` from `engine.mjs`. Python consumers use the corresponding snake_case functions from `gdc.py`. This is interoperability of reference consumers, not an independently authored host adoption study.

For rendered collection, import `capture` from `html.mjs`. Set the host Page viewport and color scheme to each declared environment, load the local artifact, exercise the relevant state, then call `capture(page, plan, environmentId)`. Capture after fonts and application content settle. Each distinct interaction state needs its own declared environment ID and capture. The adapter records actual dimensions/theme and never substitutes the requested values. Host navigation and application code remain outside the verifier's trust boundary.

## Operational mathematics

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

## Evolution and evaluation

Each executable entry names its measurement, scope, evidence class, limitations, tests and version. Changes require fixtures, a version change and an explicit effect on prior outputs. Relations are links between knowledge entries, not a universal graph for every medium. See `evaluation/protocol.json`: research enrollment is blocked until the analysis, practical effect, power analysis, budgets and reviewer sampling are preregistered. No human study has been run.

## Notes and credits

Original implementation: Apache-2.0; see LICENSE. Imported Dazzler references retain their existing credits and license files. Foundations include [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/), [DESIGN.md](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md), and [Draco 2](https://arxiv.org/abs/2308.14247). These sources do not endorse GDC-0 or establish its quality benefit.
