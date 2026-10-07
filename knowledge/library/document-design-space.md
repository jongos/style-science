# Generate a Document System

Apply this to new Word/PDF documents and substantial restyles. Preserve explicit user choices, supplied brand rules and required conventional structures. Small edits stay within the existing design. Apply the existing [art-direction standard](art-direction.md): push a decisive, distinctive voice through native document building blocks. Even basic professional work needs exceptional proportion, typography and editorial rhythm; users can redirect the look in ordinary language.

## The Design Space Is Open

Treat reference templates as observations of design relationships, not skins to reproduce. Decompose them into page proportions, title-to-body contrast, surface coverage, image scale/cropping, column relationships, recurring geometry, data treatment, navigation and sequence. Combine and transform those relationships around the actual brief. Invent a new arrangement or visual device when it helps. A finite list of named aesthetics must never become the boundary of Dazzler's output.

Do not claim billions of good designs by multiplying options. Large combinatorial capacity says nothing about fit, legibility or quality. Dazzler changes its generation workflow and compositional vocabulary; studying examples here does not retrain model weights. Coherence comes from a project-specific idea and editorial judgment, not randomizing everything.

## Design the Page Surface From the Prompt

White is a choice, never an assumed Word/PDF default. Explore light, tinted, saturated and dark page fields against the brief, including black, blue, yellow or any other appropriate hue. Neither a template nor a helper default selects the surface for the user. Explicit brand colors and the requested mood win; do not force colored paper when white best serves that intent.

Use the color engine to derive a coherent system against the actual background: body ink, muted labels, heading ink, chart marks, rules, table cells and text on accent fields. Check every foreground against its immediate surface, including alternating rows, images and section changes. Preserve a requested exact color and adapt its companions. A dark cover with white interiors is only one possible sequence, not the required compromise. Color can extend through reading and evidence pages or change by page role.

For the basic `project.py` exporter, set `paletteMode` in content or the design system to select the intended palette; its compatibility fallback is `light`, not a design recommendation. Supply deliberately chosen background/text/border tokens. This basic exporter is not a full composition engine. For Word, inspect native backgrounds or page-sized anchored shapes in actual Word and the exported PDF. Verify full-page coverage, stacking, text editability and contrast on every page. Word page-color display alone does not prove that export or printing preserves it. Provide an ink-saving version only when requested or required by the brief, without silently replacing the intended design.

## Select a Direction Without Burdening the User

1. Establish purpose, audience, content hierarchy, available assets, document length and editing/printing constraints from the request. Identify what must remain fixed. Do not invent images, quotations or data to support an aesthetic.
2. Consider three genuinely different structural directions internally. Change the opener, content organization and type relationship—not only color. A reference may inform a relationship while the resulting composition is original. Honor the user's requested look; do not force variation within an established brand.
3. Select the direction that best serves the reader. Give it a short rationale connecting its organizing idea to visible decisions. Fonts, colors, shapes, charts and page furniture should reinforce that idea. Use a few strong moves; intensity can vary between opening, reading and evidence pages.
4. Implement an actual opener and a representative dense interior page early. Judge those renders together. If the interior collapses into a default heading/paragraph/table stack, develop its grid, typography, visual hierarchy and sectional rhythm before extending the document.
5. Continue the system across the document. Vary page roles while preserving relationships. A cover, contents page, narrative spread, comparison, reference table and action page need not share one layout. Retain enough consistency for navigation.

The optional offline helper supplies contrasting starting decisions:

```shell
node scripts/document-directions.mjs request.json
```

Example request: `{"purpose":"Explain a canopy study and its next decisions","content":["prose","data","comparison"],"count":3}`. An optional `background` such as `"#FFD600"` locks an exact page color; returned `pagePalette` tokens and checks come from the existing color engine. This explicit background overrides the exploratory `pageSurface` suggestion. It records a fresh seed; supplying that seed reproduces the suggestions. Available content values are `prose`, `data`, `image`, `quote`, `steps`, `comparison`. `locks` preserves supported individual decisions such as `{"colorRole":"monochrome"}`. Do not map natural-language instructions to a supported option when that loses the user's intent; design directly instead.

