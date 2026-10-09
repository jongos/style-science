# A Relationship Is Not Its Measurement

Move a title outside its container. It can still be the container's child in the document tree. Reverse a column with CSS. Its title can still come first in the source, even though it appears last on screen.

These are small examples of a larger problem for a design model: the same word can hide several different claims. "Inside" may describe ownership, geometry or perceived grouping. "Before" may mean source order, spatial order or the sequence that makes sense to a reader.

This pass gives GDC separate, named instruments for the claims we can measure. It does not let a convenient number stand in for the whole meaning of a relationship.

## What Changed

The dependency-free [JavaScript](../relation-measures.mjs) and [Python](../relation_measures.py) consumers evaluate six declared predicates. The optional [HTML collector](../relation-html.mjs) records the DOM and border-box observations from a host-supplied Playwright Page. It does not launch, navigate, install, generate designs or call a model.

| Instrument | Measurement | Passing Boundary |
| --- | --- | --- |
| `dom-parent` | Whether the mapped target's immediate DOM parent is the mapped source | Boolean true |
| `dom-before` | Whether the target follows the source in DOM traversal, excluding nested or disconnected endpoints | Boolean true |
| `box-contains` | Minimum signed clearance between the source border box and target border box | At least 0 CSS px |
| `y-before` | Target top minus source bottom | At least 0 CSS px |
| `x-before` | Target left minus source right | At least 0 CSS px |
| `x-after` | Source left minus target right | At least 0 CSS px |

Zero means touching boundaries, not good spacing. Negative separation means those intervals overlap in the declared direction, not necessarily that the painted elements overlap. For example, two boxes separated horizontally can overlap vertically.

For source A and target B, containment clearance is:

```text
min(B.left - A.left,
    B.top - A.top,
    A.right - B.right,
    A.bottom - B.bottom)
```

The geometry is unchanged under common translation, and its signed distances scale by a common positive scale factor. The tests check these properties in both arithmetic and rendered fixtures. The coordinates are CSS border-box extents, not glyph outlines, painted regions, attention or perceptual similarity.

## Declare the Instrument

A relation measurement plan has `schemaVersion: 1`, `id`, `designHash`, `bindings`, `environments` and `requirements`. Every design node has exactly one selector binding. Every requirement names an ID, a declared relation and a supported instrument. `contains` accepts the two containment instruments; `precedes` accepts the four order instruments. Grouping and emphasis have no validated instrument in this pass.

The plan hash binds selectors, instruments, expected environments and the design hash. A snapshot records that hash, design revision, actual viewport/theme, adapter and renderer. Missing evidence, incorrect viewport/theme, stale hashes and malformed measurements cannot pass. Duplicate snapshots and malformed envelopes are rejected as invalid input.

```javascript
import { captureRelationMeasures } from './relation-html.mjs';
import { verifyRelationMeasures } from './relation-measures.mjs';

// Host loads its artifact, settles application state, and sets each environment.
const snapshots = [];
for (const env of plan.environments) {
  await page.setViewportSize({ width: env.width, height: env.height });
  await page.emulateMedia({ colorScheme: env.colorScheme });
  snapshots.push(await captureRelationMeasures(page, design, plan, env.id));
}
const report = verifyRelationMeasures(design, plan, snapshots);
```

```python
from relation_measures import verify_relation_measures
report = verify_relation_measures(design, plan, snapshots)
```

The Python consumer accepts the same JSON observations. It does not need Playwright to verify them. Both snippets assume the host has loaded its own design and plan; the Python snippet also assumes captured snapshots. See [the synthetic fixture plan](relation-study/fixtures.mjs) for a complete example.

The host remains responsible for loading the artifact corresponding to the declared revision and capturing each relevant interaction state. Hashes prevent accidental mixing, not dishonest measurements. The collector clones declarations before awaiting browser work, so caller-side edits cannot silently relabel an in-flight capture.

## What Passing Means

The report's `status` refers only to the declared measurement predicates in all declared environments. It always returns `semanticStatus: not-assessed` and `automaticSelection: false`. It also lists `unprobedRelations` so unmeasured relationships do not disappear.

