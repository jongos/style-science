# Color selection and implementation

Use this when choosing or materially changing a palette. Preserve existing tokens for small edits. Infer direction from the brief, content, audience and brand and choose unspecified preferences yourself. Ask only for an indispensable task input or an unresolved hard constraint, not a routine aesthetic choice. A mood describes a design intent, not a universal psychological or cultural effect.

## Choose a direction

For a new palette, default to mathematical exploration of an agent-authored color intent. The [palette catalog](color-palettes.json) contains 88 attributed reference examples, not the available design space or a default lookup table. Existing projects and explicit catalog selections retain their exact behavior. Translate the user's subject, mood, material, culture-specific context and brand into ranges and role relationships; the local helper does not understand natural language. Do not use industry stereotypes as color rules.

Explore independent hue offsets, lightness, chroma, colored neutrals and colored page fields. Use complementary or analogous relationships when useful, but the seven named harmonies are not boundaries. A small sharp accent against a chromatic field, warm/cool neutral tension, a narrow hue family with large lightness separation, or several related luminous hues can each fit different content. Neither three colors nor 60/30/10 area ratios are mandatory. Evaluate color area and adjacency in the actual composition, not swatches alone.

### Geometry and Perception

Use the [relationship knowledge](color-relationships.json) for formulas, coordinate-space distinctions and perceptual correction. Square tetrads are a special case of rectangular tetrads. HSL/HSV angles cannot be relabeled as OKLCH hues; convert actual colors first. When explaining a mathematical palette, report raw angles/colors beside adjusted values and their actual coordinates. Infer a base when absent. Named families seed continuous exploration, never bound it. Four-color relationships require four explicit composition roles; three decorative seeds alone do not form a tetrad. Judge area, adjacency and typography in context.

### Mathematical Exploration

`colors.mjs explore` uses a seed-rotated Halton sequence to distribute candidates across continuous coordinates instead of drawing only random triples. For each requested lightness and hue, a 24-step bisection estimates the maximum in-gamut sRGB chroma along that OKLCH ray. The sampled `gamutFraction` caps chroma relative to that boundary; absolute chroma ranges remain caps too. This reduces clipping-driven convergence between different requests. Final mapping and quantization still use the existing Culori/Ankhorage engine.

Each candidate goes through the established semantic-role generator, brand-lock precedence and unrounded contrast checks. Failed candidates are not exported as CSS. A farthest-first selection then maximizes the minimum RMS OKLab distance across brand/secondary/accent and both background/surface pairs. A 0.025 separation threshold prevents padding the results with near-duplicates. This is a geometric diversity heuristic, not an aesthetic score or a proven perceptual just-noticeable difference. The first candidate is not the best design.

The default explores 48 configurations and returns up to six separated passing systems. Record its seed for replay. Quantization and constraints collapse possibilities; seed size does not prove uniqueness or aesthetic quality.

```json
{
  "brief": "Warm mineral paper with cool, vivid botanical accents",
  "count": 6,
  "ranges": {
    "hue": [110, 170],
    "secondaryOffset": [-110, -50],
    "accentOffset": [100, 180],
    "neutralOffset": [-110, -70],
    "chroma": [0.08, 0.26],
    "gamutFraction": [0.55, 0.95],
    "lightSurface": [0.85, 0.96],
    "surfaceChroma": [0.025, 0.08]
  }
}
```

The agent writes this configuration; do not ask users for numeric ranges. Other ranges are `lightness`, `neutralChroma`, `darkSurface`. Offsets are degrees relative to the base hue, not named harmony presets. Absolute hue spans 0–360; offsets allow -360–360. Chroma is an OKLCH coordinate, not percent saturation. Supported ranges are validated by `palette-space.mjs`; equal endpoints fix a coordinate. `base` preserves an explicit seed; `locked` and `target` use the existing engine contract. Fresh starts explore; refinements retain approved colors unless the request authorizes changes.

```shell
node /path/to/frontend-design/scripts/colors.mjs explore --config ./color-intent.json --out ./color-exploration
```

The output contains `exploration.json` and passing candidate folders with the ordinary palette, CSS, preview and licenses. `partial` or `unresolved` returns exit 2; the finite search may miss feasible choices and never relaxes a lock. Inspect failures and revise permitted ranges. Pick one using actual content and color-area balance, then pass its `palette.json` **input** as `colors` to the existing studio configuration. Save that chosen input, not a fresh random exploration request, in the persistent design record. Native document and chart workflows consume the same semantic tokens. Use `seeds` for exact secondary/accent/neutral choices and `surfaces` for deliberate light/dark background/surface values; explicit `locked` tokens win over both.

## Generate locally

Use Node.js 22+; no installation or network is needed. If unavailable, report numerical contrast as unverified.

Existing deterministic generation remains available: `colors.mjs generate --config input.json --out NEW_DIRECTORY`. Its configuration accepts `base`, `palette`, `mood`, `harmony`, `locked`, `target`, `seeds` and `surfaces`; CLI values override named fields. `recommend` and `list` are explicit catalog lookup tools. Output directories must be new and outside the skill.

