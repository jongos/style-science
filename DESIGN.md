# Style Science Landing Page

An original editorial manifesto, designed with Dazzler. The brief asks for the spare, principled voice of industrial design. The writing and geometry are original; this is not an adaptation of Rams's ten principles or a claim of his endorsement.

## Composition

Oversized typography introduces the argument. Eight numbered commitments establish a reading rhythm. A dark, keyboard-operated spacing study makes one relationship tangible. An oxide-red closing statement supplies the strongest color field. The GDC section distinguishes our ambition from measured implementation capabilities.

## Tokens and Relationships

- Warm paper `#ece9df`, ink `#20211d`, oxide red `#ac301b`, secondary text `#585a51`, signal `#e3ef8c`.
- Inter Variable, locally served under its included SIL Open Font License. Variable weight, close headline spacing and generous body leading create hierarchy without decorative fonts.
- Body measure is capped at 52–53 characters. Desktop uses unequal columns; narrow screens use a single reading column.
- The interactive study uses `x = 280 + (index − 3) × interval`. It illustrates proximity; it does not calculate beauty.
- `site/color-intent.json` records the reproducible Dazzler exploration brief. Final tokens are editorial selections checked for contrast, not an optimized quality score.

## Delivery

`node tools/build_site.mjs` builds the semantic page and text edition from `site/manifesto.json`. JavaScript progressively enhances the spacing study; the entire manifesto remains readable without it. GitHub Pages serves the generated artifact.

Run `node tools/test_site.mjs` with host-installed Playwright and axe-core. Optional `PLAYWRIGHT_MODULE`, `AXE_SCRIPT` and `SITE_EVIDENCE_DIR` select host tooling and screenshot destinations. Browser checks cover narrow and wide viewports, local font loading, anchor targets, keyboard operation and automated accessibility rules. Visual inspection and these checks do not establish human preference or design-quality improvement.
