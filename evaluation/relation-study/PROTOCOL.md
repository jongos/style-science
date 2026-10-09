# Rendered Relationship Study

Engineering protocol, October 7, 2026. Written before this study's browser runs. These are authored counterexample fixtures, not a human study, random sample, or aesthetic evaluation. No Jev judgment is needed to determine DOM structure or rectangle arithmetic.

## Questions and Decisions

| Hypothesis | Intervention and Observation | If Supported within Fixtures | If Refuted |
| --- | --- | --- | --- |
| DOM parenthood is sufficient for border-box containment | Move an absolutely positioned child outside its unchanged parent; compare parent identity and measured bounds | Keep parenthood as a limited fixture-level shortcut pending broader testing | Reject the alias; expose separate DOM-parent and box-containment instruments |
| DOM precedence is sufficient for vertical separation in the same order | Reverse a flex column without changing DOM order; compare document position and signed vertical gap | Keep DOM precedence as a limited fixture-level shortcut pending broader testing | Reject the alias; expose separate DOM-order and directional box instruments |
| Scope and freshness gates prevent unsupported evidence from becoming a passing measurement | Change the viewport, selector binding, design revision, or supported geometry assumptions | Retain the gates | Fix the demonstrated gate and add its fixture before shipping |

No result promotes a universal reading-order or perception rule. Passing a geometric predicate means only that the captured boxes satisfy that predicate.

## Inputs and Budget

Only original synthetic HTML authored in this repository. No external URLs, fonts, scripts, images, screenshots or datasets are loaded. Use the host's installed Playwright and Chromium; do not install or purchase services. Test both 390 x 844 and 1280 x 900 CSS-pixel viewports in light and dark color-scheme environments. Use fixed CSS geometry and system fonts; text content is not the oracle.

The bounded initial set covers normal flow, a displaced child, reversed visual order, a wrapper between mapped parent and child, transforms, hidden elements, duplicate selectors, absent selectors, invalid selectors, selector aliasing, and unsupported semantic grouping/emphasis. A small deterministic translation/scale sweep checks geometry invariance. Additional regression fixtures may be added when implementation failures reveal missing coverage; identify them as such, not unseen holdouts.

## Instruments

- Direct DOM-parent identity, not visual containment.
- DOM precedence for distinct non-nested elements, not assistive-technology order or semantic correctness.
- Signed axis-aligned border-box containment clearance in CSS pixels.
- Signed vertical, left-to-right horizontal, or right-to-left horizontal separation in CSS pixels.
- Actual viewport and color scheme, declared artifact revision and exact plan/design fingerprints.

Unknown, ambiguous, missing, stale or unsupported observations never pass. No instrument for perceived emphasis or grouping is claimed. No default size or distance threshold is inferred for those concepts.

## Outputs and Stop Rule

Retain source fixtures, tests and an aggregate report with implementation/fixture hashes, runtime versions, conditions, assertion counts and feature decisions. A fixture mismatch fails the run; never delete the mismatch to inflate results. This is a regression suite, so defective synthetic fixtures may remain as tests; no discarded recipe from the winner study is reconstructed or archived.

Keep optional screenshots of original fixtures under ignored `dist/` for inspection, not as a website archive. Complete the pass when the bounded suite, dependency-free tests and cross-language parity pass, or report a concrete runtime blocker. Do not train a model, recruit people, download a dataset, publish or upgrade downstream Dazzler in this pass.
