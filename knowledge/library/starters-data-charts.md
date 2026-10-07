# Data Charts

<a id="c1"></a>
## Explain a CSV with charts

**Goal:** Turn this CSV into a clear branded set of charts with labels, units and a data table.

**When to use:** When you have actual data and a clear audience.

**Prompt:** Use $dazzler-frontend to turn this CSV into a clear branded set of charts with labels, units and a data table.

**Exercises:** Preserve source values and units, choose the chart for the analytical relationship, check contrast and provide non-color cues.

**Expect:** Charts grounded in supplied rows, accessible equivalents and stated missing-value handling.

**Tips:** Do not invent observations or describe CSV visualization as Excel workbook editing.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/visualize.mjs`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [visualization](visualization.md).

<a id="c2"></a>
## Add a React sparkline

**Goal:** Add a compact, readable sparkline for this complete data series in the existing React UI.

**When to use:** When you have actual data and a clear audience.

**Prompt:** Use $dazzler-frontend to add a compact, readable sparkline for this complete data series in the existing React UI.

**Exercises:** Check the supplied evidence, choose a suitable visual direction, implement within the authorized scope, and inspect the result.

**Expect:** An integrated React component with trend context and a text equivalent.

**Tips:** Use the current React runtime; handle incomplete or unsupported series through another chart route.

**More control:** Optional: specify audience, required brand values, target format and constraints. Leave visual choices to Dazzler unless you want control.

Agent route: `scripts/visualize.mjs`. Read the linked workflow for arguments and schemas; this is not a command to paste.

Workflow: [visualization](visualization.md).
