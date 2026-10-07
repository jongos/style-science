# Final Artifact Gates

These checks apply whenever Dazzler designs documents, slides or web pages, including custom Python/JavaScript, Word automation, document skills and external artifact tools. Choosing another authoring tool does not waive Dazzler's design policy.

## Heading Case

Default to protected English Title Case for document titles, section headings and slide titles. Use `headings.py` or `headings.mjs` at authoring time. Apply the same final text to contents entries, bookmarks' visible labels and repeated section titles. Preserve acronyms, brands, code, quoted source text and non-English casing. Do not title-case body copy, captions, table values or eyebrow labels.

Before delivery run:

```sh
python scripts/heading_audit.py /absolute/path/final.docx
python scripts/heading_audit.py /absolute/path/final.pptx
python scripts/heading_audit.py /absolute/path/final.html
```

Exit 0 means the discovered headings match the chosen rule, 1 means repair is needed, and 2 means the audit did not establish coverage. Fix text in the authoring source, regenerate and rerun. Do not flatten Word runs or overwrite the entire paragraph: that can destroy hyperlinks, emphasis and fields. Re-render changed pages to check wrapping and pagination. Structural OOXML validation alone does not verify casing or design.

DOCX includes headings in tables, text boxes, headers and footers, named/inherited heading styles and explicit outline levels. PPTX detects explicit title placeholders. Custom slide title boxes, headings drawn into images, unstyled Word headings, PDFs and canvas content require an explicit heading inventory from the authoring source and a comparison against the rendered artifact. Add semantic heading styles where appropriate. A partial semantic audit is not a whole-document pass.

For React, hydrated pages and other generated interfaces, capture **rendered DOM** headings after loading the relevant routes/states, including accessible shadow/frame content where used. Save an array of `{ "location": "route and selector", "text": "visible heading" }` records and audit that JSON. Inspect semantic `h1`–`h6`, `[role=heading]`, and visually styled headings missing semantics. HTML source audit alone cannot verify client-generated content or CSS text transformation. Markdown is supported for authored ATX/setext headings; inspect the rendered result as well.

For source-only deliverables without a renderer, audit available source and explicitly report rendered coverage as unavailable. Do not label an unrun gate as passed. If the user explicitly requests sentence case, preservation or another language, pass `--case preserve` or `--lang LANGUAGE` and record the reason. The agent's preference for a magazine aesthetic is not an override. Do not switch policy to silence failures.

## Design Completion

Apply [editorial craft](editorial-craft.md) to copy authored or edited within scope. Verify facts, qualifications and voice against the source, then recheck headings and layout after wording changes. Copy-pattern findings are contextual review, not AI detection or an automated quality score.

For documents, follow [document design](document-design.md). Before delivery inspect actual pages at reading size: hierarchy, purposeful color surfaces, editorial rhythm, selective emphasis, readable charts, callout usefulness and print/reflow behavior. Treat generic default styling as unfinished, including basic professional work; improve craft within the user's constraints. Do not substitute a successful file-open test, a palette JSON or a decorative cover for a fully designed document.

Record heading coverage, exceptions, observed design improvements and unavailable checks in a short delivery note or existing design record. No scores or assertion of guaranteed beauty are needed.

## Distinctive Voice

Apply [art direction](art-direction.md) to every format and authoring path. Before delivery, identify the visible defining move, its connection to the prompt, supporting choices and intentional restraint in the actual rendered result. Inspect continuation pages, data and ordinary components as well as the opener. Small changes review the affected area and preserve the established identity.

Interchangeable or incoherent output requires revision and another relevant render, not a passing style label. A strong professional document can pass through exacting proportion and typography without spectacle. Record honest observations in the existing design record; the workflow helper requires a structured review for a reported distinction pass. This checks evidence completeness, not beauty. No automated gate guarantees that a person will like the result.
