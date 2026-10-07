# Scoped Agent Workflows and Evidence

Use this when coordinating substantial work or a requested audit. A small change can use direct project tools and the relevant final checks without generating a report. The helper plans work; the agent still implements and verifies the actual artifact.

```shell
node scripts/workflow.mjs plan task.json
node scripts/workflow.mjs assess evidence.json
```

Example task: `{"kind":"interface","framework":"react","scope":"substantial","intent":"adapt","features":["forms","motion"]}`.

Kinds: interface, document, slides, chart, illustration. Frameworks: none, react, vue, other. Scopes: small, substantial. Intents use the shared refinement resolver. Optional features: forms, motion, data, print, editable. Infer these from the actual work; users do not need to supply JSON. `editable` requests edit-resilience checks for native output. A small scope still needs checks for affected functionality; select relevant features and broaden the scope when necessary.

For an existing route request, add `"workflow":{"scope":"substantial","features":["forms"]}`. The router uses its kind, framework and refinement intent to return a compatible workflow. Omitting workflow preserves the existing routing contract. The report names relevant reference files and starts every check as `not-run`.

## Focused Intents

| Intent | Work and Evidence |
| --- | --- |
| audit | Read-only technical review with locations and evidence; separate deterministic failures from interpretive design concerns |
| layout | Adjust grouping, alignment and rhythm for actual content; compare reading order and adjacent sections |
| adapt | Preserve the task across viewports, zoom and content extremes; test access to controls and information |
| optimize | Measure the slow task, fix the observed cause, compare under matching conditions and retest behavior |
| clarify | Improve action labels, instructions and recovery copy; preserve facts and protected wording |
| extract | Consolidate repeated components/tokens after confirming a shared contract; check all affected consumers |

Existing bolder, quieter, typeset, colorize, polish, harden, critique and distill intents remain available. Audit and critique cannot generate tokens or accept visual change dials. Intent names select procedures; they do not imply that source changes or tests have run.

## Record Only Observed Evidence

An assessment input contains `task`, `target`, `revision` and `observations`. Target identifies the artifact or route; revision identifies the reviewed saved state (commit plus diff identifier, artifact hash, or another explicit snapshot). Each observation has a planned check `id`, `status` (pass, fail or not-run), `evidence` (an array of actual report/screenshot/test-log references) and `detail` (scope and finding). Pass and fail require at least one evidence reference. Missing observations remain not-run; unknown and duplicate check IDs are rejected.

Use an empty observations array to see missing coverage. Never invent logs or use a screenshot as proof of untested interactions. An unavailable runtime is a not-run observation with a reason, not a pass. Keep evidence in the project's authorized review location; do not expose private content to an external service.

The helper reports `findings`, `incomplete` or `evidence-complete`. The last means all selected checks have supplied passing observations; it does not inspect references, authenticate claims, establish freshness or grant release approval. Review the evidence itself. There is no synthetic overall design score. After a material edit, refresh affected evidence against the new revision. Deliver a concise account of the artifact, actual checks and remaining limitations.

## Distinction Evidence

Every planned scope includes distinction. For small edits, assess the affected area within the established voice; no surrounding redesign or standalone report is required. A `distinction` observation with `status: "pass"` requires `designReview` with nonempty `voice`, `promptFit`, `definingMove`, `restraint`, `supportingChoices` (1–8 concrete strings) and `verdict: "distinctive"`. Attach actual render references in the observation's `evidence`. A verdict of `generic` or `incoherent` cannot accompany a pass; record failure, revise the design and refresh the render. Missing reviews cannot establish completion. These are reported judgments, not machine-verified aesthetic quality.

The agent supplies this evidence from its work; users need not fill a form or approve an aesthetic. Do not add review metadata to the user-facing artifact. Keep read-only audits read-only.