Supported locked tokens are `brand`, `secondary`, `accent`, `background`, `surface`, `text`, `muted`, `border`, `action`, `onAction`, `actionHover`, `onActionHover`, `focus`, `danger`, `success`, `warning`, `info`. Locking a token preserves that exact value; it does not automatically regenerate the seeds. Use `base` for the generation seed. Never silently change an owner's locked color to make a check pass.

Outputs:

- `palette.json`: seeds, source attribution, versioned engine, full candidate decisions, ramp diagnostics, tokens, measured pairs and failures.
- `colors.css`: semantic CSS variables for light and dark modes.
- `preview.html`: portable component, text, status and focus specimen with theme and approximate color-vision simulation controls; no network assets.
- `licenses/`: upstream MIT notices and the original adapter's Apache license, preserved when sharing the generated package.

Exit code 0 means the requested command succeeded; generation also passed all listed role pairs. Exit code 2 means no recommendation or unresolved generation constraints. For unresolved generation, only `palette.json` is written; no CSS or preview is exported. Exit code 1 means an input or I/O error. Inspect failures and choose a different allowed variant, separate surface, or non-color treatment. If satisfying a required brand lock needs a user decision, explain the concrete conflict and alternatives.

## Validate functional roles

Use perceptual OKLCH ramps and gamut-safe sRGB exports rather than treating HSL lightness as a contrast measure. The engine retains diagnostics for weak steps, grayscale seeds and limited ranges. A passing contrast report does not remove those aesthetic warnings: inspect the ramp and choose a more useful seed or fewer meaningful steps when necessary.

The generated system checks normal text, muted text and status text against both page and surface at 4.5:1; action fills, borders and focus against those surfaces at 3:1; and action labels against normal/hover fills at 4.5:1. Comparisons use unrounded values. `brand`, `secondary` and `accent` are raw decorative seeds, not promises of safe text colors. Functional links should use a measured text token and a non-color cue such as underlining.

These are documented default relationships, not a complete accessibility audit. Recheck the actual adjacency in the product: a focus ring on another fill, nested surfaces, selected controls or a chart may create a relationship not listed here. Use an offset focus ring against the validated surrounding surface or measure its actual neighbors. Disabled controls, decoration and logotypes have distinct requirements; do not require every arbitrary swatch pair to pass 3:1.

For WCAG AA, normal text needs 4.5:1. Large text has a 3:1 threshold at 18pt regular (24 CSS px) or 14pt bold (about 18.67 CSS px), not 18px bold. Thin or unusual fonts benefit from more margin even when their token pair passes. Qualifying functional non-text information needs 3:1 against adjacent colors. Do not use hue alone to communicate state: include text, icons, line styles or patterns as appropriate.

The helper accepts only opaque six-digit hex. Composite translucent content against its real background before measuring. Check the worst relevant areas of gradients/images separately. Validate light and dark themes independently; inversion and hue rotation do not establish contrast. Color-vision simulations are approximate review aids, never certification or substitutes for redundant meaning.

## Review with typography and export

Select fonts through [the typography workflow](typography.md). The generic preview uses system fonts intentionally; apply the project's chosen licensed fonts and actual copy when implementing. Inspect body text, muted labels, small numbers, buttons, errors and keyboard focus at mobile and desktop widths. Check font weights, anti-aliasing, reading density, color area and visual hierarchy together.

Prefer a single contextual choice with a short rationale. Offer alternatives only when the decision is materially open. Keep generated brand artifacts in the user's project, not this plugin's source repository. Preserve provenance and license notices when exporting. Never describe a mathematical shortlist as an objectively best aesthetic or a passing role table as full WCAG compliance.

## Notes and credits

- [hue3, pinned source](https://github.com/ktzzypo938/hue3/tree/a306210b7240e183366998ce39fbe7543cc09b41): mood palette data, names and atmosphere descriptions retained under [MIT](hue3-LICENSE.txt). Mandatory three-color rules, inaccurate contrast advice and Claude-specific instructions were not adopted.
- [Ankhorage color-theory](https://github.com/ankhorage/color-theory): pinned published 0.3.1 engine with [MIT notice](../scripts/vendor/ankhorage-color-theory-LICENSE.txt); [Culori](https://github.com/Evercoder/culori) 4.0.2 with [MIT notice](../scripts/vendor/culori-LICENSE.txt). Bundle hashes and versions: [provenance](../scripts/vendor/provenance.json).
- [bivex/brand-color-palette-generator](https://github.com/bivex/brand-color-palette-generator/tree/34120ac72e8153dd26ce2f995dba277477c74ce6): preview/export interaction inspiration only; no code copied and no dependency on Colormind.
- [WCAG 2.2 text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Mathematical background: [Oklab's author](https://bottosson.github.io/posts/oklab/), [CSS Color 4](https://www.w3.org/TR/css-color-4/#ok-lab) and [Culori's API](https://culorijs.org/api/). Continuous sampling, chroma-boundary exploration and candidate selection are original Dazzler orchestration around the existing licensed engine; no upstream bundle was replaced. Mathematical separation does not establish harmony, universal emotion or accessible chart-category distinction.
