# Brand

<a id="b1"></a>
## Extract a brand system

**Goal:** Derive a usable design system from this existing site and its brand files.

**When to use:** When you have brand evidence or representative copy.

**Prompt:** Use $dazzler-frontend to derive a usable design system from this existing site and its brand files.

**Exercises:** Separate brand seeds from accessible roles, verify licensed font coverage, and record reusable decisions.

**Expect:** Traceable observations, resolved tokens and visible conflicts.

**Tips:** Observed frequency is evidence, not permission to lock a brand value.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/project.py brand`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [design studio](design-studio.md).

<a id="b2"></a>
## Choose fonts for multilingual copy

**Goal:** Choose and demonstrate a font pairing for this project using the actual multilingual copy.

**When to use:** When you have brand evidence or representative copy.

**Prompt:** Use $dazzler-frontend to choose and demonstrate a font pairing for this project using the actual multilingual copy.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** A licensed shortlist checked for coverage, weights, italics and layout.

**Tips:** Check all required scripts; use a suitable available fallback when the compact profile lacks a face.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/fonts.py recommend`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [typography](typography.md).

<a id="b3"></a>
## Expand a locked palette

**Goal:** Expand these required brand colors into a coherent light and dark interface palette.

**When to use:** When you have brand evidence or representative copy.

**Prompt:** Use $dazzler-frontend to expand these required brand colors into a coherent light and dark interface palette.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** Role-based colors with measured contrast and unresolved locks called out.

**Tips:** Do not silently change required colors or equate harmony with readability.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/studio.mjs tokens`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [color workflow](color-workflow.md).
