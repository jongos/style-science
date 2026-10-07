# Typography selection and use

For persistent records, fluid typography, safe token interchange and compatible theme proposals, follow [persistent systems](persistent-systems.md). Discover the existing project record before choosing a new direction.

Typography establishes hierarchy, reading rhythm and product identity. Select it early enough to shape the layout, then test real content at actual sizes. Font choice alone cannot rescue poor measure, spacing, contrast or hierarchy.

## Automatically choose a suitable font

Preserve user-selected fonts and established brand systems. When the brief leaves typography open, choose a best-fit option yourself; do not ask the user to pick from a long font menu. Explain the choice briefly in terms of the audience and task. “Best” is contextual, not a universal ranking.

1. Identify the primary reading task: interface, sustained body text, heading, expressive display, or code. Identify actual scripts/languages, needed weights/italics, numeral behavior, existing assets, and performance constraints.
2. Run `scripts/fonts.py recommend` first with actual copy and required styles. Read a shortlisted or named family in `references/fonts/<id>.md` only when needed; [font-catalog.md](font-catalog.md) is a compact browsing index. Use [font-catalog.json](font-catalog.json) for exact per-file facts. Do not load its large technical record unless needed.
3. Shortlist two or three fonts that fit the content and visual direction. Match functional requirements first, then voice: scholarly, warm, geometric, rough, industrial, quiet, and so on. Inter is an option, not an automatic default. Display faces are not interchangeable with reading faces.
4. Check actual text and each required weight/style against the files. Character presence is necessary but does not prove complete language support, combining-mark quality, shaping, or legibility. Complex scripts need rendered review. Do not claim Japanese support for newer M PLUS families when using the legacy M+ 1m bundle, or confuse Roboto 2 with Roboto 3.
5. Choose one family when its hierarchy is sufficient; add a complementary family only for a clear role such as expressive headings or code. Match apparent size and rhythm rather than identical numeric font sizes. Use a restrained, deliberate scale; body measure around 45–80 characters is a starting point, not a fixed rule. Adjust line height to the face, language, and density.
6. Render the choice using real headlines, paragraphs, labels, tables, punctuation, diacritics, and ambiguous forms such as `Il1`, `O0`, and `rn`. Check narrow screens, keyboard focus, zoom, wrapping, and loading/fallback behavior. Revise the type before adding decorative treatments.

## Offline helper

The helper requires only Python 3. It reads the checked catalog offline and never downloads fonts, installs system fonts, or transmits project text.

The agent runs these commands and applies the result as part of the automatic workflow. Do not ask the user to run them, choose catalog IDs, or approve a routine font choice. Shortlists are internal unless the user requests alternatives.

From the skill directory:

```shell
python scripts/fonts.py recommend --role body --mood literary --text "A thoughtful introduction" --weight 400
python scripts/fonts.py recommend --role ui --mood clean --feature tnum --text 'Revenue $12,345.67'
python scripts/fonts.py recommend --role code --monospace --text "const count = 42;"
python scripts/fonts.py recommend --role body --text-file ./representative-copy.txt --italic
```

Scores are a transparent heuristic based on curated role/mood tags. They are not aesthetic proof. Ties are deterministic, not an assertion that the first alphabetic family is superior. Use the real design brief and rendered comparison to make the final choice. The helper filters exact text, requested weight/style/features and optional per-file byte budget; it never silently relaxes a missing requirement. Run it for every required style and combine the results. `--feature tnum` also accepts fonts with already-tabular default digits. Enable `font-variant-numeric: tabular-nums` when using a `tnum` feature.

## Use fonts locally in the project

Bundled fonts need no new license approval for the documented use and no operating-system installation for a website. When project edits are authorized, copy the chosen files and their support notices into the project's font assets using the helper. Example:

```shell
python scripts/fonts.py export work-sans --dest ./public/fonts --file "WorkSans[wght].ttf"
```

Import the emitted `fonts.css` through the project's normal CSS pipeline, keeping its relative URLs working. It sets actual named weights/styles and variable ranges with `font-display: swap`. Apply the reported CSS family with a suitable generic fallback. Turn on `font-optical-sizing: auto` for an `opsz` font. Prevent synthetic bold/italic when no matching face exists (for example `font-synthesis: none`). Keep separate aliases for titling, condensed, open, inline, dashed and rounded variants.

Use WOFF2 when a verified upstream file is bundled; unmodified TTF/OTF can be used when that is the available format. Do not silently convert or subset fonts: such changes can trigger reserved-name or distribution requirements. Avoid third-party font calls when local assets suffice. Copy only needed styles, budget their combined size, and preload only genuinely critical files. Test font loading, fallback metrics and layout shift. The helper refuses to overwrite an existing family folder; compare and update it deliberately.

Some legacy binaries have misleading weight/style/embedding fields. JSON preserves those raw facts alongside explicit CSS mappings. A CSS mapping does not modify the font or prove an office application will embed it. For desktop document embedding, check the actual application and font flags as well as the license.

## Licenses and cases requiring user action

- **OFL 1.1:** Keep each font's copyright, license and provenance with redistributed files. Do not relicense it as Apache or sell the font by itself. Review the actual Reserved Font Names before modifying, subsetting or converting. The generated project does not become OFL merely because it uses an OFL font. Official terms.
- **Roboto 2:** This bundled generation is Apache 2.0. Retain its license and notices; different Roboto generations can have different licensing.
- **Aileron:** Preserve the author's No Rights Reserved notice. Open Foundry labels it CC0; record that attribution rather than inventing a new copyright or license grant.
- **TeX Gyre Heros:** Keep GFL, LPPL, manifest, copyright/source notice and complete upstream archive together. The bundle is unchanged. Do not treat GFL fonts as OFL fonts. LPPL terms.
- **Nimbus Sans L:** Cataloged but not bundled because the exact archive's source-distribution evidence is incomplete. Do not download, relicense or redistribute it automatically. Explain the issue and offer the bundled Liberation Sans or TeX Gyre Heros as alternatives. To use Nimbus, identify the exact source package and license exception first; user approval alone cannot cure missing rights or source obligations.
- **Unavailable, paid or restricted fonts:** State the exact font/version, publisher URL, reason user action is needed, and a suitable bundled fallback. Obtain permission before purchases, account actions or accepting additional terms. Never imply every font on a site shares one license.
- **Manual desktop installation:** If the user's application needs a system font, provide the exact trusted download and filename. WOFF/WOFF2 are web formats; obtain an audited TTF/OTF from the linked upstream source for desktop use. Ask before changing the OS font library unless already authorized. On Windows, the user can open a TTF/OTF and choose Install; on macOS use Font Book; on Linux use the user's font directory and font cache tooling. The helper performs project-local copying only. Keep a fallback while installation is pending and verify the application actually loads the selected font.

## Evidence boundaries

This bundle contains a curated set of distributions, not all versions ever released. The catalog names mirrors and failed/historical links explicitly. Do not copy Open Foundry's specimen art or backgrounds: their inclusion on a font page does not grant redistribution rights. A family being open-source does not make every similarly named commercial release interchangeable.

## Notes and credits

- [Official terms](https://openfontlicense.org/open-font-license-official-text/)
- [LPPL terms](https://www.latex-project.org/lppl/lppl-1-3c/)
