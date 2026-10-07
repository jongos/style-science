# Audits

<a id="a1"></a>
## Audit a design without changing it

**Goal:** Review this interface for readability, accessibility and design quality without changing any files.

**When to use:** When you have an existing interface or a concrete design brief.

**Prompt:** Use $dazzler-frontend to review this interface for readability, accessibility and design quality without changing any files.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** Prioritized findings with rendered evidence and clearly separated aesthetic judgments.

**Tips:** This is not an AI-authorship detector or complete accessibility certification.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/browser.cjs inspect`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [design audit](design-audit.md).

<a id="a2"></a>
## Stress-test a responsive layout

**Goal:** Test this UI with long names, large values, missing images, empty data and error states.

**When to use:** When you have an existing interface or a concrete design brief.

**Prompt:** Use $dazzler-frontend to test this UI with long names, large values, missing images, empty data and error states.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** Wide/narrow evidence, applicable scenario results and concrete repairs to recommend.

**Tips:** Absent targets mean not applicable; DOM simulations do not prove backend recovery.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/browser.cjs stress`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [design studio](design-studio.md).
