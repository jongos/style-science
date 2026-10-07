# Interactive illustrations and image hotspots

Use this for clickable diagrams, illustrated guides, floor plans and product images with named regions. Choose internally from the artwork and existing stack; do not ask the user to choose a library or enter coordinates. The agent identifies regions, writes their descriptions, exports and verifies the result.

| Artwork and project | Automatic route |
|---|---|
| An SVG with identifiable shapes or groups | Interactive vector adapter; framework independent |
| A PNG/JPEG or flattened illustration in React | React image hotspot adapter |
| A PNG/JPEG or flattened illustration in Vue 3 | Vue image hotspot adapter |
| Standalone image guide without an application | Native browser adapter; no framework or package installation required |

Retain the project's existing framework and approved artwork. Use the visualization adapters for numeric chart geometry. This helper adds interaction to supplied artwork; it does not infer shapes from pixels, draw a complete infographic from prose, or recreate a missing image. The agent can author suitable vector artwork using the existing design workflow when that is part of the brief.

## Export internally

```shell
node scripts/hotspots.mjs --config regions.json --art illustration.svg --out NEW_DIRECTORY
```

```json
{
  "kind": "svg",
  "title": "Explore the studio",
  "description": "Choose a room to see its purpose.",
  "imageAlt": "A floor plan with a gallery and workshop.",
  "font": "Work Sans",
  "color": "#7048E8",
  "regions": [
    {"id":"gallery","label":"Gallery","description":"Exhibitions and space to pause."},
    {"id":"workshop","label":"Workshop","description":"A shared space for making and learning."}
  ]
}
```

For images, use `kind:"image"`, `framework:"react"` or `"vue"`, the exact intrinsic `width` and `height`, and a `shape` plus `coords` per region. Coordinates stay in original image pixels: rect `[left,top,right,bottom]`; circle `[cx,cy,radius]`; poly `[x1,y1,x2,y2,x3,y3,...]`. Define meaningful, non-overlapping zones. The helper measures PNG/JPEG dimensions and checks them against the configuration before export. Static SVG images use their viewBox dimensions.

The agent supplies `source` when artwork or information needs a credit/data label. It is displayed in the closing notes, alongside implementation attribution. Pass the project's font and selection color; use existing color helpers to check the selection contrast against the actual artwork. The selection also has a named button and detail panel, so color is not the only cue. Fonts are referenced, not installed or embedded. Do not recolor an approved illustration without authorization.

Standalone image exports default to `framework: "native"`. Use `react` or `vue` only when the host already uses that framework. The native adapter supports rectangles, circles and polygons with the same validated coordinates.

## Imported SVG contract

Use a static SVG with a valid viewBox and unique IDs for the selected shapes/groups. Supported elements are svg, g, path, rect, circle, ellipse, line, polyline, polygon, text, tspan, title, desc, defs, linearGradient, radialGradient, stop and clipPath. Basic presentation attributes and local paint/clip references are supported. The importer rejects scripts, events, external resources, stylesheets/style attributes, foreign content, entities and unsupported constructs before embedding.

When artwork uses unsupported editor metadata or CSS, the agent should prepare an equivalent plain SVG with presentation attributes and inspect that conversion against the original. Do not silently drop meaningful artwork. The helper is deliberately restricted: 2 MB SVG text, 5,000 nodes, 40 levels and 60 named regions. Other image files are limited to 8 MB and 10,000 pixels per dimension. Complex or self-intersecting hotspot polygons need manual geometry review; do not interpret bounding checks as a topology audit.

## Deliver and integrate

The export includes an offline `index.html`, runtime bundle, original/validated illustration, `regions.csv`, configuration, adapter modules, CSS, a dependency fragment, integration instructions and license notices. Existing output folders and exports into the installed skill are refused. The report says **exported**, not browser-verified.

Use the standalone page directly or integrate `adapter.mjs` into the current project. Merge the dependency fragment rather than replacing package.json. Use the host's existing compatible React/React DOM or Vue runtime, and call the returned cleanup function on unmount. The adapter owns its container subtree. Do not load multiple framework runtimes into the application merely because the preview bundles include them. A different artwork/configuration must pass through the exporter again; exported mount functions assume validated input.

The vector route has keyboard-accessible region activation and zoom/pan/reset buttons. Image routes supply clickable regions, responsive coordinate scaling and keyboard activation. Every route also has named selection buttons, a live detail panel and all descriptions in a text list. This does not constitute a complete accessibility certification. Check real region clicks/taps, Enter/Space, focus visibility, selected labels, mobile resizing, text alternatives and actual font loading in the final artifact. Keep all descriptions available if interactive rendering is unavailable.

## Notes and credits

- Vector manipulation: [SVG.js](https://github.com/svgdotjs/svg.js), pinned 3.2.8, MIT; Wout Fierens and contributors.
- Image regions: [Img Mapper](https://github.com/img-mapper/img-mapper), Nisharg Shah and contributors, MIT. React package pinned 2.0.2; Vue package pinned 0.1.0. The older Vue package initializes map areas in its update lifecycle; the Dazzler adapter requests that first update after image load and has dedicated browser checks. Repository release tags and published package versions are not interchangeable.
- Preview runtimes: React/React DOM 19.2.4 and Vue 3.5.43, MIT. XML validation: @xmldom/xmldom 0.9.12, MIT. Fifteen constituent package notices and hashes are retained in `scripts/vendor/hotspots/`. Preserve those notices when redistributing.
- Original orchestration, interface controls and demonstration artwork: Jon Gosier / Dazzler, Apache-2.0. New packages were inspected and pinned on 28 September 2026. No external model service is required by these adapters.
