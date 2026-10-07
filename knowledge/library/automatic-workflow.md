# One brief to a finished design

See [composition and refinement](composition.md) for purpose-based layout contracts, measured review candidates and bounded refinement intents. Preserve intentional repetition and record exceptions; these candidates remain separate from accessibility failures.

For persistent records, fluid typography, safe token interchange and compatible theme proposals, follow [persistent systems](persistent-systems.md). Discover the existing project record before choosing a new direction.

This is the default orchestration for frontend-design. The agent handles the choices and tools; the user supplies the task. The existing helpers are internal implementation tools, not setup instructions the user must follow.

For a new design or substantial restyle, begin with [art direction](art-direction.md): choose and implement the content-specific idea directly from the prompt. Examples demonstrate possibilities; reuse one only when explicitly selected. Helper output alone is not a finished design.

## 1. Read the situation

Inspect the relevant project, supplied references, actual content, brand assets, token files and existing design record. Preserve the designated source of truth. Decide whether this is a small fix, a new component, a substantial design or a review. Do only what the requested scope warrants. A small spacing fix does not trigger font and palette generation; a screenshot-only review does not authorize file edits.

Infer artifact type, audience, primary task, visual character and density from context. When preferences are unspecified, choose a distinctive, committed direction yourself. Do not ask the user to name adjectives or pick a design system. Use truthful supplied copy; clearly distinguish illustrative content if the brief calls for a mockup. Ask only if an indispensable task input cannot be inferred, not because multiple good aesthetic choices exist.

For new palettes, use the existing [color workflow](color-workflow.md) to explore continuous relationships. The 88 reference palettes are examples, not the default candidate space. The agent authors intent ranges and selects against actual content.

## 2. Select one coherent direction

For substantial design, use [the deslop framework](deslop.md) to connect purpose to composition. Apply the [art-direction standard](art-direction.md) through these same building blocks. Compare contrasting directions internally, then choose one based on the task, not alphabetic order, fashion or a fixed default. Make the type, palette, spacing, media, controls and motion express the same direction. State the direction briefly as progress and keep working; do not wait for routine approval.

The following translations are examples of agent reasoning, not mandatory presets:

| Inferred task | Font helper role and possible mood tags | Color direction to explore | Composition and behavior |
|---|---|---|---|
| Repeated operational work | `ui`; practical, clean, technical | Deliberate surfaces and strong role contrast within the brand | Grouped controls, readable numeric density, immediate feedback |
| Sustained editorial reading | `body`; literary, editorial, quiet | An authored surface rhythm that supports sustained reading | Strong measure, section hierarchy, restrained chrome |
| Warm community or craft product | `body`/`heading`; warm, friendly, handmade | Cozy/earthy candidates or an existing brand seed | Relevant imagery, approachable labels, clear primary action |
| Expressive portfolio | `display` plus readable `body`; expressive, architectural, bold | Brief-specific custom seed or bold/dramatic candidates | Work-led composition and one meaningful signature |

Map the brief to each catalog's actual vocabulary. Font tags and color moods are different vocabularies; never pass the same arbitrary mood to both and assume they agree. No-match results call for better mapping or a suitable custom seed, not a preference questionnaire or silent relaxation of hard constraints.

## Check Structure Before Styling

For a new or substantially reshaped artifact, identify what the reader must understand or do first. Choose the order of content and the representation of its evidence before fonts or colors. A legal issue, purchasing offer and operational decision need not share a hero/three-metric/callout skeleton. Reuse a component because the behavior fits, not because it is the easiest available example.

For a collection, compare page silhouettes and hierarchy with color removed. Look for repeated opening sequences, display metrics, boxed prose and identical continuation pages. Keep repetition that serves comparison or a shared brand; revise repetition that hides different reader tasks. Do not enforce arbitrary uniqueness or change an approved layout during a small fix. Require an actual rendered before/after artifact when claiming visual improvement; changed instructions or passing helper tests are insufficient.

## 3. Choose and apply typography

Read [typography.md](typography.md). Invoke `scripts/fonts.py recommend` yourself using the actual reading role, representative project text, needed weights/styles and features. Compare the best viable candidates against the brief. Check every required style, not just a 400-weight sample. A heading face that lacks body glyphs is not a reason to drop the language requirement.

