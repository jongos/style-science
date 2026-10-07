# Slides

<a id="s1"></a>
## Restyle an existing deck

**Goal:** Restyle this presentation as a coherent branded deck while preserving its content and editable objects.

**When to use:** When you have presentation content or an existing deck.

**Prompt:** Use $dazzler-frontend to restyle this presentation as a coherent branded deck while preserving its content and editable objects.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** A revised native deck and a visual review of every slide.

**Tips:** Use host presentation tools; the content exporter is not a lossless PPTX editor.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/studio.mjs tokens`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [design studio](design-studio.md).

<a id="s2"></a>
## Build a decision deck with a chart

**Goal:** Make a concise decision presentation from these facts and data, with an editable chart if supported.

**When to use:** When you have presentation content or an existing deck.

**Prompt:** Use $dazzler-frontend to make a concise decision presentation from these facts and data, with an editable chart if supported.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** A decision-led deck, chart source data and explicit editable/static status.

**Tips:** Native charts require R, mschart and officer; label SVG/HTML fallback as static.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/visualize.mjs`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [visualization](visualization.md).
