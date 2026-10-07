# Review the result against its purpose

See [composition and refinement](composition.md) for purpose-based layout contracts, measured review candidates and bounded refinement intents. Preserve intentional repetition and record exceptions; these candidates remain separate from accessibility failures.

Before delivery, compare the actual implementation/render with the brief and recorded direction. For small edits, review the affected component and neighboring layout. For a full interface, examine narrow and wide layouts, real content extremes, the primary task and relevant states. Do not claim rendered inspection when only source is available.

## Review questions

Apply [final artifact gates](delivery-gates.md) for heading case and [document design](document-design.md) for documents/slides, even when another tool creates the artifact. Verify the final text and rendered composition; a generator's style settings are insufficient evidence.

| Dimension | Evidence to inspect | A useful correction |
|---|---|---|
| Task fit | Can the audience find and complete the primary task? | Reorder information, improve labels, expose the required control |
| Direction | Does the rendered composition express the chosen organizing idea? | Fix hierarchy or structure before adding ornament |
| Bare structure | Does the layout still make sense without color, textures or display type? | Rework unnecessary cards/sections or preserve a familiar structure that genuinely fits |
| Typography | Real copy, measure, hierarchy, glyphs, weights and numeric columns | Use verified font capabilities and adjust spacing/scale |
| Editorial clarity | [Copy in context](editorial-craft.md): meaning, voice, evidence, terminology and scope | Replace empty claims with supported specifics; preserve intentional emphasis and protected text |
| Color | Actual text/surface/state pairs, locked brand values, light/dark if in scope | Use measured semantic variants; report an unresolved lock |
| Grouping and density | Related items close together; unrelated sections distinguishable | Remove redundant boxes, adjust rhythm and content width |
| Components | Applicable pressed, focus, disabled, loading, empty and error states | Complete the required state or recovery behavior |
| Motion and media | Animation purpose, visible fallback content, coherent imagery/icons | Remove distraction, fix reduced motion, use relevant licensed assets |
| Accessibility | Keyboard operation, visible focus, labels, contrast, reflow and non-color cues | Fix concrete failures; identify unavailable checks |
| Build and behavior | Broken assets, overflow, console errors and primary action | Repair before aesthetic polishing |

Common patterns deserve investigation when they lack a purpose: repetitive icon tiles, interchangeable hero/cards/testimonial structures, ambient glows, exaggerated rounding, unnecessary animated status indicators, ornamental gradients, repeated labels and vague interface copy. None automatically fails if it serves the brief. Do not replace one fashionable default with another.

## Record and resolve findings

For each material finding, record the observation, its consequence, the change made (or reason for retaining it), and validation. Distinguish:

- **Verified:** the relevant check was actually performed and its evidence supports the result.
- **Needs work:** a concrete failure remains, with a next step.
- **Not checked:** the required tool, content or environment was unavailable.
- **Not applicable:** the feature/state is outside this task, with a brief reason if needed.

Use this in the existing design record for ongoing work, or in a concise delivery note for a small change. Do not assign an unexplained “10/10” or let an aesthetic score stand in for interaction or accessibility evidence. Do not claim every state exists because a checklist names it.

Fix the affected area, recheck the relevant evidence, and stop when the authorized task is satisfied. Preserve deliberate brand choices, working behavior and project conventions. An attractive mockup remains a mockup until its interactions and integration are implemented and checked.

## Notes and credits

Adapted from Samuel Berthe's [slop-checklist.md](https://github.com/samber/cc-skills/blob/f866b800353719270a9ea101a41c5e2a2618d460/skills/frontend-design-deslop/references/slop-checklist.md) and divergence guidance, under [MIT](deslop-LICENSE.txt). This is an evidence-based review, not a blacklist of fonts, hues or popular components.

## Verify Claimed Visual Improvement

Compare final artifacts with a fixed baseline under the same rendering conditions. Record changed structure and retained content separately from subjective judgment. In a collection, compare monochrome silhouettes, first-read hierarchy, information density and page roles; color variation alone is insufficient evidence of diversity. Identify intentional repetition rather than treating all similarity as failure. A unit-test count, new instruction file or changed binary hash does not establish design quality. Inspect actual pages and primary interactions, then state the scope of the observed improvement.
