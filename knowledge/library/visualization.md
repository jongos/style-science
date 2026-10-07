# Visualization rendering and automatic selection

Read this for real charts, dashboards, data graphics, compact React metrics or editable Office charts. Use the existing project renderer when it already meets the brief; otherwise choose the appropriate adapter internally. The user supplies the purpose and data, not a library decision.

## Select the smallest suitable route

| Need | Route | Implemented scope |
|---|---|---|
| Compare, trend, distribution or relationship | Vega-Lite → Vega | Bar, line, area, scatter, histogram, boxplot, heatmap; offline interactive HTML and SVG |
| Relationship graph, hierarchy, geography | Selected D3 modules | Deterministic force network, treemap, GeoJSON Mercator map |
| Tiny trend in an existing React interface | Microcharts | Static sparkline or area component, actual SSR SVG, pinned dependency fragment |
| Editable Word or PowerPoint chart | mschart + officer | Native bar, line, area and scatter when approved R runtime is available |

Do not replace the application's framework or load all engines into every page. The helper bundles are self-contained for Node rendering; ordinary Vega/D3/Microcharts preview generation needs no npm install. Generated React source imports the project's own React and the pinned Microcharts package, avoiding a second React copy. An agent can integrate the warranted dependency using the project's existing package manager. No model service or API key is required.

## Internal command and data contract

```shell
node scripts/visualize.mjs --config chart-input.json --out NEW_DIRECTORY
```

```json
{
  "goal": "comparison",
  "title": "Revenue by quarter",
  "description": "Compare the supplied quarterly values.",
  "source": "Approved quarterly report",
  "unit": "USD",
  "xLabel": "Quarter",
  "yLabel": "Revenue",
  "font": "Work Sans",
  "data": [{"x":"Q1","y":42000},{"x":"Q2","y":54000}]
}
```

The agent chooses explicit `type` when needed; goal defaults are comparison/composition→bar, trend→line, relationship→scatter, distribution→histogram. Composition means compare contributions; it does not silently compute percentages. `format` is html (default), svg, react, docx or pptx. Rendering always supplies a review HTML, SVG and source CSV, even when another format is requested. Standard inputs accept 1–10,000 rows and at most eight series. `series` is optional; `y:null` is missing, not zero. `xType` can be nominal, ordinal, quantitative or temporal; temporal input uses ISO dates. Duplicate x/series pairs are rejected for bars, lines, areas and heatmaps rather than silently aggregated. Histogram bins and boxplots summarize the supplied observations; preserve source rows in the table.

Pass project font and approved palette explicitly as `font`, `colors` (one opaque hex per series) and `background`. Colors otherwise come from Dazzler's measured chart helper. `chart.json` records palette contrasts; weak supplied graphic contrast is reported, not silently changed. Heatmaps use a continuous background-to-first-color ramp, not the categorical palette. Fonts are references: export/install licensed files and verify loading in the target artifact. The adapter does not embed fonts.

D3 uses `network:{nodes:[{id,label?}],links:[{source,target}]}`, `treemap:{name,children:[{name,value}]}`, or `map:{type:"FeatureCollection",features:[...]}`. Networks are limited to 150 nodes/1,000 links; hierarchies to 300 nodes/30 levels; maps to 2,000 features. Provide legitimate GeoJSON and attribution. A plain map depicts geography, not a choropleth or a quantitative encoding.

React output currently supports one complete line/area series. `DazzlerSparkline.jsx` and `dependencies.json` are integration artifacts, not a replacement package.json. Other Microcharts types remain available through the upstream package but are not implemented by this helper. Use Vega or the existing project chart library for larger/complex React charts. Generated tiny charts have an accessible summary and a table in their review artifact.

## Native Office runtime

The helper writes CSVs and `office-chart.R`, then attempts an existing `Rscript`. It requires mschart >=0.5.1 and officer >=0.7.5. It does not install R or packages. When unavailable, `report.json` says `runtime-unavailable`, `status:fallback`, and provides setup guidance. Do not call the static SVG an editable Office chart. If native editability is essential, guide the user through an approved runtime installation or use an existing host's native chart capability. After installation, the agent runs:

```shell
Rscript --vanilla office-chart.R OUTPUT_DIRECTORY
```

The adapter refuses an existing native output. Validate actual Word/PowerPoint rendering and the embedded data after generation. This release's native execution was not tested because the maintenance host lacked R. mschart also supports Excel upstream; this adapter currently exports DOCX/PPTX only. Additional Office chart types require a reviewed adapter extension.

## Review and export

Read `report.json`, check the source CSV against the input, inspect desktop/mobile output and relevant interactions. Scatter plots support pan/zoom; other standard views provide the Vega SVG and data table. No remote data URLs are loaded. Browser print provides PDF; a host browser can capture PNG. These are not dedicated native PDF/PNG exporters. SVG preserves geometry, but does not retain Office chart editability.

For bars/areas keep a meaningful zero baseline; preserve missing observations and temporal order; distinguish actual, forecast and illustrative data. Use direct labels or non-color cues, meaningful units, a source, and an accessible data equivalent. A library's accessibility features do not certify the final artifact. Avoid inferring causation from correlation, reconstructing missing values without authorization, or generating chart geometry with an image model.

For interactive regions on artwork rather than plotted observations, use [interactive illustrations](interactive-illustrations.md).

## Notes and credits

- [Vega](https://github.com/vega/vega) and [Vega-Lite](https://github.com/vega/vega-lite): BSD-3-Clause; University of Washington Interactive Data Lab and contributors.
- [D3](https://github.com/d3): ISC; Mike Bostock and contributors. Selected hierarchy, force and geography modules only.
- [Microcharts](https://github.com/ganapativs/microcharts): MIT; retain the package's author notice.
- [mschart](https://github.com/ardata-fr/mschart): MIT; David Gohel/ArData and contributors. Runtime is optional and not redistributed here.
- [bkrsln/dataviz](https://github.com/bkrsln/dataviz): credited discovery directory, not a runtime dependency or copied asset collection. Its linked [From Data to Viz](https://www.data-to-viz.com/) and [FT Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary) are useful chart-selection references. Consult their original sources; no graphics or prose are vendored from them.

Bundle versions, constituent licenses and hashes are in `scripts/vendor/viz/provenance.json`. Rebuild through repository `tools/build_visualization.mjs`; do not edit generated engines. Existing font/color notices remain separate.

## Source-Anchored Editorial Layers

For single-series bar, line or scatter in HTML/SVG, add `annotations: [{"x":"Mar","text":"Peak: 42"}]` and `referenceLines: [{"y":30,"label":"Approved target: 30"}]`. An annotation derives y from an existing nonmissing source row; optional `position` is `above` or `below`. Supply at most six annotations and three reference lines. Other engines/encodings reject these layers rather than silently drop them. The caller must verify the annotation wording and reference source. Render and inspect collisions; use shorter labels or adjacent prose if needed. No automatic takeaway or causal inference is generated.
