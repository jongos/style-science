# Dazzler studio workflows

For persistent records, fluid typography, safe token interchange and compatible theme proposals, follow [persistent systems](persistent-systems.md). Discover the existing project record before choosing a new direction.

Use only the tools relevant to the brief. These are internal agent commands, not steps the user must perform. Keep the normal experience to “Use Dazzler to …”. Resolve paths from the installed skill. Outputs belong in the authorized project or scratch directory, never in the installed skill. All `NEW_DIR` outputs must be new directories.

## Brand → system → deliverable → review

1. When extending a brand, read its rules and source tokens first. Import CSS or inspect the rendered reference; retain source evidence. Resolve conflicting declarations using the actual cascade, active theme and authoritative brand rules. Frequency alone does not establish a brand lock. Record only supported choices; do not invent logo or font usage rights.
2. Build a shared system from the accepted seed, role locks, fonts, scale and spacing. Keep existing component tokens where authoritative. Use the same system in the interface, charts, report or slides.
3. Select licensed assets and font pairings for the subject. A bundled library is an option, not a mandatory visual style.
4. Implement, then inspect and stress-test applicable areas. Review findings before changing source; automated heuristics can flag intentional scrolling or clipping. Make concrete fixes and recheck.
5. If the user asks to compare a refinement, render before/after and explain token/component changes. Apply an authorized change directly; do not create an extra approval gate. Preserve the ability to revert only the intended file and reject stale plans.

## 1. Brand importer

```shell
python scripts/project.py brand /project/styles --out /project/brand-observations.json
node scripts/browser.cjs brand https://example.com /project/brand-rendered
```

The CSS importer records property values, source lines and conflicting custom properties. It does not evaluate selectors/media queries. The browser importer records computed font/color/spacing/radius evidence at wide and narrow widths. It does not crawl or copy remote assets.

Normalize accepted observations into a token input such as:

```json
{"brand":{"source":"brand-observations.json","seed":"#345678","fonts":{"body":"Work Sans","heading":"Young Serif"},"locks":{"light":{"brand":"#345678"},"dark":{"brand":"#345678"}}},"spacing":{"4":1},"radius":{"medium":0.5}}
```

Resolve this internally from project evidence; ask only when hard brand requirements genuinely conflict. Record assumptions and uncertain font identification.

## 2. Design-token generator

```shell
node scripts/studio.mjs tokens --config system-input.json --out NEW_DIR
```

Outputs `design-system.json`, `tokens.css`, `tokens.dtcg.json`, `tailwind.config.cjs` (v3-style config), and `tailwind-theme.css` (v4 theme aliases). Import the CSS before consuming variable aliases. Defaults cover type scale, spacing, radius, elevation, durations/easing and measured light/dark colors. `baseSize` is pixels, `typeRatio` is a multiplier, `spacing`/`radius` overrides are rem, and motion durations are milliseconds. Explicit `colors` uses the existing color-helper schema; when provided it takes precedence over `brand.seed`/`brand.locks`, so copy required locks into it.

The DTCG file exports supported color, dimension, duration and font-family primitives, not every composite type. References: DTCG 2025.10 and Tailwind theme variables. Review integration against the project's actual framework version. Font names alone are not font installation or license evidence.

## 3. Rendered design inspector

```shell
node scripts/browser.cjs inspect /project/index.html NEW_DIR
```

Produces JSON/HTML reports and screenshots at 1440px and 390px. Checks include overflow candidates, broken images, missing alt/labels/name candidates, clipped content, text contrast on simple opaque backgrounds, font-load status and a programmatic focus probe. Gradients, alpha, imagery and complex backgrounds are marked not checked. Focus probing is not full keyboard-order, screen-reader or accessibility certification. Inspect the screenshots and relevant states yourself.

## 4. Content stress tests

```shell
node scripts/browser.cjs stress /project/index.html NEW_DIR stress-config.json
```

Optional configuration: `{"widths":[1440,390,320],"selectors":{"text":".customer-name","number":".total","data":".results","error":".save-error"}}`.

Scenarios cover long text, large numbers, missing images, empty data and errors. Defaults recognize `data-dazzler-stress="text|number|data|error"`; headings/buttons/labels are used for long-text fallback. Missing targets are not applicable, not passing tests. Each scenario reloads the original page. Changes affect only the test DOM. They do not simulate actual server state, prove validation/recovery, or modify source. Test real interactions separately.

## 5. Font pairing and performance lab

First shortlist/export actual font files with `fonts.py`. Then:

```shell
node scripts/browser.cjs fontlab font-pairs.json NEW_DIR
```

Input: `{"heading":"Actual headline","body":"Actual body copy","pairs":[{"name":"Editorial","heading":{"family":"Young Serif","weight":400,"css":"/exports/young-serif/fonts.css"},"body":{"family":"Work Sans","weight":400,"css":"/exports/work-sans/fonts.css"}}]}`.

Use 1–6 pairs. The lab requires exported folders with `selection.json`, copies their fonts/notices, renders actual copy, and reports fallback versus final block geometry, overflow, file bytes, font status and local load time. This is not network benchmarking or Core Web Vitals CLS. Choose the best contextual pairing rather than the smallest number.