The helper varies opener, grid, type relationship, color role, navigation, motif, table, density, alignment, image treatment, evidence emphasis and sequence. It also explores type scale, margin and hue. Source prerequisites prevent image-led suggestions without images or evidence-led suggestions without data. Structural distance encourages alternatives within a candidate set; it is not a perceptual or aesthetic score. Candidates are explicitly unrendered and unranked. Their order is not a recommendation. The agent must interpret, refine and implement them rather than presenting the JSON as completed design work.

## Native Word and PDF Are First-Class Outputs

Exploit what the actual format can do: native section breaks and columns, unequal column widths where useful, semantic paragraph/run styles, restrained text wrapping, controlled image crops, native tables, repeating headers, folios and section-specific page furniture. Use intentional whitespace and strong scale; measure typography in the final renderer. Keep essential text in logical reading order. A saturated or image-led cover must still lead into well-designed interior pages.

Select actual licensed assets or create original graphics. Put incidental geometry behind text only when anchoring, overlap and printing have been verified. Avoid making essential content depend on fragile floating boxes. Use layout tables only when their editing and reading-order consequences are acceptable and verified. A single flattened page image is not an editable Word design.

Use a font that the target renderer can actually use. Export or embed licensed local fonts when the format/runtime supports it; otherwise choose a verified installed family and inspect the result. A beautiful uninstalled font name in a style definition proves nothing. Test real weights, italics, numerals and language coverage. Font substitution is a design change. In OOXML, inherited theme font attributes can override explicit family names; remove conflicting theme bindings for deliberately selected styles and verify the actual exported face.

Charts share the document's typographic and color system. Select encoding for the reader's question, label meaningful comparisons, preserve source data and disclose static charts. Provide an editable source table or native editable chart when requested. Use PDF as the verified fixed-layout companion; inspect the exported PDF independently for fonts, clipping, pagination and links.

## Quality Floor and Diversity Review

Before delivery, inspect the whole document as thumbnails and every page at reading size. Verify a clear focal hierarchy, deliberate reading sequence, typography that survived export, coherent recurring details and readable dense material. Reject accidental whitespace, thin orphan pages, decorative geometry that competes with evidence, repeated generic cards, broken anchors, missing content and brand violations. Fix faults rather than shrinking everything to fit.

Stress a copy with a longer title, expanded paragraph and additional table rows when editability matters. Inspect the actual reflow; do not promise an invariant page count. Preserve content, readable type and useful page breaks. For PDF-only designs, use the native capabilities of that authoring path rather than simulating Word constraints unnecessarily.

For diversity evaluation, hold content and renderer constant. Compare structure, type relationships, dominant surface, image role and sequence independently of palette. Look for repeated silhouettes across samples. For quality evaluation, use independent human judgments of audience fit, clarity, craft and distinctiveness alongside correctness checks. Neither parameter distance nor a passing accessibility test establishes beauty. Record the chosen decisions and actual rendered evidence in the existing project design record; avoid a global collection of private project content.

## Reference Observations and Limits

- [Adobe Stock search](https://stock.adobe.com/search?k=word+document+template): visually reviewed broad cover fields, edge rails, asymmetric proposal spreads, restrained stationery and case-study layouts. The search mixes asset formats; it is not evidence that every item is a native Word template.
- [Envato Word article](https://elements.envato.com/learn/top-microsoft-word-document-templates): visually reviewed the proposal's varied interior roles, image/geometry interplay in the flyer, typographic hierarchy and invoice information grouping. Its customization discussion covers spacing, images, dividers and color. Product claims about editability were not independently tested.
- [DesignCrowd gallery](https://www.designcrowd.com/wordtemplate-design-gallery/font/word-word-template-designs): visually reviewed multi-page brand systems, image-led covers, navigation bands, dense tables and quiet letterhead pages. These previews demonstrate visual relationships; they do not establish the construction quality of the underlying files.

No commercial template, illustration, logo, photograph or paid source file was imported into Dazzler. These observations expand design judgment; the implementation and demonstration content are original. Original Dazzler guidance, Apache-2.0.
