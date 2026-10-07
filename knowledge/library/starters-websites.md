# Websites

<a id="w1"></a>
## Refresh an existing website

**Goal:** Refresh this website while preserving its brand, content and existing framework.

**When to use:** When you have an existing interface or a concrete design brief.

**Prompt:** Use $dazzler-frontend to refresh this website while preserving its brand, content and existing framework.

**Exercises:** Preserve the brand, establish a primary action, check narrow reflow and keyboard focus, and save accepted decisions.

**Expect:** A working refresh with narrow/wide previews and a short change summary.

**Tips:** Review the existing tokens and primary user journey before changing code.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control. If you supply a Figma frame, use available authorized read tools and preserve existing project tokens; otherwise use your supplied export and label the evidence gap.

Agent route: `scripts/browser.cjs inspect`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [design studio](design-studio.md), [design handoff](design-handoff.md).

<a id="w2"></a>
## Give a landing page stronger contrast

**Goal:** Make this landing page more vivid and readable, keeping its message and main action.

**When to use:** When you have an existing interface or a concrete design brief.

**Prompt:** Use $dazzler-frontend to make this landing page more vivid and readable, keeping its message and main action.

**Exercises:** Match the audience and stakes, make the main action clear, and inspect error recovery and keyboard controls.

**Expect:** A coherent palette, clearer type hierarchy and measured foreground/background pairs.

**Tips:** Preserve required brand colors; report conflicts instead of silently replacing them.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control. Ask for a visual comp first only if you want one. Image generation depends on the host; a static proposal must still become real text and controls with rendered checks.

Agent route: `scripts/colors.mjs recommend`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [color workflow](color-workflow.md), [design controls](design-controls.md).

<a id="w3"></a>
## Compare a redesign proposal

**Goal:** Show a before-and-after redesign proposal for this page without changing the original.

**When to use:** When you have an existing interface or a concrete design brief.

**Prompt:** Use $dazzler-frontend to show a before-and-after redesign proposal for this page without changing the original.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** Separate proposal files, comparison images and the reasons for each major change.

**Tips:** Keep the original read-only; apply the proposal only when requested.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/browser.cjs compare`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [design studio](design-studio.md).

<a id="w4"></a>
## Integrate Tailwind tokens

**Goal:** Make the design tokens in this Tailwind project consistent with its established brand.

**When to use:** When you have an existing interface or a concrete design brief.

**Prompt:** Use $dazzler-frontend to make the design tokens in this Tailwind project consistent with its established brand.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** Version-appropriate theme mapping and a rendered component check.

**Tips:** Inspect Tailwind version and existing configuration; merge rather than replace it.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/studio.mjs tokens`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [design studio](design-studio.md).
