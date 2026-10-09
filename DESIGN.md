# Style Science Landing Page

An original editorial manifesto, designed with Dazzler. The brief asks for the spare, principled voice of industrial design. The writing and geometry are original; this is not an adaptation of Rams's ten principles or a claim of his endorsement.

## Composition

Oversized typography introduces the argument. Eight numbered commitments establish a reading rhythm. A dark, keyboard-operated spacing study makes one relationship tangible. An oxide-red closing statement supplies the strongest color field. The GDC section distinguishes our ambition from measured implementation capabilities.

## Tokens and Relationships

- Warm paper `#ece9df`, ink `#20211d`, oxide red `#ac301b`, secondary text `#585a51`, signal `#e3ef8c`.
- Inter Variable, locally served under its included SIL Open Font License. Variable weight, close headline spacing and generous body leading create hierarchy without decorative fonts.
- Body measure is capped at 52–53 characters. Desktop uses unequal columns; narrow screens use a single reading column.
- The interactive study couples Structure and Expression. Forty-eight points interpolate between an expression-dependent ordered grid and a rotating, expanding two-dimensional field. Both inputs change positions in both axes; the specimen and prompt share the same deterministic state. This is an authored illustration, not learned causality or a beauty calculation.
- Live fields expose typeface, weight, heading size, spacing, line height, corners and two color roles. Two text specimens and a sample prompt reflect those values. Inter is bundled; Georgia and Courier New use declared system fallbacks. Reduced-motion preferences disable point transitions.
- `site/color-intent.json` records the reproducible Dazzler exploration brief. Final tokens are editorial selections checked for contrast, not an optimized quality score.

## Delivery

The GitHub README carries the manifesto's editorial identity through a responsive raster masthead: the same licensed Inter, paper, ink and oxide red, with large type and fine rules. `docs/readme-artwork.html` is its editable source; `tools/build_readme_artwork.mjs` renders desktop/mobile PNGs using explicitly supplied existing host Playwright and Chrome. No browser download. The `<picture>` element switches composition for narrow screens; meaningful alt text preserves the message without images. Raster text is limited to the masthead: all eight commitments, documentation and links remain selectable native Markdown. The actual study screenshot (Structure 35, Expression 80) links to the interactive page. Technical qualifications remain intact. GitHub controls body fonts, themes and spacing; the README does not pretend to support the site's CSS or interactive sliders. Both PNGs are explicitly included in the distribution manifest.

The chart now retains the original ink backdrop (#20211d), muted grid and monochrome paper-colored marks. The specimen palette still responds to the sliders; chart colors do not. Filled/hollow nodes, connection weight, position and depth supply hierarchy without categorical hues.

Derived depth is Expression / 100 multiplied by (1 - Structure / 100), displayed on a 0-100 scale. Stable sinusoidal node ranks vary radius and radial displacement, with near nodes painted last. These are bounded 2D depth cues, not a physical camera or an empirical aesthetic metric. Zero expression or full structure preserves a flat field. No third control is introduced; the prompt records the derived value.

The study uses six connected visual phrases and filled anchors against hollow satellite points. Fine line weight (0.6-1.6 before viewport scaling) responds to the inputs; the prompt explicitly names all eight output values plus depth. Grouping and hierarchy are authored design choices, not empirical claims about beauty.

`node tools/build_site.mjs` builds the semantic page and text edition from `site/manifesto.json`. JavaScript progressively enhances the spacing study; the entire manifesto remains readable without it. GitHub Pages serves the generated artifact.

Run `node tools/test_site.mjs` with host-installed Playwright and axe-core. Optional `PLAYWRIGHT_MODULE`, `AXE_SCRIPT` and `SITE_EVIDENCE_DIR` select host tooling and screenshot destinations. Browser checks cover narrow and wide viewports, local font loading, anchor targets, keyboard operation and automated accessibility rules. Visual inspection and these checks do not establish human preference or design-quality improvement.