Do not feed a successful `y-before` check into the earlier `assessRelations` API as proof of meaningful reading order. Do not interpret DOM parenthood as perceived grouping. Keep these measurement reports beside the relationship declaration and other evidence, and continue to run the host's feasibility checks. There is no new candidate selector or accessibility certification.

The HTML collector accepts unique HTML elements in the document's light DOM. Aliased bindings, absent/duplicate matches and invalid selectors yield unknown observations for affected measurements. Geometry currently excludes zero or fragmented boxes, hidden elements, transforms and CSS zoom. DOM instruments still report DOM facts when a box is hidden or transformed. Unsupported SVG, shadow-tree and native document capture are not approximated.

Paint clipping, occlusion, scrolling into view, assistive-technology order, focus order, dynamic-state stability and perceived salience are not measured. The collector waits for fonts but does not freeze application scripts or animation. Hosts must control capture state. It does not prove that all text is readable or all nodes are visible.

## Results and Decisions

[The protocol](relation-study/PROTOCOL.md) was written before browser execution. [The report](relation-study/report.json) records implementation hashes, runtime versions, predicates and observed values. [The runner](relation-study/run.mjs) regenerates it using only original synthetic HTML with network requests blocked.

The initial completed run used Chromium 153.0.8010.12 on Windows. Eleven fixture families ran in four environments: mobile/desktop crossed with light/dark. Six translation/scale conditions, five evidence-scope conditions and two horizontal-direction conditions brought the total to 57 rendered pages. All 319 study assertions passed, and 24 report comparisons agreed between JavaScript and Python.

| Proposed Shortcut | Counterexample | Feature Decision |
| --- | --- | --- |
| DOM parent means visual containment | An absolutely positioned child keeps its parent but leaves its border box | Reject the shortcut; retain separate containment predicates |
| DOM order means visual order | A reversed flex column keeps its DOM sequence | Reject the shortcut; retain separate order predicates |
| Parent mismatch means geometric containment fails | An extra wrapper changes immediate parenthood without moving the boxes | Keep immediate parenthood and containment separate in both directions |
| Numeric predicates can certify emphasis/grouping | No perceptual instrument exists in this pass | Do not implement automatic certification; retain explicit unprobed relationships |

The last row is a scope decision, not an experimental finding about perception. The other cases refute the stated universal shortcuts; they do not measure how often those shortcuts fail on the web. Repeated viewport/theme conditions are correlated regression checks, not independent human observations. Fixture expectations were authored alongside the suite, not blinded research labels.

The dependency-free suite now passes 45 tests, including a check that the saved study report matches its implementation and fixture hashes. Both optional browser tests pass, including the original HTML verifier and the new rendered relation study. The existing winner-only dataset is unchanged. No model training, participant collection, paid inference or downstream upgrade was performed.

## Reproduce

With the repository's documented development-only Playwright setup:

```shell
npm test
npm run test:browser
node evaluation/relation-study/run.mjs
```

Alternatively set `GDC_PLAYWRIGHT_MODULE` to a host-provided Playwright module. If the browser cache is outside the current execution environment, set Playwright's `PLAYWRIGHT_BROWSERS_PATH` to an existing installed cache; the collector itself installs nothing.

The standalone runner writes the aggregate report and six inspection screenshots under ignored `dist/relation-evidence/`. Screenshots show deliberately broken as well as normal synthetic fixtures. They are not external website archives or rejected recipe records. The browser test reruns the study without saving screenshots or changing the tracked report. CI's browser job now includes this suite.

## Sources and Next Steps

- [W3C Meaningful Sequence](https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence) distinguishes meaningful sequence from a universal ordering of every element; more than one sequence can be appropriate.
- [W3C Technique C27](https://www.w3.org/WAI/WCAG21/Techniques/css/C27) discusses matching source and visual ordering. It is a technique, not a claim that any one geometric test establishes WCAG conformance.
- [MDN document position](https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition) documents the DOM bitmask used by the collector.
- [MDN bounding rectangles](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) documents viewport-relative border-box bounds. Neither API measures perception.

Next, test a second native medium with its own semantics, or investigate a perceptual instrument against independently reviewed labels. Do not infer either capability from this Chromium pass. [The dataset review](DATASETS.md) records why a publicly downloadable annotation file is not automatically a cleared screenshot corpus.
