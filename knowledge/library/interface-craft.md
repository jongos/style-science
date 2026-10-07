# Interface craft

## Layout, density and typography

Make grouping visible through relationships: tighter space within a unit, more space between units; aligned baselines and edges; stable reading order. Give high-priority content room without applying landing-page whitespace to operational tools. Let content and available width determine the grid instead of forcing every screen into three equal columns. Design narrow layouts around the task, not by shrinking desktop text.

Use the [font workflow](typography.md) for actual font selection. Inspect long labels, empty data, large numbers and realistic paragraphs. For comparable numeric columns, use end/right alignment as appropriate to the content and locale, consistent precision, and supported tabular numerals; align headers with their values. Avoid layout shifts from weight changes unless space is reserved. Do not make secondary content unreadable to create hierarchy.

## Components and states

Specify and exercise applicable states, rather than implementing only the resting appearance:

| Component | States and behavior to consider |
|---|---|
| Button or action | Default, hover, pressed, keyboard focus; disabled/loading for async or unavailable actions; duplicate-submit protection |
| Input or form | Default, focus, entered value, invalid, disabled/read-only where used; submission, retained input and inline error explanation |
| Tab, switch or selection | Selected/unselected, focus, disabled where used; correct role and expected keys |
| Data view | Populated, empty, loading, error; sort/filter/reset feedback and overflow |
| Dialog or drawer | Open/close, sensible initial focus, modal focus containment where appropriate, Escape policy and focus return |

Do not invent destructive, loading or error states where the component has no corresponding operation. Rank actions by importance; use destructive emphasis where it clarifies a real consequence. Name the outcome in the label. Prefer native elements and established accessible primitives.

Forms need associated labels; placeholders are supplementary. Use appropriate input types, autocomplete and input modes, and preserve password-manager/paste support. Choose validation timing that helps correction without interrupting entry. Keep input on failure and associate error text with the affected field. Avoid autofocus that unexpectedly opens a mobile keyboard or disorients navigation. Keep the save model clear: immediate controls and batched forms should behave predictably.

Use the lightest overlay suited to the task. Trap focus for modal dialogs, not indiscriminately for every popover. Return focus when appropriate and do not strand it on removed content. Avoid opening nested modals when a clearer flow is possible. Keep important failures visible near their cause rather than only in a disappearing toast.

Empty states explain what can happen next; loading states communicate progress without promising a duration; failures preserve context and offer a realistic recovery. For optimistic updates, implement rollback and visible failure handling when suitable; do not optimistically imply completion of consequential operations without the product's established behavior.

## Motion

Use motion to explain origin, progress or state. Prefer transform/opacity when they meet the need, and profile any layout animation required by the product. Match duration to distance and task frequency; small transitions often need only a brief interval, and frequent keyboard actions may need none. Do not impose springs, a strict time limit or animation on every interaction.

Content should remain visible if enhancement scripts fail. Respect reduced-motion preferences, avoid unnecessary large movement and provide required pause controls. Reduced motion does not require replacing every effect with a fade; an immediate state change is often best. Never make completion of an animation necessary to understand or operate the control.

## Icons and imagery

Use a coherent icon system with compatible grid, weight, optical size and corner treatment. Existing brand icons or a suitable standard library need not be replaced merely because they are common. Give meaningful icon-only controls accessible names; hide purely decorative icons from assistive technology. Avoid decorative icons repeated above every heading without a content purpose.

Choose imagery for evidence or atmosphere that fits the brief: actual product views, relevant photography, or a coherent illustration system. Define crop, lighting, perspective and treatment across the set. Verify usage rights before copying external assets. Do not fabricate product screenshots, endorsements or customer evidence. If custom art is needed, use the appropriate available tool; ordinary SVG diagrams and useful code-native graphics remain valid. Measure text over imagery against the actual background.

## Themes and accessibility

Use [the color workflow](color-workflow.md) to derive and measure semantic roles for each theme. Make surfaces distinguishable at the intended density; dark mode is not a global inversion. Pure black, white and vivid accents are not forbidden when the brief or accessibility requires them. Check each real adjacency and state instead of trusting a decorative seed or canned preset.

Keep keyboard focus visible and unobscured. An outline is valid and often robust in forced-colors modes; do not replace it with box-shadow solely for stylistic reasons. If shadows supply focus treatment, provide an appropriate forced-colors fallback. Check modal focus, reading order, labels, error association and meaningful link names. Provide non-color cues for statuses and chart categories and non-drag alternatives where required.

Use WCAG 2.2 AA as the normal design target where applicable, without claiming conformance from partial checks. Target Size Minimum, 2.5.8 requires 24 CSS px targets or qualifying spacing/other exceptions; comfortable touch targets are often larger. Focus Appearance, 2.4.13 is AAA, not AA. Its stronger appearance criteria can be a useful design goal without being mislabeled as an AA requirement.

Inspect reflow and zoom, reduced motion and forced-colors behavior where relevant. Perform keyboard and assistive-technology checks when the environment supports them; otherwise state exactly what remains untested. A clean automated scan, grayscale image or simulation alone does not prove accessibility.

## Notes and credits

Adapted from Samuel Berthe's [frontend-design-deslop references](https://github.com/samber/cc-skills/tree/f866b800353719270a9ea101a41c5e2a2618d460/skills/frontend-design-deslop/references), under [MIT](deslop-LICENSE.txt). Use the sections relevant to the requested change; these are not instructions to build unrelated features.

- [Target Size Minimum, 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Focus Appearance, 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
