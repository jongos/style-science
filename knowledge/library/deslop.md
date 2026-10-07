# Design from purpose, then audit the result

Use this workflow for a substantial new interface, a redesign, or a request to make an interface less generic. For a small component or styling fix, use only the relevant craft and audit guidance. Explicit user direction, accessibility needs, established brand choices and the project's existing design system take precedence over stylistic novelty.

## 1. Establish purpose and constraints

Inspect the relevant implementation and existing design records first: `DESIGN.md`, `docs/DESIGN.md`, token files, component documentation and brand assets. Follow the project's actual source of truth. If documentation and implementation conflict, identify the discrepancy and resolve it within the requested scope; do not overwrite established tokens merely because a document says otherwise.

Determine the artifact, audience, primary task and constraints before choosing its visual treatment. In a composite interface, classify each region separately. Use context to propose a few descriptive words, then translate each into a concrete decision. For example, “precise” might mean aligned numeric columns and restrained motion; “welcoming” might mean readable humanist text and clear explanatory labels. These are hypotheses to check, not universal color or personality laws.

In default automatic mode, infer unspecified aesthetic choices and proceed. Ask only for an indispensable task input or a conflict between hard requirements that cannot be resolved within scope. Use the host's available question mechanism appropriately. Do not require approval of adjectives, a fixed question sequence, or a separate discovery session. State reasonable assumptions and continue authorized work; offer aesthetic questions or selectors only when the user requests control.

| Artifact | Prioritize | Useful structure | Avoid by default |
|---|---|---|---|
| Landing / marketing | A clear proposition and primary action | Product demonstration, specific evidence, narrative | Invented proof or a reflexive hero/cards/testimonials sequence |
| SaaS / admin / settings | Repeated task completion | Stable navigation, grouped controls, clear save behavior | Marketing flourishes obstructing work |
| Dashboard / analytics | The decision the data supports | Grouped metrics, comparisons, filters, readable tables | Uniformly oversized cards or unexplained metrics |
| Commerce / marketplace / pricing | Confident comparison and purchase | Visible costs, useful imagery, filters, verifiable policies | Hidden costs, manufactured urgency or fabricated reviews |
| Documentation / editorial | Reading and findability | Clear measure, headings, navigation, code/figure treatment | Centered long-form copy or decoration competing with content |
| Portfolio / brand | The work and its maker | Project evidence, distinctive composition, concise context | Hiding the work behind interface decoration |
| Mobile / embedded widget | Focused action in constrained space | Reflow, reachable controls, keyboard-safe forms | Squashed desktop layouts and hover-only actions |
| Auth / onboarding / forms | Completion without avoidable errors | Grouped fields, progress where useful, retained input | Re-entering known information or unclear validation |
| Conversation / AI interface | Legible variable-length output and control | Persistent composer, clear progress, traceable sources | Hidden stop controls, invented citations, unreadable rich output |

For decks, documents or email, apply relevant visual reasoning only when requested and defer implementation to the available artifact-specific skill. This integration does not broaden frontend-design into a universal document or marketing-writing skill.

## 2. Derive a direction rather than apply a skin

When the direction is genuinely open, derive two or three materially different candidates before choosing. Different hues on the same section layout are not distinct candidates. Describe the organizing structure, typography, density and task benefit of each; select against the brief. If the user asks for options, show the meaningful tradeoffs. Do not force random selection, create extra chats or delegate without authorization.

For a thin brief, a specific produced graphic system can provide useful structure: a field guide's comparison plates, a transport timetable's alignment, or an editorial index's hierarchy. Explain what is being transposed and why it helps this audience. Inspect supplied references, or research when current examples are necessary; do not invent references or copy protected assets. A mood word alone is not evidence of a visual system.

Commit to one coherent organizing idea before adding detail, then separately check task clarity and readability. Prefer one memorable structural or visual move that follows from the content. Existing brand systems and utilitarian tools may need consistency more than a new signature. Originality never requires breaking recognizable interactions or postponing accessibility.

## 3. Translate the direction into tokens

Use [our font workflow](typography.md) for actual coverage, weights, licensing and rendering, and [our color workflow](color-workflow.md) for perceptual ramps, brand locks and measured roles. No typeface or hue is banned merely because it is common. Inter, Roboto, system fonts, purple, cream, gradients and rounded cards can all be appropriate when justified by the brief. Avoid choosing them automatically.

Establish the necessary tokens before or alongside components:

- Type families, actual weights, sizes, line heights, measure and spacing. A modular ratio is a useful starting point, not a demand to force every size onto it.
- Semantic colors for surfaces, content, actions, feedback and focus. Preserve the helper's validated sRGB export when using it; OKLCH authoring does not require replacing verified hex values with guessed equivalents.
- Spacing rhythm, content widths, layout breakpoints, corner treatment and elevation appropriate to the existing system.
- Motion duration/easing and state behavior where interaction needs them.

Separate raw values, semantic roles and component aliases. Reuse established naming. With our color helper, functional buttons use `--color-action` and `--color-on-action`, not the unvalidated decorative `--color-accent`. Map these roles into the project's existing plain CSS, Tailwind, shadcn or other token system after checking its version and conventions. Do not introduce a second token framework or remote CSS imports solely for this workflow.

For substantial ongoing project work, record the decisions with [the design-record guide](design-record.md). Reuse the project's established document instead of creating competing authority. For a one-off snippet or minor fix, a concise explanation is enough.

## 4. Build with perceptual and interaction reasoning

Use [interface craft](interface-craft.md) selectively. The useful design principles are practical heuristics, not laws proving an aesthetic is correct:

- **Hierarchy:** establish attention order with scale, weight, spacing, position and measured contrast; avoid making every element equally loud.
- **Grouping:** proximity, alignment, repetition and shared regions communicate relationships before extra boxes are necessary.
- **Signal and noise:** remove decoration that obscures the task, while retaining labels, context and signifiers people need.
- **Discoverability:** controls must reveal their purpose and give timely feedback; keep familiar interaction conventions.
- **Cognitive effort:** group choices and provide sensible defaults without hiding important decisions. Do not derive an arbitrary item limit from a memory heuristic.
- **Density:** fit information volume to the task and device; compact does not mean cramped or inaccessible.

Use external component catalogs only when they materially help the implementation. Search a relevant subset, inspect the actual component and license, then adapt it to the chosen system. A gallery screenshot is inspiration, not code permission or proof of usable states. Existing project components remain the first option; no catalog package is installed automatically.

## 5. Audit the actual outcome

Use [the design audit](design-audit.md). Compare the actual render with the stated direction in a separate review pass. Strip color, texture and typography mentally or in a wireframe: does the information structure serve the task, or is the chosen identity only surface decoration? A familiar structure is acceptable when it is the right one; do not destroy working conventions just to be different.

Record concrete observations, fixes and unverified checks. A subjective score is not accessibility evidence. Revise specific failures within scope, then stop when the brief and relevant checks are satisfied rather than redesigning indefinitely.

## Notes and credits

Adapted on 2026-09-28 from **Samuel Berthe (samber)**, [frontend-design-deslop](https://github.com/samber/cc-skills/tree/f866b800353719270a9ea101a41c5e2a2618d460/skills/frontend-design-deslop), version 1.2.2, under [MIT](deslop-LICENSE.txt). This adaptation integrates only that folder's framework. The upstream repository's other skills, installers, agents and configuration are not dependencies.