## 6. Chart styling

For actual data rendering, follow [the visualization adapters](visualization.md): Vega/Vega-Lite, selected D3 layouts, Microcharts React output and optional mschart Office export. The palette command below remains useful for shared color decisions.

```shell
node scripts/studio.mjs chart --config chart-input.json --out NEW_DIR
```

Input: `{"kind":"categorical","count":5,"background":"#FFFFFF","ids":["a","b","c","d","e"],"labels":["Arts","Books","Classes","Events","Other"]}`. Kinds: categorical, sequential, diverging; 2–8 entries. Outputs measured graphic colors, stable IDs, marker/dash cues, pattern identifiers, pairwise OKLab diagnostics, and an illustrative SVG/table preview. Preserve IDs/order across themes and regenerate colors per actual background. Integrate actual values and direct labels/table equivalents. Passing 3:1 graphic contrast is not small-text conformance or proof of color-vision distinguishability.

## 7. Icons and illustrations

Read `asset-catalog.json`: 12 original outline icons and three original geometric illustrations, with tags, dimensions, usage guidance, licenses and hashes.

```shell
python scripts/project.py assets --kind icon --mood practical --ids search check --out NEW_DIR
```

Use `--kind illustration` for illustrations. Export keeps attribution/license files. Prefer existing brand artwork when appropriate; never insert arbitrary icons just to fill space. Name meaningful controls, hide decoration, and set the settings icon's `--icon-surface` to its actual background.

## 8. Change previews and reversal

```shell
node scripts/browser.cjs compare compare.json NEW_PREVIEW
python scripts/project.py plan --root /project --file styles.css --proposed /scratch/styles.css --out NEW_PLAN
python scripts/project.py apply NEW_PLAN
python scripts/project.py revert NEW_PLAN
```

Comparison config: `{"before":"/before/index.html","after":"/after/index.html","reason":"Warmer surfaces; same layout","width":1280}`. The visual preview does not write source. A change plan stores an escaped text diff, old/new content, and checksums. Apply/revert is atomic for one UTF-8 file, stays inside the declared root and refuses intervening edits or tampered preview content. Use project Git workflows for coordinated multi-file changes. Do not expose local before/after files or private content in public releases.

## 9. Documents and slides

```shell
python scripts/project.py export --content content.json --system design-system.json --format document --out brief.html
python scripts/project.py export --content content.json --system design-system.json --format slides --out slides.html
```

Content: `{"title":"Project brief","subtitle":"Illustrative example","lang":"en","sections":[{"heading":"Overview","body":"Paragraph one.\n\nParagraph two.","table":[["Item","Status"],["Design","Draft"]]}]}`.

HTML exports use readable measures, print rules and tables; slide HTML uses section breaks and landscape print. Optional `fontExports` in content is an array of directories previously exported by `fonts.py`; HTML embeds verified binaries and license/source text from those folders. `docx` and `pptx` formats use existing `python-docx`/`python-pptx` host libraries when available. Do not install dependencies in a client project by default. Native exports reference fonts rather than embed them; include licensed files separately if needed. PPTX splits long body copy into continuation slides and tables into six-row pages (maximum six columns). Review long headings and table cells in the target renderer. No exporter certifies pagination or font substitution automatically.

For requested native documents/decks, follow the host's document/presentation skill when available, supplying Dazzler's design system. The helper offers a portable starting point, not a replacement for required render-and-review workflows. Preserve source documents, authentic content, and all required sections.

## 10. Cross-platform evaluation

```shell
python scripts/evaluate.py --host claude --out NEW_EVAL
python scripts/evaluate.py --host claude --command-file host-command.json --out NEW_RUN
```

Without a command, prepare four realistic briefs and a matrix explicitly marked **not-run**. To execute, supply a JSON argument array for an authorized host runner; placeholders are `{prompt_file}`, `{output_dir}`, `{skill_dir}`. The runner must read the prompt file, invoke the real host, wait for completion and save deliverables to the output directory. No shell interpolation, auto-authentication or fabricated model execution. Timeout, unavailable command and failed assertions remain failures. Keep native host permission controls enabled.

The suite checks brand preservation, content resilience, system/chart output, and document transfer. Artifact assertions include hashes; visual/task review remains not checked until a reviewer actually performs it. Harness fixture tests prove the harness, not the model. Do not publish transcripts/client data without permission.

## Optional runtimes

Core project tools use Python stdlib. Tokens/charts use Node and the already bundled color engine. Browser tools need an existing Playwright/Chromium environment, optionally located with `DAZZLER_NODE_MODULES`; use host browser tools if absent. Native DOCX/PPTX need their respective existing Python libraries. The skill should select a supported path automatically and state concrete limitations; never report an unavailable check as passed.

## Import boundaries and font fallbacks

See [bounded imports and font stacks](import-boundaries.md) for evidence trust, browser navigation, limits and fallback overrides.

## Notes and credits

- [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
