# Template library

These files demonstrate possible outputs of the skill. Do not automatically select one as the structure or appearance for a new task. Start with the user's prompt and generate its own design system, including a deliberate page background. Inspect examples to understand capabilities, not to inherit their look. Export an example only when the user explicitly selects it or asks to work from that file. Preserve verified facts and supplied brand constraints.

The current legacy catalog is retained for compatibility while its release gallery is replaced by freshly generated, prompt-led demonstrations. Its availability is not evidence that a new release has completed that regeneration.

The machine-readable inventory is [catalog.json](../assets/templates/catalog.json). It contains 30 entries, file hashes, category, format, purpose and font information.

## Documents: 10 DOCX and 10 matching HTML files

| Category | Starting point |
|---|---|
| Professional | Project status report |
| Legal | Matter memorandum with questions, facts, analysis and authorities |
| Business | Proposal with scope, deliverables and timing |
| Fun | Game night invitation |
| Family | Weekly planner |
| Presentation | Landscape presentation handout and speaker outline |
| School | Student project report |
| Marketing | Campaign creative brief |
| Restaurant | Seasonal dining menu |
| Technical | Technical design specification |

IDs follow `docx-professional` and `html-professional`, replacing the category as needed. DOCX files use editable Word styles and native tables. Desktop fonts are context-specific Arial, Georgia, Trebuchet MS or Consolas, referenced rather than embedded; inspect substitution in the target application. HTML files select from seven bundled families, including display, serif, sans and monospace faces with available genuine italic companions with local font notices, responsive layouts and print rules. The legal layout supplies no legal clauses or jurisdiction-specific advice. The presentation document is a Word handout, not a PPTX deck.

## UI: 10 folders

Each folder contains `index.html`, `styles.css`, and `template.json`.

| ID | Purpose and local interaction |
|---|---|
| webapp-workspace | Project overview, search and add-project dialog |
| webapp-board | Sprint board with assignee filtering, priorities, points, add and move actions |
| webapp-settings | Profile, notification and regional preferences |
| data-revenue | Gross/refunds/net reconciliation with period filtering, chart, table and matching CSV |
| data-operations | Support queue with response targets, resolve actions, queue filtering and CSV |
| restaurant-fine-dining | Editorial seasonal dining site |
| restaurant-cafe | Menu filters and an order preview |
| restaurant-reservations | Reservation request form and local summary |
| restaurant-menu | Categorized menu with filters |
| business-portal | Client deliverable review, local approval/revision and milestone billing |

No template submits data, accepts payments, makes bookings or persists changes. Labels disclose demo behavior. Connect authorized services only when the project calls for them. Example restaurant names, people, prices and figures are fictional. Keep the JSON and the embedded `template-data` block synchronized when changing interactive sample data; edit HTML/CSS for displayed content and layout. JSON is a design/data specification, not a live configuration server. No npm build or network font service is required.

## Export an Explicitly Selected Example

```shell
python scripts/templates.py list --format ui --category restaurant
python scripts/templates.py export restaurant-cafe --out NEW_PROJECT_DIR
python scripts/templates.py export docx-business --out NEW_PROJECT_DIR
```

The helper verifies hashes, refuses overwrites and copies the required fonts, licenses, scenario data, charts and interaction assets with relative paths intact. Open the returned entrypoint. Do not copy HTML alone and lose its font folder. A DOCX export has no bundled font dependency. Reusing the templates does not require the authoring dependency `python-docx`.

For final documents, follow the host's document workflow and render the customized result. For UI, test the actual content at narrow/wide widths, keyboard focus and primary actions. Defaults are not evidence of accessibility for later changes.

## Worked examples, not empty outlines

Version 0.15.0 contains fictional, internally consistent examples. Replace every sample name, date, price, metric, contact and claim before delivery; do not carry examples forward as user facts. DOCX documents span one to three planned pages (20 pages total). The proposal includes a fee and payment schedule; the legal memo separates supplied evidence from missing authority; the family planner covers all seven days; the RFC includes a payload and failure policy. Restaurant layouts distinguish browsing, pickup ordering, table requests and editorial dining.

The revenue dashboard derives net revenue, totals and exports from the selected rows. Booking dates follow the stated Tuesday–Saturday service schedule. All UI state remains local and resets on reload. No native AI-host execution is implied by package validation.

## Expressive, automatic and purposeful

Choose a visual identity suited to the content: cobalt status reporting, restrained plum legal analysis, violet/coral proposals, playful pink/blue invitations, teal household planning, lime-on-midnight presentation, green science, vermilion campaign briefs, oxblood menus or cyan technical writing. These are examples, not required palettes. Carry meaning through spacing, scale, bold colored terms and true italics, while keeping longer reading comfortable.

Use the scenario JSON as the data source when adapting a demonstration. Document fixtures contain complete page content plus structured figures; UI JSON supplies row-level sample records and reference series. Reconcile totals, distinguish targets from observed results and retain synthetic labels until verified project facts replace them. Use charts, data tables and meaningful interactions only where they help the task. The reservation example includes a keyboard-selectable seating guide; the revenue example has twelve reconciled months and four quarter filters.

Preview all 30 individual artifacts in `assets/templates/index.html`. Word preview links contain actual Microsoft Word page snapshots, with 20 pages across the collection. HTML/UI thumbnails are browser captures. Printable document editions use deliberate page breaks and colored hierarchy; interface print styles preserve useful information and a static seating plan. Re-render after customization: saved screenshots do not validate later edits or another computer's font substitutions.

## Theme one file

HTML and UI source is formatted for direct editing. Each example has a separate `tokens.css` and a semantic `tokens.json` contract. Edit that stylesheet for precise brand choices, or run `node scripts/studio.mjs tokens --config BRAND_JSON --template TEMPLATE_TOKENS_JSON --out NEW_DIRECTORY` and replace only the example’s `tokens.css` with the generated one. Recheck rendered contrast and hierarchy after retheming; locked colors may conflict. Re-export chart figures and artwork separately when their colors must change.

## Notes and credits

Original template layouts, synthetic scenarios and demo code: Jon Gosier, Apache-2.0. Fonts retain their separate notices. Rebuild source: `tools/build_templates.py`; publication source: `tools/publish_template_gallery.py`. Generation is a maintenance operation, not a user setup step.
