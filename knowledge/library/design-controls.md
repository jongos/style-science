# Optional refinement, without restarting the design

See [composition and refinement](composition.md) for purpose-based layout contracts, measured review candidates and bounded refinement intents. Preserve intentional repetition and record exceptions; these candidates remain separate from accessibility failures.

Use this only when the user asks for options, wants control, or requests a specific tweak. Default use is automatic through [automatic-workflow.md](automatic-workflow.md). Do not open a selector, ask for aesthetic approval or show a questionnaire before the first result merely because this guide exists.

## Respond at the requested level

- **Direct instruction:** “Make it warmer,” “use Poppins,” or “tighten the spacing” is enough to act. Change the relevant choices, preserve unrelated decisions and recheck affected constraints. Do not require the user to confirm the same instruction in a selector.
- **A few alternatives:** Show two or three meaningful, viable options with the current/recommended choice first. Compare actual headline/body text for fonts and real UI roles for palettes, not names and abstract swatches alone. Ask one focused question when a choice is genuinely requested.
- **Interactive exploration:** If the user asks for a picker, controls or a comparison preview, create or open a local preview in the available host. Use the actual shortlisted font files, palettes and project content. Reuse the color helper's theme/simulation controls where useful. A static comparison or concise choices are valid fallbacks if an interactive host is unavailable; never claim a selector opened if it did not.

## Mockup-first, only when requested

When the user explicitly requests a static comp before implementation, use an available image-generation tool or the supplied reference. Keep the user's brand, actual copy and required controls in the brief. Label the result a **visual proposal**; generated lettering, font shapes, data and controls are not verified implementation. Use licensed assets and do not send private project content to an external service without appropriate authorization.

If image generation is unavailable, explain the limitation and provide a useful local HTML/CSS comp using available tools. Do not call it a generated image. If the user asked to approve before coding, stop at that requested checkpoint; otherwise continue into the authorized implementation without inventing an approval gate. Use [design handoff](design-handoff.md) for reference evidence and conflicts.

Build real text, semantic controls, responsive layout and states in the existing stack. Treat visual fidelity as one review dimension alongside readable type, contrast, focus, reflow, content and task completion. Preserve required information even if a bitmap omitted it. Record deliberate departures from the comp and why they improve the working result.

For an available browser runtime, `browser.cjs compare` accepts **two navigable pages**, not a raw image path. If a comp is a local raster file, create a simple local HTML wrapper with an image and an accurate description. Put both pages and needed assets under the authorized local fixture directory. Use matching viewports and a new output directory:

```json
{"before":"/project/review/comp.html","after":"/project/review/implementation.html","width":1280,"reason":"Compare hierarchy, content and spacing; inspect interactions separately."}
```

```shell
node scripts/browser.cjs compare comparison.json NEW_COMPARISON_DIR
node scripts/browser.cjs inspect /project/review/implementation.html NEW_INSPECTION_DIR
```

The comparison creates side-by-side captures. It does not calculate a pixel-difference or fidelity score, certify accessibility, modify source, or compare native app behavior. Inspect narrow/wide and relevant states separately; report unavailable checks. Remote pages require network access. A bitmap is never evidence that a form, chart or backend works.

## Build selectors from valid choices

Filter font options using the font helper for the required text, styles and features before presenting them. Load actual font assets rather than relying on a browser's similarly named installed face. Keep licenses with preview assets. State whether font-loading and shaping were verified.

Generate color alternatives through the color helper with the current locked values. Changing a seed or theme can invalidate text and action pairs; recalculate before calling the result usable. Show an explicit conflict for an invalid combination instead of silently changing a lock or exporting it as a passing palette. Color-vision simulation is a review aid, not a different palette to save accidentally.

Useful controls, selected to fit the request, include font pairing, palette character, light/dark mode, density, corner treatment and motion amount. Avoid dumping all controls into every task. Keep the current design visible and offer a reset when interactive edits are supported. Separate temporary preview changes from applying them to the project; apply when the user's request authorizes it. Never imply a local browser control persists to source files unless that behavior is implemented.

After applying the chosen adjustment, update the existing tokens/design record where relevant and recheck the changed text, surfaces, layout and states. Continue with the new choices as constraints in subsequent work; do not repeat discovery or rerank the whole design unnecessarily.

## Character Within the Existing Controls

The [art-direction standard](art-direction.md) uses these controls and the existing token system. Basic, professional, quieter and minimal requests constrain intensity and vocabulary, not care or distinctiveness. Do not override explicit settings or maximize every dial mechanically. Seek the strongest coherent voice available within those settings.
