# Local runtime and automatic decisions

Normal font, color, token, template, chart and interactive illustration work uses bundled files. It does not require a package registry, CDN, model API or original author's service. The host agent supplies reasoning; Node and Python execute the local helpers. Browser previews contain their runtime code and can open offline.

On the first substantive use of an installed release, run `python scripts/health.py` internally. It checks the executable, reference and asset inventory and reports optional local capabilities without installing anything. Run it again after an installation change or suspected corruption, not before every small operation. If integrity fails, identify the affected files and restore a trusted release; do not regenerate the inventory to hide an unexplained change. The inventory detects modification against local expected hashes; it is not a signature or proof that an untrusted distribution is safe.

For an ambiguous technical route, prepare a small task object and run `node scripts/route.mjs task.json`. Accepted task kinds are interface, document, slides, chart and illustration; frameworks are none, react, vue and other. The helper gives routing reasons and verification requirements, and never installs packages or modifies the project. The existing brand, framework and explicit brief take precedence. Select fonts and colors with their measured local helpers after choosing the route.

For images in standalone pages, use `framework: "native"` (the default) to avoid loading an application framework. Existing React and Vue projects retain their matching integration. Compact charts are selected only for explicit, complete single-series trends; preserve missing values and full chart semantics otherwise. Schema URLs in chart files identify formats and are not fetched by the exporter.

JSON CLI inputs are bounded to 8 MB, 64 levels and 150,000 visited values in the Node helpers. Artwork has separate geometry limits. Do not expand limits silently or stream arbitrary untrusted data into a renderer. Exporters refuse existing directories and resolved paths within the installed skill. Prepare orientation-normalized raster artwork and verify region placement against the final pixels. Generated artifacts still need visual and interaction inspection.

## Host capabilities and fallbacks

| Capability | Local requirement | When unavailable |
|---|---|---|
| Fonts, templates, assets, HTML documents | Python standard library | Use an available host Python runtime |
| Colors, charts, interaction exports | Node (tested with the maintenance host's version) | Use an available host Node runtime |
| Browser inspection | Host browser or existing Playwright/Chromium | Report inspection as not run |
| Native editable Office charts | Existing R and approved chart packages | Export clearly labelled SVG/HTML; do not claim native editing |
| Native DOCX/PPTX composition | Existing document libraries | Use HTML edition or bundled templates where appropriate |

These optional native integrations are not contained in the core JavaScript build kit. No automatic installation, telemetry, background updater or network service is part of routine use. A user's project may still intentionally depend on its own framework, assets and backend.

## Notes and credits

Bundled engines remain licensed third-party code with retained notices, not newly claimed original implementations. Dazzler owns the integration, routing, validation and release decisions. The separately retained maintainer build kit contains the exact local package sources and build executable for the recorded OS/architecture. It permits offline rebuilds on that platform; Node, Python, browsers and optional Office runtimes remain host prerequisites. See the root maintenance documentation for controlled source updates and license records.
