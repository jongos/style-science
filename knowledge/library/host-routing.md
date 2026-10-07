# Host routing

The design guidance requires no Claude CLI, Anthropic API, MCP server or model-specific SDK. Use the offline Python font helper and bundled Node color helper internally when those decisions are in scope and the runtimes are available. Normal use needs no npm install or third-party Python packages. Catalog-maintenance dependencies are separate and must not be installed in the user's project merely to use the skill. The automatic workflow explains how to continue when a runtime is unavailable.

- Existing codebase: use its framework, package manager, components, tokens, and available development commands. Add dependencies only when the actual feature warrants them. Keep CSS specificity predictable.
- Documents/slides: use the available artifact workflow with [document design](document-design.md). Its exporter still follows [final artifact gates](delivery-gates.md); inspect saved headings and rendered pages before delivery.
- Complete new website: when the installed Sites skill applies, read and follow it for creation and preview. This skill supplies aesthetic guidance, not a replacement hosting workflow.
- Inline interactive explanation or mockup: use the installed visualization skill when available and suited to the requested output.
- Original raster artwork: use the installed image-generation skill/tool when needed. Prefer existing assets or code-native vector graphics when appropriate.
- Rendered inspection: use the available browser or preview tools and their instructions. Do not assume a particular browser, localhost port, or screenshot API exists.
- Supplied design file or requested comp: follow [design handoff](design-handoff.md). Use available authorized Figma read tools; comp generation is opt-in and depends on the host. Remote reads use the network; no connector or image runtime is bundled.

These integrations are optional and selected by the requested deliverable. Do not install them automatically, switch platforms unexpectedly, or call unavailable tools. If preview or execution is unavailable, provide the useful source or specification and identify what remains unverified. Do not claim a static mockup has working backend behavior. Publishing and other external actions retain the user's authorization requirements.