Choose the final family or pairing and use `scripts/fonts.py export` to copy only the necessary files and notices into the authorized project. Import the emitted CSS and use its exact family names and actual weight ranges. Configure hierarchy, line height, measure, fallbacks and appropriate numeric features. Avoid OS font installation and paid/restricted font choices when a suitable project-local option meets the brief.

When an approved existing brand font is already available, preserve it; the bundled catalog need not replace it. When no bundled face meets a real language or style requirement, use a verified existing/local font or an appropriate system fallback if the brief permits. Disclose the fallback and any shaping limitations. Do not promise verified coverage for an arbitrary system font or silently violate a locked font requirement.

## 4. Choose and apply colors

Read [color-workflow.md](color-workflow.md). Use `scripts/colors.mjs` internally to shortlist palette inspiration when useful and generate a role system from the chosen palette or brand seed. Pick the actual palette/harmony yourself; do not expose CLI arguments or IDs as required user decisions. Preserve locked brand values and inspect diagnostic warnings as well as pass/fail status.

For a successful generated system, integrate its semantic CSS into the existing stack and retain its report and notices in a suitable project location. Use action/on-action for controls, measured text roles for copy, and raw brand/accent values only in contexts where they are appropriate. The catalog's first match is a starting point, not the final aesthetic decision.

If constraints fail, revise unlocked choices and re-run the checks yourself. Keep locked colors fixed and try a compliant role variant, allowed surface treatment, or non-color cue. If hard requirements genuinely cannot coexist, explain the specific conflict and ask for the minimum necessary decision. Never ask “which palette?” merely because a generated candidate failed.

For substantial interfaces, use [frontend engineering](frontend-engineering.md) for component reuse and measured performance. [Agent workflows](agent-workflows.md) can plan relevant checks and track supplied evidence without claiming to run them.

## 5. Complete the design

When a section feels flat, use the [focused amplification pass](composition.md#strengthen-a-flat-section). Build on the existing visual vocabulary, strengthen one focal move and compare it with adjacent content; avoid making every element louder.

Apply [editorial craft](editorial-craft.md) to newly written or editable copy. Keep claims supported, voice recognizable and terminology stable; preserve supplied wording in visual-only tasks. Fit text and composition together, then check wrapping after edits.

For documents and slides, follow [document design](document-design.md) regardless of the authoring tool. Use context-appropriate color surfaces, editorial layouts, selective emphasis and content-based callouts throughout the work. Serious subjects call for disciplined design, not generic formatting.

Apply [interface craft](interface-craft.md) to the requested components and states. Choose spacing, radii, hierarchy, imagery and motion without making the user manage a control panel. Use existing components and licensed assets when appropriate; do not add packages merely for novelty. Respect the existing framework and the host's required authoring workflow.

Use the actual selected fonts and colors together in the deliverable. The color helper's standalone system-font preview is a diagnostic aid, not the completed project or a substitute for font-aware rendering. When creating project documentation, follow [design-record.md](design-record.md) and record the integrated choices rather than separate competing font, color and deslop plans.

Inspect the real result using [design-audit.md](design-audit.md), including relevant viewport, keyboard, state, contrast, wrapping and font-load behavior. Fix observed failures within scope. Stop when the requested result and proportionate checks are complete; avoid endless aesthetic iteration. Deliver the artifact and a short explanation of the choices and checks. Do not stop at a shortlist, design plan or “would you like me to implement this?”

## Runtime and host fallbacks

Before delivery apply [final artifact gates](delivery-gates.md). Check saved semantic headings or a rendered heading inventory; an external exporter does not waive Title Case. Repair casing at its source, regenerate and review wrapping and pagination. Report unavailable checks accurately.

Locate the installed skill relative to its `SKILL.md`; do not hard-code the maintainer's Windows checkout into another project. Use available Python/Node runtimes and project tooling. The checked-in color bundle and standard-library font helper need no network installation. Do not ask the user to install development packages or operate the helpers.

If a runtime is missing, use the readable catalogs, licensed local assets and available host/project tools to complete as much as possible. For example, an existing browser or project's color library may measure a role pair. Prefer a usable permitted fallback over making the user set up tooling. Be explicit about checks that could not run; do not invent numerical results. If the required artifact fundamentally cannot be produced in the available environment, name that concrete limitation rather than presenting a helper command as completed work.

Automatic aesthetic choices do not authorize purchases, accepting new terms, OS changes, publishing, or unrelated project edits. Choose a suitable already-available option by default. Ask for external action only when it is actually needed and not already authorized.
