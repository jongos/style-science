# Documents

<a id="d1"></a>
## Redesign a Word report

**Goal:** Make this Word report polished and easier to read while preserving every fact and document object.

**When to use:** When you have a document or verified notes to improve.

**Prompt:** Use $dazzler-frontend to make this Word report polished and easier to read while preserving every fact and document object.

**Exercises:** Check reading measure, heading hierarchy, selective emphasis, font coverage and every printed page.

**Expect:** A revised DOCX plus page-by-page render checks and any preservation limitations.

**Tips:** Use host document tools for existing files; the basic content exporter cannot preserve arbitrary objects.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/project.py export`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [design studio](design-studio.md).

<a id="d2"></a>
## Improve a resume

**Goal:** Make this resume clear, distinctive and professional without changing my facts.

**When to use:** When you have a document or verified notes to improve.

**Prompt:** Use $dazzler-frontend to make this resume clear, distinctive and professional without changing my facts.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** A readable resume with consistent dates, hierarchy and checked pagination.

**Tips:** Aim for one page only if the supplied content fits; do not claim ATS certification.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/fonts.py recommend`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [typography](typography.md).

<a id="d3"></a>
## Write a one-page decision brief

**Goal:** Turn these notes and this table into a compelling one-page decision brief.

**When to use:** When you have a document or verified notes to improve.

**Prompt:** Use $dazzler-frontend to turn these notes and this table into a compelling one-page decision brief.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** A print-ready brief with decision, evidence, table and next actions.

**Tips:** Retain units, caveats and all decision-critical information; inspect the actual page.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/project.py export`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [design studio](design-studio.md).
