# Design Principles

Apply these defaults automatically when establishing a direction. Existing project records, user choices, language and brand rules take precedence. A small edit does not justify redesigning the surrounding project.

1. **Make the next action clear.** Give the page one primary decision and use labels that describe its consequence. Review hierarchy and actual interaction; decoration is not a substitute for usefulness.
2. **Fit the stakes.** Push a distinctive, committed voice across industries. High stakes require accurate, legible information, not an automatic reserved aesthetic. A basic professional request constrains the visual vocabulary, not the ambition: maximize typographic precision, proportion and editorial character. Explain the selected tone in the design record; explicit choices win.
3. **Make reading comfortable.** Use a maximum 60ch body measure, never a fixed width. Paragraphs, prose lists, quotations, captions and descriptions inherit it. Headings, tables, code, navigation and layout containers are exempt. Narrow screens must reflow. Word uses an approximate measure and requires rendered review.
4. **Make headings recognizable.** Default to protected English Title Case. Preserve acronyms, mixed-case brands, code, URLs, quoted material, units and names. Other languages retain authored casing. Buttons, body copy, table labels and eyebrow text are not headings. Sentence case and preservation are valid project overrides.
5. **Build a visible hierarchy.** Use meaningful type roles, real weights and genuine italics. Prefer selective emphasis over all-over emphasis. Fluid screen sizes need stable print fallbacks and readable body text at every endpoint.
6. **Use a grid to organize relationships.** Align related elements and repeat a coherent spacing rhythm. The optional grid has 4/8/12 columns with spacing-derived gutters. Existing framework grids and intentional freeform composition remain valid; do not force a global `.grid` class or grid every paragraph.
7. **Give color a job.** Separate brand seeds from functional foreground/background roles. Measure WCAG 2 contrast ratios: normal text 4.5:1, large text 3:1 and essential graphics 3:1. An optional AAA text target uses 7:1 and 4.5:1. Harmony and simulation do not establish conformance.
8. **Make risk unmistakable.** Use the red danger role with a readable `onDanger` foreground, a clear label and an appropriate confirmation or undo. For a red brand, review distinction through icons, wording and placement. Never silently change a locked brand color or rely on red alone.
9. **Use fonts you can actually deliver.** Select shipped open fonts by text coverage, style, numeric features and budget. User-licensed fonts stay project-local, with an explicit declaration and measured metadata. A declaration is not proof of redistribution or embedding permission. Preserve notices and useful fallbacks.
10. **Make controls usable beyond the mouse.** Use semantic controls, accessible names, visible focus and sensible touch targets. Test keyboard use and error recovery. A target-size candidate needs exception review; an automated screenshot cannot establish accessibility.
11. **Show honest evidence.** Keep source values, units, missing data and uncertainty in charts and documents. Label synthetic demonstrations. Preserve a data table or text equivalent where appropriate; never improve the story by changing the data.
12. **Verify and remember decisions.** Inspect the finished narrow/wide or printed artifact, not just source code. Save accepted tokens and overrides so the next session can continue them. Distinguish tested behavior, review candidates and unavailable host checks.

The [art-direction standard](art-direction.md) applies these same principles with maximum coherent character. It does not replace their typography, color, composition, evidence or usability constraints, and it introduces no parallel theme system.

## Controls and Helpers

Reserved treatment still needs deliberate typography, surfaces, layout and emphasis. Follow [document design](document-design.md) for authored documents and [final artifact gates](delivery-gates.md) for every delivery, including custom exporters. Heading case is a Dazzler delivery requirement unless explicitly overridden; it is not an accessibility conformance test.

The token helper defaults to schema 3. Explicit schema 1/2 records retain their established output. `studio.mjs tokens` accepts `tone: "auto" | "expressive" | "reserved"`, bounded `context`, `measure: 30..100`, and `typography: {headingCase: "title" | "sentence" | "upper" | "preserve", lang: "en", preserve: ["eBay"]}`. `route.mjs` reports the same tone decision. Saved schema-3 configurations resume the chosen policy.

`headings.py` and `headings.mjs` share rules and test vectors. This is a conservative AP-like helper, not a complete grammatical implementation of a style manual. Existing capitals are retained; `sentence` preserves authored text rather than guessing proper nouns. Prefer authored source headings over CSS `text-transform: capitalize`.

Color configuration accepts `target: "AA" | "AAA"`. Unresolved locked pairs remain unresolved and cannot be exported as validated CSS. Browser reports keep AAA informational and do not use APCA as a pass/fail substitute. Body measure, heading case and target geometry are review suggestions, not WCAG failures. Measurements retain node identifiers and counts, not heading/body text.

To use an authorized local font collection:

```sh
python scripts/fonts.py import-local --src SOURCE --dest PROJECT/fonts --license "User-declared license" --license-file LICENSE.txt
python scripts/fonts.py recommend --role body --text "Actual copy" --user-fonts PROJECT/fonts/user-fonts.json
```

Import supports bounded TTF/OTF/WOFF metadata and rejects WOFF2/TTC with an actionable conversion message. It copies only into a new project directory, writes notices and a Git ignore, and never installs OS fonts. Coverage is measured from Unicode cmaps; shaping, variable axes and OpenType features require separate inspection. Unsupported features are not assumed. Do not move private project font files into the skill. Package builds reject private manifests and unreviewed font binaries.

## Enforcement Boundaries

| Rule | Current enforcement |
| --- | --- |
| Tone, body measure, grid, heading policy | Deterministic token defaults, route evidence, persisted configuration and template generation |
| Heading protection | Shared Python/Node rules and a final DOCX/PPTX/HTML/Markdown/inventory audit; unsupported or nonsemantic headings require rendered comparison |
| Color roles and locks | Numeric role-pair checks; explicit unresolved state; non-color review guidance |
| Font licensing and coverage | Bundled license/hash gate; bounded local import; cmap coverage filter |
| Reading width, target size, heading style | Bounded browser review candidates with exceptions; not automatic certification |
| Hierarchy, intent, usability and print | Human/agent rendered review plus relevant interaction tests; no aesthetic scoring claim |

## Notes

These are Dazzler's configurable product defaults. Research and issue reconciliation are maintained outside the installable skill; no external source needs to be fetched during invocation.
